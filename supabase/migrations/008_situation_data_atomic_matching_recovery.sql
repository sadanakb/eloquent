-- Migration 008: Situation data, atomic matchmaking, scoring recovery, idempotent forfeit
-- Fixes: Missing situation context in scoring, matchmaking race conditions,
--        stuck scoring state, double-forfeit ELO bug

-- 1. Add situation_data column for Edge Function scoring context
ALTER TABLE matches ADD COLUMN IF NOT EXISTS situation_data jsonb;

-- 2. Recover stuck matches (scoring state with no scores after 5 min)
CREATE OR REPLACE FUNCTION recover_stuck_scoring()
RETURNS void AS $$
BEGIN
  UPDATE matches
  SET status = 'active'
  WHERE status = 'scoring'
    AND created_at < NOW() - INTERVAL '5 minutes'
    AND player1_score IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Atomic matchmaking — prevents double-match race condition
-- Uses FOR UPDATE SKIP LOCKED to ensure only ONE player claims an opponent
CREATE OR REPLACE FUNCTION find_and_create_match(
  p_user_id uuid,
  p_elo int,
  p_elo_range int,
  p_situation_id text,
  p_situation_data jsonb
) RETURNS uuid AS $$
DECLARE
  v_opponent matchmaking_queue%ROWTYPE;
  v_match_id uuid;
BEGIN
  -- Atomically lock one opponent within ELO range
  SELECT * INTO v_opponent FROM matchmaking_queue
  WHERE user_id != p_user_id
    AND elo_rating BETWEEN (p_elo - p_elo_range) AND (p_elo + p_elo_range)
    AND joined_at > NOW() - INTERVAL '2 minutes'
  ORDER BY joined_at ASC
  LIMIT 1
  FOR UPDATE SKIP LOCKED;

  IF v_opponent IS NULL THEN
    RETURN NULL;
  END IF;

  -- Create match
  INSERT INTO matches (player1_id, player2_id, situation_id, situation_data, status)
  VALUES (p_user_id, v_opponent.user_id, p_situation_id, p_situation_data, 'active')
  RETURNING id INTO v_match_id;

  -- Remove both players from queue
  DELETE FROM matchmaking_queue WHERE user_id IN (p_user_id, v_opponent.user_id);

  RETURN v_match_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Idempotent forfeit — safe against double-calls and network retries
CREATE OR REPLACE FUNCTION forfeit_match(p_match_id uuid, p_forfeiter_id uuid)
RETURNS void AS $$
DECLARE
  v_match matches%ROWTYPE;
  v_winner uuid;
  v_loser uuid;
BEGIN
  -- Lock row to prevent concurrent forfeits
  SELECT * INTO v_match FROM matches WHERE id = p_match_id FOR UPDATE;

  IF v_match IS NULL THEN
    RAISE EXCEPTION 'Match nicht gefunden';
  END IF;

  -- Idempotency: already ended — silently return instead of error
  IF v_match.status IN ('completed', 'forfeited') THEN
    RETURN;
  END IF;

  -- Determine winner/loser
  IF v_match.player1_id = p_forfeiter_id THEN
    v_winner := v_match.player2_id;
    v_loser := v_match.player1_id;
  ELSIF v_match.player2_id = p_forfeiter_id THEN
    v_winner := v_match.player1_id;
    v_loser := v_match.player2_id;
  ELSE
    RAISE EXCEPTION 'Spieler ist nicht Teil dieses Matches';
  END IF;

  -- Update match status
  UPDATE matches SET
    status = 'forfeited',
    winner_id = v_winner,
    completed_at = NOW()
  WHERE id = p_match_id;

  -- Update winner stats (only if winner exists)
  IF v_winner IS NOT NULL THEN
    UPDATE profiles SET
      elo_rating = LEAST(10000, COALESCE(elo_rating, 400) + 20),
      wins = COALESCE(wins, 0) + 1,
      total_games = COALESCE(total_games, 0) + 1
    WHERE id = v_winner;
  END IF;

  -- Update loser stats
  UPDATE profiles SET
    elo_rating = GREATEST(0, COALESCE(elo_rating, 400) - 20),
    losses = COALESCE(losses, 0) + 1,
    total_games = COALESCE(total_games, 0) + 1
  WHERE id = v_loser;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Update cleanup to also recover stuck scoring
CREATE OR REPLACE FUNCTION cleanup_stale_matches()
RETURNS void AS $$
BEGIN
  -- Delete waiting matches older than 30 minutes
  DELETE FROM matches
  WHERE status = 'waiting'
    AND created_at < NOW() - INTERVAL '30 minutes';

  -- Auto-forfeit active matches older than 1 hour
  UPDATE matches SET status = 'forfeited', completed_at = NOW()
  WHERE status = 'active'
    AND created_at < NOW() - INTERVAL '1 hour';

  -- Recover stuck scoring matches (no scores after 5 min)
  PERFORM recover_stuck_scoring();

  -- Clean up old queue entries
  DELETE FROM matchmaking_queue
  WHERE joined_at < NOW() - INTERVAL '5 minutes';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- NOTE: To schedule automatic cleanup, enable pg_cron in Supabase Dashboard
-- (Database > Extensions > pg_cron), then run:
-- SELECT cron.schedule('cleanup-stale', '*/15 * * * *', 'SELECT cleanup_stale_matches()');
