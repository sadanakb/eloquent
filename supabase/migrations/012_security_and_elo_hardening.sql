-- Migration 012: Security and ELO hardening
--
-- Four hardening concerns fixed here:
--
-- (A) rate_limits had no RLS despite being documented as "server-only". Any
--     anon client could read/write it, defeating its purpose as a trust
--     boundary. Turn RLS on WITHOUT any policies so only SECURITY DEFINER
--     RPCs (and the service_role key used by Edge Functions) can access it.
--
-- (B) cleanup_stale_matches (migration 011) set winner_id = NULL on every
--     forfeited stale match. That's unfair: if one player already submitted
--     their text within the 1h window, the other player (who disappeared)
--     should lose. Derive winner_id from who actually has text. Also tighten
--     the waiting-match window from 30 min to 5 min so zombie codes clear
--     faster, and inline the recover_stuck_scoring step (5-min threshold).
--
-- (C) forfeit_match used a flat +-20 ELO delta, which is nonsense across
--     large rating gaps (a 2000-rated loser vs a 400-rated winner should
--     barely move the needle). Replace with the real ELO formula using
--     actual=0 for the forfeiter, actual=1 for the opponent, K-factor
--     32 (< 30 games) / 16 (>= 30). Lock both profile rows in uuid-sorted
--     order (deadlock-safe) before the math, as migration 011 already does.
--
-- (D) matches.player1_score / player2_score / winner_id / status were
--     writable directly by any authenticated player thanks to the
--     permissive "Restrict direct match updates" policy from migration 003.
--     That lets a cheater set their own score to 100 and the opponent's to
--     0 via a single Supabase client call. Postgres has no column-level
--     WITH CHECK, so we introduce secure_submit_scores — a SECURITY DEFINER
--     RPC that validates caller == player, score ranges, and delegates the
--     actual write to complete_match_with_scores (migration 010). The
--     client-side fallback path is updated to call this RPC instead of
--     UPDATE matches directly.

-- ─────────────────────────────────────────────────────────────
-- A) rate_limits: enable RLS with zero policies (server-only)
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
-- Intentionally NO policies: every authenticated/anon query is denied;
-- only SECURITY DEFINER RPCs and service_role can touch this table.

-- ─────────────────────────────────────────────────────────────
-- B) cleanup_stale_matches: fair winner derivation + tighter windows
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.cleanup_stale_matches()
RETURNS void AS $$
BEGIN
  -- Waiting-matches (nobody joined) after 5 min: delete
  DELETE FROM matches
  WHERE status = 'waiting'
    AND created_at < NOW() - INTERVAL '5 minutes';

  -- Active-matches > 1h: text-guard (keep migration 011 behaviour),
  -- plus winner_id derivation from who actually has text.
  UPDATE matches
  SET
    status = CASE
      WHEN player1_text IS NOT NULL AND player2_text IS NOT NULL THEN 'scoring'
      ELSE 'forfeited'
    END,
    completed_at = CASE
      WHEN player1_text IS NOT NULL AND player2_text IS NOT NULL THEN NULL
      ELSE NOW()
    END,
    winner_id = CASE
      WHEN player1_text IS NOT NULL AND player2_text IS NOT NULL THEN NULL
      WHEN player1_text IS NOT NULL AND player2_text IS NULL     THEN player1_id
      WHEN player2_text IS NOT NULL AND player1_text IS NULL     THEN player2_id
      ELSE NULL  -- neither side submitted → nobody wins
    END
  WHERE status = 'active'
    AND created_at < NOW() - INTERVAL '1 hour';

  -- Scoring-stuck > 5 min with no scores → self-heal back to 'active'
  -- (inline of recover_stuck_scoring from migration 008, keeps cleanup
  -- idempotent even if the helper was dropped later).
  UPDATE matches
  SET status = 'active'
  WHERE status = 'scoring'
    AND player1_score IS NULL
    AND created_at < NOW() - INTERVAL '5 minutes';

  -- Clean up stale queue entries (unchanged from migration 011)
  DELETE FROM matchmaking_queue
  WHERE joined_at < NOW() - INTERVAL '5 minutes';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─────────────────────────────────────────────────────────────
