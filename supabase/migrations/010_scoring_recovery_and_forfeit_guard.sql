-- Migration 010: Scoring recovery + forfeit guard
-- Root cause fixes for the "all matches end up forfeited with null scores" bug.
--
-- FIX 1: forfeit_match must REFUSE to forfeit a match where both players
--        already submitted texts. In that case scoring MUST run and score
--        the actual texts — a disconnect/presence-timeout cannot erase that work.
--
-- FIX 2: Add complete_match_with_scores RPC so clients can atomically write
--        scores even if the match somehow ended up in 'forfeited' status
--        (self-healing path). Uses row-level lock to serialize.
--
-- FIX 3: submit_match_text becomes tolerant of same-player re-submits when
--        status is already 'scoring' (returns current row instead of throwing)
--        so that UI retries after transient network errors don't hard-fail.

-- ─────────────────────────────────────────────────────────────
-- 1. forfeit_match: refuse if both texts already submitted
-- ─────────────────────────────────────────────────────────────
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

  -- Idempotency: already ended — silently return
  IF v_match.status IN ('completed', 'forfeited') THEN
    RETURN;
  END IF;

  -- NEW GUARD: If both texts already present, this match MUST be scored.
  -- A forfeit at this stage (caused by presence timeout or user rage-quit)
  -- would destroy valid submissions. Silently ignore the forfeit request.
  IF v_match.player1_text IS NOT NULL AND v_match.player2_text IS NOT NULL THEN
    -- Ensure status is at least 'scoring' so a pending scoring invocation
    -- or the client fallback can claim it.
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

  UPDATE profiles SET
    elo_rating = GREATEST(0, COALESCE(elo_rating, 400) - 20),
    losses = COALESCE(losses, 0) + 1,
    total_games = COALESCE(total_games, 0) + 1
  WHERE id = v_loser;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─────────────────────────────────────────────────────────────
-- 2. complete_match_with_scores: client-driven scoring finalization
--    Atomically writes scores + winner + ELO updates, even if match
--    got stuck in 'forfeited' or 'scoring' state. Idempotent: if
--    scores already set, returns the current match silently.
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION complete_match_with_scores(
  p_match_id uuid,
  p_player1_score numeric,
  p_player2_score numeric,
  p_scoring_method text DEFAULT 'client'
)
RETURNS matches AS $$
DECLARE
  v_match matches%ROWTYPE;
  v_winner uuid;
  v_p1_profile profiles%ROWTYPE;
  v_p2_profile profiles%ROWTYPE;
  v_k1 int;
  v_k2 int;
  v_expected1 numeric;
  v_expected2 numeric;
  v_actual1 numeric;
  v_actual2 numeric;
  v_new_p1_elo int;
  v_new_p2_elo int;
