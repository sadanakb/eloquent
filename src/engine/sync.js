/**
 * Bidirectional sync between localStorage and Supabase user_progress.
 *
 * Strategy:
 * - On login: load from Supabase, merge with localStorage (newer wins)
 * - On changes: write to localStorage immediately, debounce Supabase write
 * - For non-logged-in users: localStorage only
 *
 * Merge rules:
 * - Numeric values (streak, XP): Math.max()
 * - Lists (completedChallenges): union (Set)
 * - Timestamps: newer wins
 * - Settings: Supabase wins (last device where settings were changed)
 */

import { supabase, isSupabaseReady } from '../lib/supabase';

let syncTimeout = null;

/**
 * Load progress from Supabase and merge with localStorage.
 * Call after login.
 */
export async function syncFromServer(userId) {
  if (!isSupabaseReady() || !userId) return;

  try {
    const { data, error } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.warn('[Sync] Failed to load from server:', error.message);
      return;
    }

    if (!data) {
      // No server data yet — push current localStorage to server
      await syncToServer(userId);
      return;
    }

    // Merge story progress
    if (data.story_progress && typeof data.story_progress === 'object') {
      const localStory = getLocalJson('eloquent_story_progress', {});
      const merged = mergeObjects(localStory, data.story_progress);
      localStorage.setItem('eloquent_story_progress', JSON.stringify(merged));
    }

    // Merge daily streak (take higher)
    if (data.daily_streak !== null && data.daily_streak !== undefined) {
      const localStreak = parseInt(localStorage.getItem('eloquent_daily_streak') || '0');
      localStorage.setItem('eloquent_daily_streak', String(Math.max(localStreak, data.daily_streak)));
    }

    if (data.daily_last_date) {
      const localDate = localStorage.getItem('eloquent_daily_last_date') || '';
      // Take the more recent date
      if (data.daily_last_date > localDate) {
        localStorage.setItem('eloquent_daily_last_date', data.daily_last_date);
      }
    }

    // Merge local stats (take higher values)
    if (data.local_stats && typeof data.local_stats === 'object') {
      const localStats = getLocalJson('eloquent_local_stats', {});
      const merged = mergeNumeric(localStats, data.local_stats);
      localStorage.setItem('eloquent_local_stats', JSON.stringify(merged));
    }

    // Settings: server wins (last device where settings were changed)
    if (data.settings && typeof data.settings === 'object' && Object.keys(data.settings).length > 0) {
      for (const [key, value] of Object.entries(data.settings)) {
        localStorage.setItem(`eloquent_${key}`, typeof value === 'string' ? value : JSON.stringify(value));
      }
    }
  } catch (err) {
    console.warn('[Sync] Error during sync from server:', err);
  }
}

/**
 * Push localStorage data to Supabase.
 * Call on logout or periodically.
 */
export async function syncToServer(userId) {
  if (!isSupabaseReady() || !userId) return;

  try {
    const data = {
      user_id: userId,
      story_progress: getLocalJson('eloquent_story_progress', {}),
      daily_streak: parseInt(localStorage.getItem('eloquent_daily_streak') || '0'),
      daily_last_date: localStorage.getItem('eloquent_daily_last_date') || null,
      local_stats: getLocalJson('eloquent_local_stats', {}),
      settings: gatherSettings(),
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('user_progress')
      .upsert(data, { onConflict: 'user_id' });

    if (error) {
      console.warn('[Sync] Failed to sync to server:', error.message);
    }
  } catch (err) {
    console.warn('[Sync] Error during sync to server:', err);
  }
}

/**
 * Debounced sync — call after any storage write.
 * Max 1 sync per 5 seconds.
 */
export function debouncedSync(userId) {
  if (!userId) return;
  if (syncTimeout) clearTimeout(syncTimeout);
  syncTimeout = setTimeout(() => {
    syncToServer(userId);
    syncTimeout = null;
  }, 5000);
}

// ─── Helpers ───

function getLocalJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function mergeObjects(local, server) {
  const merged = { ...local };
  for (const [key, value] of Object.entries(server)) {
    if (typeof value === 'number' && typeof merged[key] === 'number') {
      merged[key] = Math.max(merged[key], value);
    } else if (Array.isArray(value) && Array.isArray(merged[key])) {
      merged[key] = [...new Set([...merged[key], ...value])];
    } else if (value !== null && value !== undefined) {
      // Server wins for non-numeric, non-array values
      merged[key] = value;
    }
  }
  return merged;
}

function mergeNumeric(local, server) {
  const merged = { ...local };
  for (const [key, value] of Object.entries(server)) {
    if (typeof value === 'number') {
      merged[key] = Math.max(merged[key] || 0, value);
    }
  }
  return merged;
}

function gatherSettings() {
  const settings = {};
  const settingsKeys = ['theme', 'sound_enabled', 'music_enabled', 'sound_volume'];
  for (const key of settingsKeys) {
    const val = localStorage.getItem(`eloquent_${key}`);
    if (val !== null) settings[key] = val;
  }
  return settings;
}