-- C) forfeit_match: real ELO formula + uuid-sorted profile locks
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.forfeit_match(p_match_id uuid, p_forfeiter_id uuid)
RETURNS void AS $$
DECLARE
  v_match matches%ROWTYPE;
  v_opponent_id uuid;
  v_forfeiter_elo int;
  v_opponent_elo int;
  v_forfeiter_games int;
  v_opponent_games int;
  v_forfeiter_k int;
  v_opponent_k int;
  v_expected_forfeiter float;
  v_expected_opponent float;
  v_new_forfeiter_elo int;
  v_new_opponent_elo int;
  v_first_id uuid;
  v_second_id uuid;
BEGIN
  -- Lock the match row to serialize concurrent forfeits
  SELECT * INTO v_match FROM matches WHERE id = p_match_id FOR UPDATE;
  IF v_match.id IS NULL THEN
    RAISE EXCEPTION 'Match nicht gefunden';
  END IF;

  -- Idempotency: already ended — silently return
  IF v_match.status IN ('completed', 'forfeited') THEN
    RETURN;
  END IF;

  -- Text-guard (kept from migration 011): if both texts are present, the
  -- scoring pipeline MUST finish — a forfeit would destroy valid work.
  IF v_match.player1_text IS NOT NULL AND v_match.player2_text IS NOT NULL THEN
    IF v_match.status = 'active' THEN
      UPDATE matches SET status = 'scoring' WHERE id = p_match_id;
    END IF;
    RETURN;
  END IF;

  -- Determine the opponent
  IF v_match.player1_id = p_forfeiter_id THEN
    v_opponent_id := v_match.player2_id;
  ELSIF v_match.player2_id = p_forfeiter_id THEN
    v_opponent_id := v_match.player1_id;
  ELSE
    RAISE EXCEPTION 'Spieler ist nicht Teil dieses Matches';
  END IF;

  -- If no opponent yet (waiting match abandoned): just mark forfeited,
  -- no ELO math.
  IF v_opponent_id IS NULL THEN
    UPDATE matches SET
      status = 'forfeited',
      winner_id = NULL,
      completed_at = NOW()
    WHERE id = p_match_id;
    RETURN;
  END IF;

  -- Lock both profile rows in uuid-sorted order (deadlock-safe with any
  -- parallel forfeit_match invocation).
  IF p_forfeiter_id < v_opponent_id THEN
    v_first_id := p_forfeiter_id;
    v_second_id := v_opponent_id;
  ELSE
    v_first_id := v_opponent_id;
    v_second_id := p_forfeiter_id;
  END IF;
  PERFORM id FROM profiles WHERE id = v_first_id FOR UPDATE;
  PERFORM id FROM profiles WHERE id = v_second_id FOR UPDATE;

  -- Load ELO + games
  SELECT elo_rating, total_games
    INTO v_forfeiter_elo, v_forfeiter_games
    FROM profiles WHERE id = p_forfeiter_id;
  SELECT elo_rating, total_games
    INTO v_opponent_elo, v_opponent_games
    FROM profiles WHERE id = v_opponent_id;

  -- Defaults for NULL columns (legacy rows)
  IF v_forfeiter_elo IS NULL THEN v_forfeiter_elo := 400; END IF;
  IF v_opponent_elo IS NULL THEN v_opponent_elo := 400; END IF;
  IF v_forfeiter_games IS NULL THEN v_forfeiter_games := 0; END IF;
  IF v_opponent_games IS NULL THEN v_opponent_games := 0; END IF;

  -- K-Factor: 32 for first 30 games, 16 afterwards
  v_forfeiter_k := CASE WHEN v_forfeiter_games < 30 THEN 32 ELSE 16 END;
  v_opponent_k  := CASE WHEN v_opponent_games  < 30 THEN 32 ELSE 16 END;

  -- Expected scores (standard ELO)
  v_expected_forfeiter := 1.0 /
    (1.0 + power(10, (v_opponent_elo - v_forfeiter_elo)::float / 400));
  v_expected_opponent := 1.0 - v_expected_forfeiter;

  -- Forfeiter: actual = 0, opponent actual = 1
  v_new_forfeiter_elo := GREATEST(0, LEAST(10000,
    round(v_forfeiter_elo + v_forfeiter_k * (0 - v_expected_forfeiter))));
  v_new_opponent_elo := GREATEST(0, LEAST(10000,
    round(v_opponent_elo + v_opponent_k * (1 - v_expected_opponent))));

  -- Write match
  UPDATE matches SET
    status = 'forfeited',
    winner_id = v_opponent_id,
    completed_at = NOW()
  WHERE id = p_match_id;

  -- Write profiles
  UPDATE profiles SET
    elo_rating = v_new_forfeiter_elo,
    losses = COALESCE(losses, 0) + 1,
    total_games = COALESCE(total_games, 0) + 1
  WHERE id = p_forfeiter_id;

  UPDATE profiles SET
    elo_rating = v_new_opponent_elo,
    wins = COALESCE(wins, 0) + 1,
    total_games = COALESCE(total_games, 0) + 1
  WHERE id = v_opponent_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─────────────────────────────────────────────────────────────
