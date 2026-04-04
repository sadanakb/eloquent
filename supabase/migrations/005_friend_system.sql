-- ============================================================
-- Migration 005: Friend System
-- Eloquent — German Word Duel Game
-- ============================================================

-- ============ 1. SCHEMA CHANGES ============

-- Add friend_code to profiles (unique 6-char identifier for adding friends)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS friend_code text UNIQUE;

-- Add last_seen_at for online status tracking
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_seen_at timestamptz DEFAULT now();

-- Generate friend codes for existing users who don't have one
UPDATE profiles
SET friend_code = upper(substr(md5(id::text || random()::text), 1, 6))
WHERE friend_code IS NULL;

-- Index for friend code lookup
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_friend_code ON profiles(friend_code);

-- Index for online status queries
CREATE INDEX IF NOT EXISTS idx_profiles_last_seen ON profiles(last_seen_at);

-- ============ 2. FRIENDSHIPS TABLE ============

CREATE TABLE IF NOT EXISTS friendships (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  addressee_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'blocked')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(requester_id, addressee_id),
  CHECK (requester_id != addressee_id)
);

CREATE INDEX IF NOT EXISTS idx_friendships_requester ON friendships(requester_id);
CREATE INDEX IF NOT EXISTS idx_friendships_addressee ON friendships(addressee_id);
CREATE INDEX IF NOT EXISTS idx_friendships_status ON friendships(status);

-- ============ 3. RLS POLICIES ============

ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;

-- Users can see friendships they're part of
CREATE POLICY "Users see own friendships" ON friendships
  FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- Users can send friend requests (insert as requester)
CREATE POLICY "Users can send friend requests" ON friendships
  FOR INSERT WITH CHECK (auth.uid() = requester_id);

-- Users can update friendships they're involved in
CREATE POLICY "Users can respond to friend requests" ON friendships
  FOR UPDATE USING (auth.uid() = addressee_id OR auth.uid() = requester_id);

-- Users can delete friendships they're part of
CREATE POLICY "Users can remove friendships" ON friendships
  FOR DELETE USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- ============ 4. TRIGGERS ============

DROP TRIGGER IF EXISTS friendships_set_updated_at ON friendships;
CREATE TRIGGER friendships_set_updated_at
  BEFORE UPDATE ON friendships
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============ 5. REALTIME ============

-- Enable realtime for friendships table (for friend request notifications)
ALTER PUBLICATION supabase_realtime ADD TABLE friendships;

-- ============ 6. DB FUNCTIONS ============

-- Send friend request with duplicate/reverse-request handling
CREATE OR REPLACE FUNCTION send_friend_request(p_requester uuid, p_addressee uuid)
RETURNS jsonb AS $$
DECLARE
  existing friendships%ROWTYPE;
  result friendships%ROWTYPE;
BEGIN
  -- Can't friend yourself
  IF p_requester = p_addressee THEN
    RETURN jsonb_build_object('error', 'Kann sich nicht selbst hinzufügen');
  END IF;

  -- Check for existing friendship in either direction
  SELECT * INTO existing FROM friendships
    WHERE (requester_id = p_requester AND addressee_id = p_addressee)
       OR (requester_id = p_addressee AND addressee_id = p_requester);

  IF existing IS NOT NULL THEN
    IF existing.status = 'accepted' THEN
      RETURN jsonb_build_object('error', 'Bereits befreundet');
    ELSIF existing.status = 'blocked' THEN
      RETURN jsonb_build_object('error', 'Anfrage nicht möglich');
    ELSIF existing.status = 'pending' AND existing.addressee_id = p_requester THEN
      -- They sent us a request — auto-accept
      UPDATE friendships SET status = 'accepted', updated_at = now()
        WHERE id = existing.id RETURNING * INTO result;
      RETURN jsonb_build_object('status', 'accepted', 'id', result.id);
    ELSE
      RETURN jsonb_build_object('error', 'Anfrage bereits gesendet');
    END IF;
  END IF;

  -- Create new pending request
  INSERT INTO friendships (requester_id, addressee_id, status)
    VALUES (p_requester, p_addressee, 'pending')
    RETURNING * INTO result;

  RETURN jsonb_build_object('status', 'pending', 'id', result.id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Respond to friend request (accept or decline)
CREATE OR REPLACE FUNCTION respond_friend_request(p_friendship_id uuid, p_user_id uuid, p_accept boolean)
RETURNS void AS $$
BEGIN
  IF p_accept THEN
    UPDATE friendships SET status = 'accepted', updated_at = now()
      WHERE id = p_friendship_id AND addressee_id = p_user_id AND status = 'pending';
  ELSE
    DELETE FROM friendships
      WHERE id = p_friendship_id AND addressee_id = p_user_id AND status = 'pending';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Search users by username or friend_code
CREATE OR REPLACE FUNCTION search_users(p_query text, p_searcher uuid)
RETURNS TABLE(id uuid, username text, avatar_url text, elo_rating integer, friend_code text) AS $$
BEGIN
  RETURN QUERY
    SELECT p.id, p.username, p.avatar_url, p.elo_rating, p.friend_code
    FROM profiles p
    WHERE p.id != p_searcher
      AND (
        p.friend_code = upper(trim(p_query))
        OR p.username ILIKE '%' || trim(p_query) || '%'
      )
    LIMIT 20;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update handle_new_user to generate friend_code
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, username, friend_code)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    upper(substr(md5(new.id::text || random()::text), 1, 6))
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
