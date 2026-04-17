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

export async function createMatch(player1Id, player2Id, situationId, situationData = null) {
  if (!isOnline()) return null;

  const { data, error } = await supabase
    .from('matches')
    .insert({
      player1_id: player1Id,
      player2_id: player2Id,
      situation_id: situationId,
      situation_data: situationData,
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

// Module-level last-seen-state per match id. Realtime's `payload.old` can be
// empty if REPLICA IDENTITY is not FULL on the matches table, so we track the
// last known text state ourselves to detect transitions reliably.
const lastSeenMatchState = new Map();

export function subscribeToMatch(matchId, callback, myUserId) {
  if (!isOnline()) return () => {};

  // Seed last-seen state from current DB row so the very first UPDATE is
  // compared against real data instead of an empty baseline.
  (async () => {
    try {
      const { data } = await supabase
        .from('matches')
        .select('player1_text, player2_text, player2_id, status')
        .eq('id', matchId)
        .maybeSingle();
      if (data) {
        lastSeenMatchState.set(matchId, {
          player1_text: data.player1_text || null,
          player2_text: data.player2_text || null,
          player2_id: data.player2_id || null,
          status: data.status || null,
        });
      }
    } catch {
      // Non-fatal; first update will initialize from payload.new.
    }
  })();

  const channel = supabase
    .channel(`match:${matchId}:${Date.now()}`)
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
        const prev = lastSeenMatchState.get(matchId) || {
          player1_text: null,
          player2_text: null,
          player2_id: null,
          status: null,
        };

        // Detect transitions relative to our local last-seen state.
        const p1TextAdded = !prev.player1_text && !!match.player1_text;
        const p2TextAdded = !prev.player2_text && !!match.player2_text;
        const friendJoined = !prev.player2_id && !!match.player2_id && match.status === 'active';

        // Update last-seen BEFORE firing callbacks to keep the ref monotonic.
        lastSeenMatchState.set(matchId, {
          player1_text: match.player1_text || null,
          player2_text: match.player2_text || null,
          player2_id: match.player2_id || null,
          status: match.status || null,
        });

        // Terminal states take priority.
        if (match.status === 'forfeited') {
          callback({ type: 'opponent_disconnected', match });
          return;
        }
        if (match.status === 'completed' && match.player1_score != null && match.player2_score != null) {
          callback({ type: 'scores_ready', match });
          return;
        }
        if (friendJoined) {
          callback({ type: 'friend_joined', match });
          return;
        }

        // Text transitions → only fire opponent_submitted when OPPONENT text
        // flipped from null/empty → non-empty based on our local last-seen.
        if (p1TextAdded || p2TextAdded) {
          const isP1 = match.player1_id === myUserId;
          const opponentTextChanged = isP1 ? p2TextAdded : p1TextAdded;
          if (opponentTextChanged) {
            callback({ type: 'opponent_submitted', match });
          }
          // Own text change: ignore (handled in handleWritingSubmit).
        }
      }
    )
    .subscribe((status) => {
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        logger.warn(`Match subscription ${status}, polling fallback active`);
      }
    });

  return () => {
    supabase.removeChannel(channel);
    lastSeenMatchState.delete(matchId);
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

export async function createFriendChallenge(userId, retries = 3) {
  if (!isOnline()) return null;

  const { SITUATIONEN } = await import('../data/situationen.js');
  const pool = SITUATIONEN.mittel?.length ? SITUATIONEN.mittel
    : SITUATIONEN.leicht?.length ? SITUATIONEN.leicht : [];
  const situation = pool[Math.floor(Math.random() * pool.length)];

  for (let i = 0; i < retries; i++) {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();

    const { data, error } = await supabase
      .from('matches')
      .insert({
        player1_id: userId,
        situation_id: situation?.id || null,
        situation_data: situation ? { titel: situation.titel, kontext: situation.kontext, beschreibung: situation.beschreibung } : null,
        status: 'waiting',
        friend_code: code,
        expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      })
      .select()
      .single();

    if (!error) return { code, matchId: data.id };

    // Retry on unique violation (friend_code collision)
    if (error.code === '23505' && i < retries - 1) {
      logger.debug('Friend code collision, retrying...');
      continue;
    }

    logger.error('Failed to create friend challenge:', error.message);
    return null;
  }
  return null;
}

/**
 * Request server-side scoring via Supabase Edge Function.
 * Only used for online matches — offline modes use client-side scoring.
 */
export async function requestServerScoring(matchId) {
  if (!supabase) throw new Error('Supabase not available');

  const scorePromise = supabase.functions.invoke('score-match', {
    body: { matchId },
  });

  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Scoring timeout after 30s')), 30000)
  );

  const response = await Promise.race([scorePromise, timeoutPromise]);
  const { data, error } = response || {};

  // Edge function signals "another invocation is already scoring" via
  // HTTP 202 or body.status === 'scoring_in_progress'. In that case we
  // MUST NOT fall back to client-scoring — wait for the real result to
  // arrive through Realtime/polling instead.
  const status = response?.response?.status ?? response?.status;
  if (status === 202 || data?.status === 'scoring_in_progress') {
    return { status: 'in_progress' };
  }

  if (error) {
    // Some error shapes include a `context` with HTTP status; treat 202 there too.
    const ctxStatus = error?.context?.status;
    if (ctxStatus === 202) return { status: 'in_progress' };
    throw error;
  }
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
