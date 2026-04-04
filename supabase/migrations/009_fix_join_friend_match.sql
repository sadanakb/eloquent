-- Migration 009: Fix join_friend_match to accept pre-assigned player2
-- Bug: handleChallengeFriend sets player2_id before friend joins,
-- but join_friend_match required player2_id IS NULL → always failed

CREATE OR REPLACE FUNCTION join_friend_match(p_code text, p_joiner_id uuid)
RETURNS uuid AS $$
DECLARE
  match_record matches%ROWTYPE;
BEGIN
  -- Atomic join: allow if player2 is NULL (code share) OR pre-assigned to this joiner (direct friend challenge)
  UPDATE matches
  SET player2_id = p_joiner_id, status = 'active'
  WHERE friend_code = p_code
    AND status = 'waiting'
    AND (player2_id IS NULL OR player2_id = p_joiner_id)
    AND player1_id != p_joiner_id
    AND (expires_at IS NULL OR expires_at > NOW())
  RETURNING * INTO match_record;

  IF match_record.id IS NULL THEN
    RAISE EXCEPTION 'Match nicht gefunden, bereits voll, oder abgelaufen';
  END IF;

  RETURN match_record.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
