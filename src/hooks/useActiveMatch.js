/**
 * Hook to check for and restore active online matches.
 * Used for reconnection after browser refresh or navigation.
 */

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase.js';
import { logger } from '../engine/logger.js';

/**
 * Mark a match as active in sessionStorage.
 */
export function markActiveMatch(matchId) {
  sessionStorage.setItem('eloquent_active_match', JSON.stringify({
    matchId,
    timestamp: Date.now(),
  }));
}

/**
 * Clear the active match marker.
 */
export function clearActiveMatch() {
  sessionStorage.removeItem('eloquent_active_match');
}

/**
 * Restore the game phase from match state.
 */
export function restoreMatchState(match, userId) {
  const isPlayer1 = match.player1_id === userId;
  const myText = isPlayer1 ? match.player1_text : match.player2_text;
  const opponentText = isPlayer1 ? match.player2_text : match.player1_text;

  if (match.status === 'completed' || match.status === 'forfeited') {
    return { phase: 'result', match };
  }
  if (match.status === 'scoring') {
    return { phase: 'scoring', match };
  }
  if (myText && !opponentText) {
    return { phase: 'waiting', match };
  }
  if (!myText) {
    // Calculate remaining time from match creation
    const created = new Date(match.created_at).getTime();
    const maxTime = 150; // Default medium difficulty
    const elapsed = Math.floor((Date.now() - created) / 1000);
    const remaining = Math.max(0, maxTime - elapsed);

    if (remaining <= 0) {
      return { phase: 'auto_submit', match, timeLeft: 0 };
    }
    return { phase: 'writing', match, timeLeft: remaining };
  }
  // Both texts present but not yet scoring — transition
  return { phase: 'scoring', match };
}

/**
 * Hook that checks for active matches on mount.
 * Returns { activeMatch, isLoading, reconnectState } or null.
 */
export function useActiveMatch(userId) {
  const [activeMatch, setActiveMatch] = useState(null);
  const [reconnectState, setReconnectState] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId || !supabase) {
      setIsLoading(false);
      return;
    }

    async function checkForActiveMatch() {
      try {
        // First check sessionStorage for specific match
        const stored = sessionStorage.getItem('eloquent_active_match');
        if (stored) {
          try {
            const { matchId } = JSON.parse(stored);
            if (matchId) {
              const { data: match } = await supabase
                .from('matches')
                .select('*')
                .eq('id', matchId)
                .in('status', ['active', 'scoring'])
                .maybeSingle();

              if (match) {
                const state = restoreMatchState(match, userId);
                setActiveMatch(match);
                setReconnectState(state);
                setIsLoading(false);
                return;
              }
            }
          } catch { /* invalid JSON, fall through */ }
        }

        // Fallback: query recent matches
        const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
        const { data: match } = await supabase
          .from('matches')
          .select('*')
          .or(`player1_id.eq.${userId},player2_id.eq.${userId}`)
          .in('status', ['active', 'scoring'])
          .gt('created_at', tenMinAgo)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (match) {
          const state = restoreMatchState(match, userId);
          setActiveMatch(match);
          setReconnectState(state);
        }
      } catch (err) {
        logger.error('Active match check failed:', err);
      } finally {
        setIsLoading(false);
      }
    }

    checkForActiveMatch();
  }, [userId]);

  return { activeMatch, reconnectState, isLoading };
}
