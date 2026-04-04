import { supabase, isOnline } from '../lib/supabase.js';
import eventBus from './event-bus.js';
import { SITUATIONEN } from '../data/situationen.js';
import { logger } from './logger.js';

const INITIAL_ELO_RANGE = 200;
const EXPANDED_ELO_RANGE = 400;
const EXPAND_AFTER_MS = 30_000;

let activeSubscription = null;
let expandTimer = null;

export async function joinQueue(userId, eloRating) {
  if (!isOnline()) return null;

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

  // Clean up any existing subscription first
  if (activeSubscription) {
    supabase.removeChannel(activeSubscription);
    activeSubscription = null;
  }
  if (expandTimer) {
    clearTimeout(expandTimer);
    expandTimer = null;
  }

  // Subscribe to Realtime for new matches involving this player
  const channel = supabase
    .channel(`matchmaking:${userId}`)
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
    if (expandTimer) clearTimeout(expandTimer);
    if (activeSubscription) supabase.removeChannel(activeSubscription);
    await supabase.from('matchmaking_queue').delete().eq('user_id', userId);
  } catch (err) {
    logger.error('leaveQueue error:', err);
  } finally {
    expandTimer = null;
    activeSubscription = null;
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
