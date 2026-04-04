-- ============================================================
-- Migration 007: Fix race condition in submit_match_text
--
-- BUG: Both players submit simultaneously, neither triggers scoring.
-- CAUSE: SELECT without FOR UPDATE — both transactions read stale data.
-- FIX: FOR UPDATE lock serializes concurrent submissions.
-- ============================================================

CREATE OR REPLACE FUNCTION submit_match_text(p_match_id uuid, p_player_id uuid, p_text text)
RETURNS matches AS $$
DECLARE
  match_record matches%ROWTYPE;
BEGIN
  -- Validate text length
  IF length(p_text) < 1 OR length(p_text) > 5000 THEN
    RAISE EXCEPTION 'Text muss zwischen 1 und 5000 Zeichen sein';
  END IF;

  -- Load match WITH ROW LOCK to prevent race conditions
  SELECT * INTO match_record FROM matches WHERE id = p_match_id FOR UPDATE;
  IF match_record IS NULL THEN
    RAISE EXCEPTION 'Match nicht gefunden';
  END IF;
  IF match_record.status != 'active' THEN
    RAISE EXCEPTION 'Match ist nicht mehr aktiv';
  END IF;

  -- Determine which field to set and prevent double-submit
  IF match_record.player1_id = p_player_id THEN
    IF match_record.player1_text IS NOT NULL THEN
      RAISE EXCEPTION 'Text bereits abgegeben';
    END IF;
    UPDATE matches SET player1_text = p_text WHERE id = p_match_id;
  ELSIF match_record.player2_id = p_player_id THEN
    IF match_record.player2_text IS NOT NULL THEN
      RAISE EXCEPTION 'Text bereits abgegeben';
    END IF;
    UPDATE matches SET player2_text = p_text WHERE id = p_match_id;
  ELSE
    RAISE EXCEPTION 'Spieler ist nicht Teil dieses Matches';
  END IF;

  -- Re-read with lock to check if both texts are now submitted
  SELECT * INTO match_record FROM matches WHERE id = p_match_id FOR UPDATE;
  IF match_record.player1_text IS NOT NULL AND match_record.player2_text IS NOT NULL THEN
    UPDATE matches SET status = 'scoring' WHERE id = p_match_id;
    SELECT * INTO match_record FROM matches WHERE id = p_match_id;
  END IF;

  RETURN match_record;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
