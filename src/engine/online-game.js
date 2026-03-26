import { supabase, isOnline } from '../lib/supabase.js';
import eventBus from './event-bus.js';
import { logger } from './logger.js';

/**
 * Clean up stale data for this user.
 * Call on page load before starting matchmaking.
 */
export async function cleanupMyStaleData(userId) {
  if (!supabase) return;

  try {
    const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();

    // Delete my old waiting matches
    await supabase.from('matches')
      .delete()
      .eq('player1_id', userId)
      .eq('status', 'waiting')
      .lt('created_at', thirtyMinAgo);

    // Delete my old queue entries
    await supabase.from('matchmaking_queue')
      .delete()
      .eq('user_id', userId);
  } catch (err) {
    logger.error('Cleanup error:', err);
  }
}

export async function createMatch(player1Id, player2Id, situationId) {
  if (!isOnline()) return null;

  const { data, error } = await supabase
    .from('matches')
    .insert({
      player1_id: player1Id,
      player2_id: player2Id,
      situation_id: situationId,
      status: 'active',
    })
    .select()
    .single();

  if (error) {
    logger.error('Failed to create match:', error.message);
    return null;
  }

  return data;
}

export function subscribeToMatch(matchId, callback) {
  if (!isOnline()) return () => {};

  const channel = supabase
    .channel(`match:${matchId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'matches',
        filter: `id=eq.${matchId}`,
      },
      (payload) => {
        const match = payload.new;
        const old = payload.old;

        // Determine event type
        if (match.status === 'forfeited') {
          callback({ type: 'opponent_disconnected', match });
        } else if (match.status === 'completed' && match.player1_score != null && match.player2_score != null) {
          callback({ type: 'scores_ready', match });
        } else if (match.status === 'active' && !old.player2_id && match.player2_id) {
          // Friend joined the waiting challenge
          callback({ type: 'friend_joined', match });
        } else if (
          (match.player1_text && !old.player1_text) ||
          (match.player2_text && !old.player2_text)
        ) {
          callback({ type: 'opponent_submitted', match });
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export async function submitAnswer(matchId, playerId, text) {
  if (!isOnline()) return null;

  const { data: match, error } = await supabase.rpc('submit_match_text', {
    p_match_id: matchId,
    p_player_id: playerId,
    p_text: text,
  });
  if (error) throw error;

  eventBus.emit('match:answer_submitted', { matchId, playerId });
  return match;
}

// Fallback for offline mode. In Phase 4, online scoring will be handled by the Edge Function.
export async function submitScores(matchId, scores) {
  if (!isOnline()) return null;

  const winnerId = scores.player1Score > scores.player2Score
    ? scores.player1Id
    : scores.player1Score < scores.player2Score
      ? scores.player2Id
      : null;

  const { data, error } = await supabase
    .from('matches')
    .update({
      player1_score: scores.player1Score,
      player2_score: scores.player2Score,
      winner_id: winnerId,
      status: 'completed',
      completed_at: new Date().toISOString(),
    })
    .eq('id', matchId)
    .select()
    .single();

  if (error) {
    logger.error('Failed to submit scores:', error.message);
    return null;
  }

  eventBus.emit('match:completed', { matchId, winner: winnerId });
  return data;
}

export async function forfeitMatch(matchId, playerId) {
  const { error } = await supabase.rpc('forfeit_match', {
    p_match_id: matchId,
    p_forfeiter_id: playerId,
  });
  if (error) {
    logger.error('Forfeit error:', error.message);
    throw error;
  }
}

export async function createFriendChallenge(userId) {
  if (!isOnline()) return null;

  const code = Math.random().toString(36).substring(2, 8).toUpperCase();

  // Import SITUATIONEN lazily to pick a situation for the match
  const { SITUATIONEN } = await import('../data/situationen.js');
  const pool = SITUATIONEN.mittel?.length ? SITUATIONEN.mittel
    : SITUATIONEN.leicht?.length ? SITUATIONEN.leicht : [];
  const situation = pool[Math.floor(Math.random() * pool.length)];

  const { data, error } = await supabase
    .from('matches')
    .insert({
      player1_id: userId,
      situation_id: situation?.id || null,
      status: 'waiting',
      friend_code: code,
      expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    })
    .select()
    .single();

  if (error) {
    logger.error('Failed to create friend challenge:', error.message);
    return null;
  }

  return { code, matchId: data.id };
}

/**
 * Request server-side scoring via Supabase Edge Function.
 * Only used for online matches — offline modes use client-side scoring.
 */
export async function requestServerScoring(matchId) {
  if (!supabase) throw new Error('Supabase not available');

  const { data, error } = await supabase.functions.invoke('score-match', {
    body: { matchId },
  });

  if (error) throw error;
  return data;
}

export async function joinFriendChallenge(code, userId) {
  if (!isOnline()) return null;

  const { data: matchId, error } = await supabase.rpc('join_friend_match', {
    p_code: code.toUpperCase().trim(),
    p_joiner_id: userId,
  });
  if (error) throw error;

  // Return the match data by fetching it
  const { data: match } = await supabase
    .from('matches')
    .select('*')
    .eq('id', matchId)
    .single();

  eventBus.emit('match:friend_joined', { matchId: match.id, userId });
  return match;
}
