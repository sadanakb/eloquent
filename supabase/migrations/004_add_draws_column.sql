-- Add draws column to profiles for tracking draw matches
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS draws integer DEFAULT 0;
