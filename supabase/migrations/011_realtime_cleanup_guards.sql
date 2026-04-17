-- Migration 011: Realtime replica identity + cleanup/forfeit guards
--
-- Three concerns fixed here:
--
-- (1) Supabase Realtime `payload.old` is only fully populated when the table
--     has REPLICA IDENTITY FULL. Without it, transition-based event detection
--     (e.g. "opponent submitted their text") is unreliable and misfires. We
--     also keep a client-side last-seen map as belt-and-suspenders.
--
-- (2) `cleanup_stale_matches` used to forfeit ANY active match older than 1h
--     unconditionally. If both players had already submitted their texts, that
--     destroyed valid work. Now matches with both texts move to 'scoring'
--     (so the scoring pipeline can still complete them); only truly stuck
--     matches with missing texts get forfeited.
--
-- (3) `forfeit_match` updates `profiles` ELO/wins/losses. Without explicit
--     row locks, concurrent forfeits on the same player can cause lost
--     updates. We now take `FOR UPDATE` locks on both profile rows before
--     mutating them.

-- ─────────────────────────────────────────────────────────────
-- 1. REPLICA IDENTITY FULL for realtime payload.old integrity
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.matches REPLICA IDENTITY FULL;
ALTER TABLE public.matchmaking_queue REPLICA IDENTITY FULL;

-- ─────────────────────────────────────────────────────────────
-- 2. cleanup_stale_matches with text-guard
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION cleanup_stale_matches()
RETURNS void AS $$
BEGIN
  -- Delete waiting matches older than 30 minutes
  DELETE FROM matches
  WHERE status = 'waiting'
    AND created_at < NOW() - INTERVAL '30 minutes';

  -- Handle active matches older than 1 hour:
  --  - if both texts are present → move to 'scoring' (scoring pipeline finishes it)
  --  - otherwise → forfeit (incomplete work, genuinely stuck)
  UPDATE matches
  SET
    status = CASE
      WHEN player1_text IS NOT NULL AND player2_text IS NOT NULL THEN 'scoring'
      ELSE 'forfeited'
    END,
    completed_at = CASE
      WHEN player1_text IS NOT NULL AND player2_text IS NOT NULL THEN NULL
      ELSE NOW()
    END
  WHERE status = 'active'
    AND created_at < NOW() - INTERVAL '1 hour';

  -- Recover stuck scoring matches (no scores after 5 min)
  PERFORM recover_stuck_scoring();

  -- Clean up old queue entries
  DELETE FROM matchmaking_queue
  WHERE joined_at < NOW() - INTERVAL '5 minutes';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─────────────────────────────────────────────────────────────
-- 3. forfeit_match with FOR UPDATE locks on both profile rows
--    (prevents lost ELO updates under concurrency)
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION forfeit_match(p_match_id uuid, p_forfeiter_id uuid)
RETURNS void AS $$
DECLARE
  v_match matches%ROWTYPE;
  v_winner uuid;
  v_loser uuid;
  v_winner_profile profiles%ROWTYPE;
  v_loser_profile profiles%ROWTYPE;
BEGIN
  -- Lock match row to serialize concurrent forfeits
  SELECT * INTO v_match FROM matches WHERE id = p_match_id FOR UPDATE;

  IF v_match IS NULL THEN
    RAISE EXCEPTION 'Match nicht gefunden';
  END IF;

  -- Idempotency: already ended — silently return
  IF v_match.status IN ('completed', 'forfeited') THEN
    RETURN;
  END IF;

  -- Guard: if both texts are present, scoring MUST run (protects valid work).
  IF v_match.player1_text IS NOT NULL AND v_match.player2_text IS NOT NULL THEN
    IF v_match.status = 'active' THEN
      UPDATE matches SET status = 'scoring' WHERE id = p_match_id;
    END IF;
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

  -- Lock profile rows BEFORE mutation to avoid lost updates under concurrency.
  -- Order by uuid to keep a consistent lock order and prevent deadlocks
  -- between two forfeit_match invocations running in parallel.
  IF v_winner IS NOT NULL AND v_loser IS NOT NULL THEN
    IF v_winner < v_loser THEN
      SELECT * INTO v_winner_profile FROM profiles WHERE id = v_winner FOR UPDATE;
      SELECT * INTO v_loser_profile  FROM profiles WHERE id = v_loser  FOR UPDATE;
    ELSE
      SELECT * INTO v_loser_profile  FROM profiles WHERE id = v_loser  FOR UPDATE;
      SELECT * INTO v_winner_profile FROM profiles WHERE id = v_winner FOR UPDATE;
    END IF;
  ELSIF v_winner IS NOT NULL THEN
    SELECT * INTO v_winner_profile FROM profiles WHERE id = v_winner FOR UPDATE;
  ELSIF v_loser IS NOT NULL THEN
    SELECT * INTO v_loser_profile FROM profiles WHERE id = v_loser FOR UPDATE;
  END IF;

  UPDATE matches SET
    status = 'forfeited',
    winner_id = v_winner,
    completed_at = NOW()
  WHERE id = p_match_id;

  IF v_winner IS NOT NULL THEN
    UPDATE profiles SET
      elo_rating = LEAST(10000, COALESCE(elo_rating, 400) + 20),
      wins = COALESCE(wins, 0) + 1,
      total_games = COALESCE(total_games, 0) + 1
    WHERE id = v_winner;
  END IF;

  IF v_loser IS NOT NULL THEN
    UPDATE profiles SET
      elo_rating = GREATEST(0, COALESCE(elo_rating, 400) - 20),
      losses = COALESCE(losses, 0) + 1,
      total_games = COALESCE(total_games, 0) + 1
    WHERE id = v_loser;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
