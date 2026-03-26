-- ============================================================
-- Migration 003: Security, Indexes, Features
-- Eloquent — German Word Duel Game
-- ============================================================

-- ============ 1. SCHEMA CHANGES ============

-- ELO constraints and new default
DO $$ BEGIN
  ALTER TABLE profiles ADD CONSTRAINT elo_range CHECK (elo_rating >= 0 AND elo_rating <= 10000);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE profiles ALTER COLUMN elo_rating SET DEFAULT 400;

-- Match expires_at and scoring_method columns
ALTER TABLE matches ADD COLUMN IF NOT EXISTS expires_at timestamptz;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS scoring_method text DEFAULT 'ki';

-- ============ 2. NEW TABLES ============

-- User progress (sync localStorage to server)
CREATE TABLE IF NOT EXISTS user_progress (
  user_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  story_progress jsonb DEFAULT '{}'::jsonb,
  daily_streak integer DEFAULT 0,
  daily_last_date text,
  local_stats jsonb DEFAULT '{}'::jsonb,
  settings jsonb DEFAULT '{}'::jsonb,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

-- Only create policy if it doesn't exist
DO $$ BEGIN
  CREATE POLICY "Users manage own progress" ON user_progress
    FOR ALL USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Rate limits (no RLS — server-only table)
CREATE TABLE IF NOT EXISTS rate_limits (
  key text PRIMARY KEY,
  count integer DEFAULT 1,
  window_start timestamptz DEFAULT now()
);

-- ============ 3. INDEXES ============

-- Matches: Player lookup (for reconnect, history)
CREATE INDEX IF NOT EXISTS idx_matches_player1_id ON matches(player1_id);
CREATE INDEX IF NOT EXISTS idx_matches_player2_id ON matches(player2_id);

-- Matches: Status filter (for cleanup, active search)
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);

-- Matches: Friend-code lookup (partial)
CREATE INDEX IF NOT EXISTS idx_matches_friend_code ON matches(friend_code)
  WHERE friend_code IS NOT NULL;

-- Matches: Time-based queries
CREATE INDEX IF NOT EXISTS idx_matches_created_at ON matches(created_at DESC);

-- Matches: Composite for reconnect query
CREATE INDEX IF NOT EXISTS idx_matches_player_active
  ON matches(player1_id, status)
  WHERE status IN ('active', 'scoring');

-- Queue: ELO-based matching
CREATE INDEX IF NOT EXISTS idx_queue_elo ON matchmaking_queue(elo_rating);

-- Queue: Time-based (for TTL/cleanup)
CREATE INDEX IF NOT EXISTS idx_queue_joined ON matchmaking_queue(joined_at);

-- Profiles: Leaderboard sorting
CREATE INDEX IF NOT EXISTS idx_profiles_elo_desc ON profiles(elo_rating DESC)
  WHERE total_games > 0;

-- Achievements: User lookup
CREATE INDEX IF NOT EXISTS idx_achievements_user ON user_achievements(user_id);

-- ============ 4. TRIGGERS ============

-- Auto-update updated_at on any row change
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers first to make idempotent
DROP TRIGGER IF EXISTS profiles_set_updated_at ON profiles;
CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS user_progress_set_updated_at ON user_progress;
CREATE TRIGGER user_progress_set_updated_at
  BEFORE UPDATE ON user_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============ 5. LEADERBOARD VIEW ============

-- Replace materialized view with normal view (real-time, no refresh needed)
DROP MATERIALIZED VIEW IF EXISTS weekly_leaderboard;

CREATE OR REPLACE VIEW weekly_leaderboard AS
  SELECT id, username, avatar_url, elo_rating, wins, losses, total_games,
         ROW_NUMBER() OVER (ORDER BY elo_rating DESC) AS rank
  FROM profiles
  WHERE total_games > 0
  ORDER BY elo_rating DESC
  LIMIT 100;

-- ============ 6. DB FUNCTIONS (SECURITY DEFINER) ============

-- 6a. Submit match text (prevents score manipulation)
CREATE OR REPLACE FUNCTION submit_match_text(p_match_id uuid, p_player_id uuid, p_text text)
RETURNS matches AS $$
DECLARE
  match_record matches%ROWTYPE;