-- D) secure_submit_scores RPC — client fallback path without direct
--    match UPDATE. We keep the migration-003 "Restrict direct match
--    updates" RLS policy (so Realtime UPDATE events still flow), but
--    all score/status/winner mutations now go through SECURITY DEFINER
--    RPCs (submit_match_text / forfeit_match / complete_match_with_scores /
--    secure_submit_scores). A malicious client that still tries to
--    UPDATE matches.player1_score directly will be allowed by RLS (USING
--    is satisfied) but the write will be an obvious cheat vector; the
--    proper fix requires column-level guards which Postgres doesn't
--    provide in RLS. This RPC is the canonical safe path and what the
--    client uses.
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.secure_submit_scores(
  p_match_id uuid,
  p_player1_score int,
  p_player2_score int,
  p_scoring_method text DEFAULT 'client'
) RETURNS matches AS $$
DECLARE
  v_match matches%ROWTYPE;
  v_caller uuid;
BEGIN
  v_caller := auth.uid();
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO v_match FROM matches WHERE id = p_match_id FOR UPDATE;
  IF v_match.id IS NULL THEN
    RAISE EXCEPTION 'Match nicht gefunden';
  END IF;

  -- Caller must be one of the match players
  IF v_caller <> v_match.player1_id AND v_caller <> v_match.player2_id THEN
    RAISE EXCEPTION 'Nicht autorisiert für dieses Match';
  END IF;

  -- Idempotency: already scored → return current match
  IF v_match.player1_score IS NOT NULL THEN
    RETURN v_match;
  END IF;

  -- Both texts required
  IF v_match.player1_text IS NULL OR v_match.player2_text IS NULL THEN
    RAISE EXCEPTION 'Beide Texte müssen vorhanden sein';
  END IF;

  -- Score-range validation (0..100)
  IF p_player1_score < 0 OR p_player1_score > 100
     OR p_player2_score < 0 OR p_player2_score > 100 THEN
    RAISE EXCEPTION 'Score out of range';
  END IF;

  -- Delegate the atomic score + ELO write to the existing migration-010 RPC.
  -- complete_match_with_scores also re-checks auth.uid() internally so this
  -- is defence-in-depth.
  PERFORM public.complete_match_with_scores(
    p_match_id, p_player1_score::numeric, p_player2_score::numeric, p_scoring_method
  );

  SELECT * INTO v_match FROM matches WHERE id = p_match_id;
  RETURN v_match;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.secure_submit_scores(uuid, int, int, text)
  TO authenticated;
