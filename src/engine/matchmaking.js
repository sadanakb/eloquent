import { supabase, isOnline } from '../lib/supabase.js';
import eventBus from './event-bus.js';
import { SITUATIONEN } from '../data/situationen.js';
import { logger } from './logger.js';

const INITIAL_ELO_RANGE = 200;
const EXPANDED_ELO_RANGE = 400;
const EXPAND_AFTER_MS = 30_000;

// Module-level singletons are fragile (HMR/double-mount leaks). We keep them
// ONLY as an internal safety net: joinQueue always tears down the prior
// subscription/timer before creating new ones. The returned unsubscribe
// function is the authoritative owner; callers should still prefer it.
let activeSubscription = null;
let expandTimer = null;

function tearDownActive() {
  if (activeSubscription) {
    try { supabase.removeChannel(activeSubscription); } catch { /* ignore */ }
    activeSubscription = null;
  }
  if (expandTimer) {
    clearTimeout(expandTimer);
    expandTimer = null;
  }
}

export async function joinQueue(userId, eloRating) {
  if (!isOnline()) return null;

  // Clean up any leftover subscription/timer from a previous joinQueue call
  // BEFORE we touch DB state. This makes repeated joins safe across HMR and
  // rapid cancel/retry cycles.
  tearDownActive();

  // Insert into matchmaking queue
  const { error } = await supabase
    .from('matchmaking_queue')
    .upsert({ user_id: userId, elo_rating: eloRating, joined_at: new Date().toISOString() });

  if (error) {
    logger.error('Failed to join queue:', error.message);
    return null;
  }

  eventBus.emit('matchmaking:joined', { userId, eloRating });

  // Try immediate match
  await findMatch(userId);

  // Subscribe to Realtime for new matches involving this player
  const channel = supabase
    .channel(`matchmaking:${userId}:${Date.now()}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'matches',
        filter: `player2_id=eq.${userId}`,
      },
      (payload) => {
        eventBus.emit('matchmaking:found', { match: payload.new });
      }
    )
    .subscribe();

  activeSubscription = channel;

  // Expand Elo range after 30s
  expandTimer = setTimeout(async () => {
    eventBus.emit('matchmaking:expanding', { range: EXPANDED_ELO_RANGE });
    await findMatch(userId);
  }, EXPAND_AFTER_MS);

  // Return unsubscribe function
  return () => leaveQueue(userId);
}

export async function leaveQueue(userId) {
  if (!isOnline()) return;

  try {
    tearDownActive();
    await supabase.from('matchmaking_queue').delete().eq('user_id', userId);
  } catch (err) {
    logger.error('leaveQueue error:', err);
  }

  eventBus.emit('matchmaking:left', { userId });
}

export async function findMatch(userId) {
  if (!isOnline()) return null;

  // Get my queue entry for ELO range
  const { data: myEntry } = await supabase
    .from('matchmaking_queue')
    .select('*')
    .eq('user_id', userId)
    .single();
  if (!myEntry) return null;

  const elapsed = Date.now() - new Date(myEntry.joined_at).getTime();
  const eloRange = elapsed >= EXPAND_AFTER_MS ? EXPANDED_ELO_RANGE : INITIAL_ELO_RANGE;

  // Pick random situation
  const pool = SITUATIONEN.mittel?.length ? SITUATIONEN.mittel
    : SITUATIONEN.leicht?.length ? SITUATIONEN.leicht : [];
  const situation = pool[Math.floor(Math.random() * pool.length)];

  // Atomic match via DB function — prevents double-match race condition
  const { data: matchId, error } = await supabase.rpc('find_and_create_match', {
    p_user_id: userId,
    p_elo: myEntry.elo_rating,
    p_elo_range: eloRange,
    p_situation_id: situation?.id || null,
    p_situation_data: situation ? { titel: situation.titel, kontext: situation.kontext, beschreibung: situation.beschreibung } : null,
  });

  if (error || !matchId) return null;

  // Load full match record
  const { data: match } = await supabase
    .from('matches')
    .select('*')
    .eq('id', matchId)
    .single();

  if (!match) return null;

  eventBus.emit('matchmaking:found', { match });
  return match;
}
