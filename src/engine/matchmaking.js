import { supabase, isOnline } from '../lib/supabase.js';
import eventBus from './event-bus.js';

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
    console.error('Failed to join queue:', error.message);
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
    .channel('matchmaking')
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

  if (expandTimer) {
    clearTimeout(expandTimer);
    expandTimer = null;
  }

  if (activeSubscription) {
    supabase.removeChannel(activeSubscription);
    activeSubscription = null;
  }

  const { error } = await supabase
    .from('matchmaking_queue')
    .delete()
    .eq('user_id', userId);

  if (error) {
    console.error('Failed to leave queue:', error.message);
  }

  eventBus.emit('matchmaking:left', { userId });
}

export async function findMatch(userId) {
  if (!isOnline()) return null;

  // Fetch current user's queue entry
  const { data: myEntry, error: entryError } = await supabase
    .from('matchmaking_queue')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (entryError || !myEntry) return null;

  const elapsed = Date.now() - new Date(myEntry.joined_at).getTime();
  const eloRange = elapsed >= EXPAND_AFTER_MS ? EXPANDED_ELO_RANGE : INITIAL_ELO_RANGE;
  const minElo = myEntry.elo_rating - eloRange;
  const maxElo = myEntry.elo_rating + eloRange;

  // Find compatible opponents
  const { data: opponents, error: searchError } = await supabase
    .from('matchmaking_queue')
    .select('*')
    .neq('user_id', userId)
    .gte('elo_rating', minElo)
    .lte('elo_rating', maxElo)
    .order('joined_at', { ascending: true })
    .limit(1);

  if (searchError || !opponents || opponents.length === 0) return null;

  const opponent = opponents[0];

  // Create match
  const { data: match, error: matchError } = await supabase
    .from('matches')
    .insert({
      player1_id: userId,
      player2_id: opponent.user_id,
      status: 'active',
    })
    .select()
    .single();

  if (matchError) {
    console.error('Failed to create match:', matchError.message);
    return null;
  }

  // Remove both players from queue
  await supabase
    .from('matchmaking_queue')
    .delete()
    .in('user_id', [userId, opponent.user_id]);

  eventBus.emit('matchmaking:found', { match });
  return match;
}