BEGIN
  -- Lock match to serialize concurrent invocations
  SELECT * INTO v_match FROM matches WHERE id = p_match_id FOR UPDATE;
  IF v_match IS NULL THEN
    RAISE EXCEPTION 'Match nicht gefunden';
  END IF;

  -- Authorization: caller must be one of the players
  IF v_match.player1_id != auth.uid() AND v_match.player2_id != auth.uid() THEN
    RAISE EXCEPTION 'Nicht autorisiert für dieses Match';
  END IF;

  -- Idempotency: already scored
  IF v_match.player1_score IS NOT NULL THEN
    RETURN v_match;
  END IF;

  -- Need both texts to score
  IF v_match.player1_text IS NULL OR v_match.player2_text IS NULL THEN
    RAISE EXCEPTION 'Beide Texte müssen vorhanden sein';
  END IF;

  -- Determine winner
  IF p_player1_score > p_player2_score THEN
    v_winner := v_match.player1_id;
  ELSIF p_player2_score > p_player1_score THEN
    v_winner := v_match.player2_id;
  ELSE
    v_winner := NULL;
  END IF;

  -- Load both profiles for ELO calc
  SELECT * INTO v_p1_profile FROM profiles WHERE id = v_match.player1_id FOR UPDATE;
  SELECT * INTO v_p2_profile FROM profiles WHERE id = v_match.player2_id FOR UPDATE;

  v_k1 := CASE WHEN COALESCE(v_p1_profile.total_games, 0) < 30 THEN 32 ELSE 16 END;
  v_k2 := CASE WHEN COALESCE(v_p2_profile.total_games, 0) < 30 THEN 32 ELSE 16 END;

  v_expected1 := 1 / (1 + POWER(10,
    (COALESCE(v_p2_profile.elo_rating, 400) - COALESCE(v_p1_profile.elo_rating, 400)) / 400.0));
  v_expected2 := 1 - v_expected1;

  IF v_winner = v_match.player1_id THEN
    v_actual1 := 1; v_actual2 := 0;
  ELSIF v_winner = v_match.player2_id THEN
    v_actual1 := 0; v_actual2 := 1;
  ELSE
    v_actual1 := 0.5; v_actual2 := 0.5;
  END IF;

  v_new_p1_elo := GREATEST(0, LEAST(10000,
    ROUND(COALESCE(v_p1_profile.elo_rating, 400) + v_k1 * (v_actual1 - v_expected1))));
  v_new_p2_elo := GREATEST(0, LEAST(10000,
    ROUND(COALESCE(v_p2_profile.elo_rating, 400) + v_k2 * (v_actual2 - v_expected2))));

  -- Update match
  UPDATE matches SET
    player1_score = p_player1_score,
    player2_score = p_player2_score,
    winner_id = v_winner,
    status = 'completed',
    scoring_method = p_scoring_method,
    completed_at = NOW()
  WHERE id = p_match_id
  RETURNING * INTO v_match;

  -- Update player profiles
  UPDATE profiles SET
    elo_rating = v_new_p1_elo,
    wins = COALESCE(wins, 0) + CASE WHEN v_winner = v_match.player1_id THEN 1 ELSE 0 END,
    losses = COALESCE(losses, 0) + CASE WHEN v_winner = v_match.player2_id THEN 1 ELSE 0 END,
    draws = COALESCE(draws, 0) + CASE WHEN v_winner IS NULL THEN 1 ELSE 0 END,
    total_games = COALESCE(total_games, 0) + 1
  WHERE id = v_match.player1_id;

  UPDATE profiles SET
    elo_rating = v_new_p2_elo,
    wins = COALESCE(wins, 0) + CASE WHEN v_winner = v_match.player2_id THEN 1 ELSE 0 END,
    losses = COALESCE(losses, 0) + CASE WHEN v_winner = v_match.player1_id THEN 1 ELSE 0 END,
    draws = COALESCE(draws, 0) + CASE WHEN v_winner IS NULL THEN 1 ELSE 0 END,
    total_games = COALESCE(total_games, 0) + 1
  WHERE id = v_match.player2_id;

  RETURN v_match;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─────────────────────────────────────────────────────────────
-- 3. submit_match_text: tolerate retries on already-scoring matches
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION submit_match_text(p_match_id uuid, p_player_id uuid, p_text text)
RETURNS matches AS $$
DECLARE
  match_record matches%ROWTYPE;
BEGIN
  IF length(p_text) < 1 OR length(p_text) > 5000 THEN
    RAISE EXCEPTION 'Text muss zwischen 1 und 5000 Zeichen sein';
  END IF;

  -- Load match WITH ROW LOCK
  SELECT * INTO match_record FROM matches WHERE id = p_match_id FOR UPDATE;
  IF match_record IS NULL THEN
    RAISE EXCEPTION 'Match nicht gefunden';
  END IF;

  -- Allow re-submit idempotency: if the caller has already submitted, and
  -- status is 'scoring' or 'completed', just return the current record.
  IF match_record.player1_id = p_player_id AND match_record.player1_text IS NOT NULL THEN
    RETURN match_record;
  END IF;
  IF match_record.player2_id = p_player_id AND match_record.player2_text IS NOT NULL THEN
    RETURN match_record;
  END IF;

  IF match_record.status != 'active' THEN
    RAISE EXCEPTION 'Match ist nicht mehr aktiv';
  END IF;

  IF match_record.player1_id = p_player_id THEN
    UPDATE matches SET player1_text = p_text WHERE id = p_match_id;
  ELSIF match_record.player2_id = p_player_id THEN
    UPDATE matches SET player2_text = p_text WHERE id = p_match_id;
  ELSE
    RAISE EXCEPTION 'Spieler ist nicht Teil dieses Matches';
  END IF;

  -- Re-read with lock and transition to 'scoring' if both texts present
  SELECT * INTO match_record FROM matches WHERE id = p_match_id FOR UPDATE;
  IF match_record.player1_text IS NOT NULL AND match_record.player2_text IS NOT NULL THEN
    UPDATE matches SET status = 'scoring' WHERE id = p_match_id;
    SELECT * INTO match_record FROM matches WHERE id = p_match_id;
  END IF;

  RETURN match_record;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant authenticated users permission to call the recovery RPC
GRANT EXECUTE ON FUNCTION complete_match_with_scores(uuid, numeric, numeric, text) TO authenticated;