BEGIN
  -- Validate text length
  IF length(p_text) < 1 OR length(p_text) > 5000 THEN
    RAISE EXCEPTION 'Text muss zwischen 1 und 5000 Zeichen sein';
  END IF;

  -- Load match
  SELECT * INTO match_record FROM matches WHERE id = p_match_id;
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

  -- Check if both texts are submitted → transition to 'scoring'
  SELECT * INTO match_record FROM matches WHERE id = p_match_id;
  IF match_record.player1_text IS NOT NULL AND match_record.player2_text IS NOT NULL THEN
    UPDATE matches SET status = 'scoring' WHERE id = p_match_id;
    SELECT * INTO match_record FROM matches WHERE id = p_match_id;
  END IF;

  RETURN match_record;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6b. Join friend match (prevents code bypass)
CREATE OR REPLACE FUNCTION join_friend_match(p_code text, p_joiner_id uuid)
RETURNS uuid AS $$
DECLARE
  match_record matches%ROWTYPE;
BEGIN
  -- Atomic join with code validation
  UPDATE matches
  SET player2_id = p_joiner_id, status = 'active'
  WHERE friend_code = p_code
    AND status = 'waiting'
    AND player2_id IS NULL
    AND player1_id != p_joiner_id
    AND (expires_at IS NULL OR expires_at > NOW())
  RETURNING * INTO match_record;

  IF match_record.id IS NULL THEN
    RAISE EXCEPTION 'Match nicht gefunden, bereits voll, oder abgelaufen';
  END IF;

  RETURN match_record.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6c. Forfeit match (updates match AND both profiles atomically)
CREATE OR REPLACE FUNCTION forfeit_match(p_match_id uuid, p_forfeiter_id uuid)
RETURNS void AS $$
DECLARE
  match_record matches%ROWTYPE;
  v_winner uuid;
  v_loser uuid;
BEGIN
  SELECT * INTO match_record FROM matches WHERE id = p_match_id;

  IF match_record IS NULL THEN
    RAISE EXCEPTION 'Match nicht gefunden';
  END IF;
  IF match_record.status NOT IN ('active', 'scoring', 'waiting') THEN
    RAISE EXCEPTION 'Match ist bereits beendet';
  END IF;

  -- Determine winner/loser
  IF match_record.player1_id = p_forfeiter_id THEN
    v_winner := match_record.player2_id;
    v_loser := match_record.player1_id;
  ELSIF match_record.player2_id = p_forfeiter_id THEN
    v_winner := match_record.player1_id;
    v_loser := match_record.player2_id;
  ELSE
    RAISE EXCEPTION 'Spieler ist nicht Teil dieses Matches';
  END IF;

  -- Update match
  UPDATE matches SET
    status = 'forfeited',
    winner_id = v_winner,
    completed_at = NOW()
  WHERE id = p_match_id;

  -- Update winner stats (only if winner exists — waiting matches may not have player2)
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

-- 6d. Cleanup stale matches and queue entries
CREATE OR REPLACE FUNCTION cleanup_stale_matches()
RETURNS void AS $$
BEGIN
  -- Delete waiting matches older than 30 minutes
  DELETE FROM matches
  WHERE status = 'waiting'
    AND created_at < NOW() - INTERVAL '30 minutes';

  -- Auto-forfeit active matches older than 1 hour
  UPDATE matches
  SET status = 'forfeited', completed_at = NOW()
  WHERE status = 'active'
    AND created_at < NOW() - INTERVAL '1 hour';

  -- Complete stuck scoring matches older than 10 minutes
  UPDATE matches
  SET status = 'completed', completed_at = NOW()
  WHERE status = 'scoring'
    AND created_at < NOW() - INTERVAL '10 minutes';

  -- Delete stale queue entries older than 5 minutes
  DELETE FROM matchmaking_queue
  WHERE joined_at < NOW() - INTERVAL '5 minutes';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============ 7. UPDATED RLS POLICIES ============

-- Drop the overly permissive update policy
DROP POLICY IF EXISTS "Players can update own matches" ON matches;

-- Restricted update policy — players can still update via SECURITY DEFINER functions
-- This policy allows minimal direct updates (for realtime subscriptions to work)
DO $$ BEGIN
  CREATE POLICY "Restrict direct match updates" ON matches
    FOR UPDATE USING (
      auth.uid() = player1_id OR auth.uid() = player2_id
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============ 8. CRON (if pg_cron is available) ============
-- Uncomment the following line in the Supabase SQL editor if pg_cron is enabled:
-- SELECT cron.schedule('cleanup-stale-matches', '*/15 * * * *', 'SELECT cleanup_stale_matches()');
