import { supabase } from '../lib/supabase.js';
import { logger } from './logger.js';

const ONLINE_THRESHOLD_MS = 2 * 60 * 1000; // 2 minutes

export function isUserOnline(lastSeenAt) {
  if (!lastSeenAt) return false;
  return Date.now() - new Date(lastSeenAt).getTime() < ONLINE_THRESHOLD_MS;
}

export async function getFriends(userId) {
  try {
    const { data, error } = await supabase
      .from('friendships')
      .select('*, requester:profiles!requester_id(*), addressee:profiles!addressee_id(*)')
      .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
      .eq('status', 'accepted');

    if (error) {
      logger.debug('getFriends error:', error.message);
      return [];
    }

    return (data || []).map((f) => {
      const friend = f.requester_id === userId ? f.addressee : f.requester;
      return {
        friendshipId: f.id,
        id: friend.id,
        username: friend.username,
        avatar_url: friend.avatar_url,
        elo_rating: friend.elo_rating,
        friend_code: friend.friend_code,
        last_seen_at: friend.last_seen_at,
      };
    });
  } catch (err) {
    logger.debug('getFriends exception:', err.message);
    return [];
  }
}

export async function getPendingRequests(userId) {
  try {
    const { data, error } = await supabase
      .from('friendships')
      .select('*, requester:profiles!requester_id(id, username, avatar_url, elo_rating)')
      .eq('addressee_id', userId)
      .eq('status', 'pending');

    if (error) {
      logger.debug('getPendingRequests error:', error.message);
      return [];
    }

    return (data || []).map((f) => ({
      friendshipId: f.id,
      id: f.requester.id,
      username: f.requester.username,
      avatar_url: f.requester.avatar_url,
      elo_rating: f.requester.elo_rating,
    }));
  } catch (err) {
    logger.debug('getPendingRequests exception:', err.message);
    return [];
  }
}

export async function getSentRequests(userId) {
  try {
    const { data, error } = await supabase
      .from('friendships')
      .select('*, addressee:profiles!addressee_id(id, username, avatar_url, elo_rating)')
      .eq('requester_id', userId)
      .eq('status', 'pending');

    if (error) {
      logger.debug('getSentRequests error:', error.message);
      return [];
    }

    return (data || []).map((f) => ({
      friendshipId: f.id,
      id: f.addressee.id,
      username: f.addressee.username,
      avatar_url: f.addressee.avatar_url,
      elo_rating: f.addressee.elo_rating,
    }));
  } catch (err) {
    logger.debug('getSentRequests exception:', err.message);
    return [];
  }
}

export async function sendFriendRequest(requesterId, addresseeId) {
  try {
    const { data, error } = await supabase.rpc('send_friend_request', {
      p_requester: requesterId,
      p_addressee: addresseeId,
    });

    if (error) {
      logger.debug('sendFriendRequest error:', error.message);
      return { error: error.message };
    }

    return data;
  } catch (err) {
    logger.debug('sendFriendRequest exception:', err.message);
    return { error: err.message };
  }
}

export async function sendFriendRequestByCode(requesterId, friendCode) {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('friend_code', friendCode.toUpperCase().trim())
      .single();

    if (error || !profile) {
      logger.debug('sendFriendRequestByCode lookup failed:', error?.message);
      return { error: 'Code nicht gefunden' };
    }

    return sendFriendRequest(requesterId, profile.id);
  } catch (err) {
    logger.debug('sendFriendRequestByCode exception:', err.message);
    return { error: err.message };
  }
}

export async function respondToRequest(friendshipId, userId, accept) {
  try {
    const { data, error } = await supabase.rpc('respond_friend_request', {
      p_friendship_id: friendshipId,
      p_user_id: userId,
      p_accept: accept,
    });

    if (error) {
      logger.debug('respondToRequest error:', error.message);
      return { error: error.message };
    }

    return data;
  } catch (err) {
    logger.debug('respondToRequest exception:', err.message);
    return { error: err.message };
  }
}

export async function removeFriend(friendshipId) {
  try {
    const { error } = await supabase
      .from('friendships')
      .delete()
      .eq('id', friendshipId);

    if (error) {
      logger.debug('removeFriend error:', error.message);
      return { error: error.message };
    }

    return { success: true };
  } catch (err) {
    logger.debug('removeFriend exception:', err.message);
    return { error: err.message };
  }
}

export async function searchUsers(query, searcherId) {
  try {
    const { data, error } = await supabase.rpc('search_users', {
      p_query: query,
      p_searcher: searcherId,
    });

    if (error) {
      logger.debug('searchUsers error:', error.message);
      return [];
    }

    return data || [];
  } catch (err) {
    logger.debug('searchUsers exception:', err.message);
    return [];
  }
}

export function subscribeFriendEvents(userId, onInsert, onUpdate) {
  const channel = supabase
    .channel(`friend-events-${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'friendships',
        filter: `addressee_id=eq.${userId}`,
      },
      (payload) => onInsert(payload.new)
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'friendships',
        filter: `addressee_id=eq.${userId}`,
      },
      (payload) => onUpdate(payload.new)
    )
    .on(
      'postgres_changes',
      {
        event: 'DELETE',
        schema: 'public',
        table: 'friendships',
        filter: `addressee_id=eq.${userId}`,
      },
      (payload) => onUpdate(payload.old)
    )
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'friendships',
        filter: `requester_id=eq.${userId}`,
      },
      (payload) => onInsert(payload.new)
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'friendships',
        filter: `requester_id=eq.${userId}`,
      },
      (payload) => onUpdate(payload.new)
    )
    .on(
      'postgres_changes',
      {
        event: 'DELETE',
        schema: 'public',
        table: 'friendships',
        filter: `requester_id=eq.${userId}`,
      },
      (payload) => onUpdate(payload.old)
    )
    .subscribe((status, err) => {
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        logger.warn(`Friend events subscription ${status}:`, err);
      }
    });

  logger.debug('subscribeFriendEvents: subscribed for user', userId);
  return channel;
}

export async function updateLastSeen(userId) {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ last_seen_at: new Date().toISOString() })
      .eq('id', userId);

    if (error) {
      logger.debug('updateLastSeen error:', error.message);
    }
  } catch (err) {
    logger.debug('updateLastSeen exception:', err.message);
  }
}
