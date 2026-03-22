import { supabase, isOnline } from '../lib/supabase.js';
import eventBus from './event-bus.js';

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
    console.error('Failed to create match:', error.message);
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

  // Determine which player column to update
  const { data: match } = await supabase
    .from('matches')
    .select('player1_id, player2_id')
    .eq('id', matchId)
    .single();

  if (!match) return null;

  const column = match.player1_id === playerId ? 'player1_text' : 'player2_text';

  const updates = { [column]: text };

  // If both players have submitted, move to scoring
  const otherColumn = column === 'player1_text' ? 'player2_text' : 'player1_text';
  const { data: current } = await supabase
    .from('matches')
    .select(otherColumn)
    .eq('id', matchId)
    .single();

  if (current && current[otherColumn]) {
    updates.status = 'scoring';
  }

  const { data, error } = await supabase
    .from('matches')
    .update(updates)
    .eq('id', matchId)
    .select()
    .single();

  if (error) {
    console.error('Failed to submit answer:', error.message);
    return null;
  }

  eventBus.emit('match:answer_submitted', { matchId, playerId });
  return data;
}

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
    console.error('Failed to submit scores:', error.message);
    return null;
  }

  eventBus.emit('match:completed', { matchId, winner: winnerId });
  return data;
}

export async function forfeitMatch(matchId, playerId) {
  if (!isOnline()) return null;

  const { data: match } = await supabase
    .from('matches')
    .select('player1_id, player2_id')
    .eq('id', matchId)
    .single();

  if (!match) return null;

  const winnerId = match.player1_id === playerId ? match.player2_id : match.player1_id;

  const { data, error } = await supabase
    .from('matches')
    .update({
      status: 'forfeited',
      winner_id: winnerId,
      completed_at: new Date().toISOString(),
    })
    .eq('id', matchId)
    .select()
    .single();

  if (error) {
    console.error('Failed to forfeit match:', error.message);
    return null;
  }

  eventBus.emit('match:forfeited', { matchId, playerId, winnerId });
  return data;
}

export async function createFriendChallenge(userId) {
  if (!isOnline()) return null;

  const code = Math.random().toString(36).substring(2, 8).toUpperCase();

  const { data, error } = await supabase
    .from('matches')
    .insert({
      player1_id: userId,
      status: 'waiting',
      friend_code: code,
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to create friend challenge:', error.message);
    return null;
  }

  return { code, matchId: data.id };
}

export async function joinFriendChallenge(code, userId) {
  if (!isOnline()) return null;

  const { data, error } = await supabase
    .from('matches')
    .update({
      player2_id: userId,
      status: 'active',
    })
    .eq('friend_code', code)
    .eq('status', 'waiting')
    .is('player2_id', null)
    .select()
    .single();

  if (error) {
    console.error('Failed to join challenge:', error.message);
    return null;
  }

  eventBus.emit('match:friend_joined', { matchId: data.id, userId });
  return data;
}
