/**
 * Presence system for online matches.
 * Uses Supabase Realtime Presence to track if both players are connected.
 *
 * Events emitted via callbacks:
 * - onOpponentOnline: Opponent is (re)connected
 * - onOpponentOffline: Opponent lost connection
 * - onOpponentTimeout: timeoutMs since disconnect — auto-forfeit (default 30s)
 */

import { supabase } from '../lib/supabase';

export const DEFAULT_DISCONNECT_TIMEOUT_MS = 30_000;

export function createPresence(matchId, userId, callbacks, options = {}) {
  if (!supabase) return null;

  const timeoutMs = options.timeoutMs ?? DEFAULT_DISCONNECT_TIMEOUT_MS;

  const channel = supabase.channel(`presence:match:${matchId}`, {
    config: {
      presence: { key: userId },
    },
  });

  let opponentOnline = false;
  let disconnectTimer = null;

  channel.on('presence', { event: 'sync' }, () => {
    const state = channel.presenceState();
    const connectedUsers = Object.keys(state);
    const opponentConnected = connectedUsers.some(key => key !== userId);

    if (opponentConnected && !opponentOnline) {
      opponentOnline = true;
      if (disconnectTimer) {
        clearTimeout(disconnectTimer);
        disconnectTimer = null;
      }
      callbacks.onOpponentOnline?.();
    } else if (!opponentConnected && opponentOnline) {
      opponentOnline = false;
      callbacks.onOpponentOffline?.();
      if (!disconnectTimer) {
        disconnectTimer = setTimeout(() => {
          callbacks.onOpponentTimeout?.();
        }, timeoutMs);
      }
    }
  });

  channel.on('presence', { event: 'leave' }, ({ key }) => {
    if (key !== userId) {
      opponentOnline = false;
      callbacks.onOpponentOffline?.();

      if (disconnectTimer) clearTimeout(disconnectTimer);
      disconnectTimer = setTimeout(() => {
        callbacks.onOpponentTimeout?.();
      }, 60_000);
    }
  });

  channel.on('presence', { event: 'join' }, ({ key }) => {
    if (key !== userId && !opponentOnline) {
      opponentOnline = true;
      if (disconnectTimer) {
        clearTimeout(disconnectTimer);
        disconnectTimer = null;
      }
      callbacks.onOpponentOnline?.();
    }
  });

  channel.subscribe(async (status) => {
    if (status === 'SUBSCRIBED') {
      await channel.track({
        user_id: userId,
        online_at: new Date().toISOString(),
      });
    }
  });

  return {
    destroy: () => {
      if (disconnectTimer) clearTimeout(disconnectTimer);
      channel.untrack();
      supabase.removeChannel(channel);
    },
    isOpponentOnline: () => opponentOnline,
  };
}
