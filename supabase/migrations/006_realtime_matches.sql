-- ============================================================
-- Migration 006: Enable Realtime for matches table
-- Without this, match subscriptions never receive updates!
-- ============================================================

-- Add matches table to realtime publication
-- This enables INSERT/UPDATE/DELETE events to be broadcast to subscribers
ALTER PUBLICATION supabase_realtime ADD TABLE matches;

-- Also add matchmaking_queue for queue-based matchmaking
ALTER PUBLICATION supabase_realtime ADD TABLE matchmaking_queue;
