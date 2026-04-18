/**
 * ELOQUENT — Achievement Engine
 * Tracks stats, checks conditions, emits unlock events.
 */

import storage from './storage.js';
import eventBus from './event-bus.js';
import { ACHIEVEMENTS } from '../data/achievements.js';

const STATS_KEY = 'achievement_stats';
const UNLOCKED_KEY = 'unlocked_achievements';

const DEFAULT_STATS = {
  total_duells: 0,
  total_uebungen: 0,
  total_games: 0,
  best_score: 0,
  gehobene_count: 0,
  current_streak: 0,
  story_chapters_completed: 0,
  story_complete: false,
  daily_completed: 0,
  daily_streak: 0,
  max_rhetorik_devices: 0,
  total_metaphors: 0,
  categories_played: 0,
  difficulties_played: 0,
  fastest_submit: Infinity,
  total_words: 0,
  perfect_categories: 0,
};

/**
 * Read cumulative stats from storage.
 */
export function getStats() {
  const saved = storage.get(STATS_KEY, {});
  return { ...DEFAULT_STATS, ...saved };
}

/**
 * Merge partial updates into stats and persist.
 */
export function updateStats(updates) {
  const current = getStats();
  const merged = { ...current, ...updates };
  storage.set(STATS_KEY, merged);
  return merged;
}

/**
 * Read the list of unlocked achievement IDs.
 */
export function getUnlocked() {
  return storage.get(UNLOCKED_KEY, []);
}

/**
 * Main function: update stats based on an event, then check all achievements.
 * Returns an array of newly unlocked achievement objects.
 */
export function checkAchievements(eventType, eventData = {}) {
  const stats = getStats();

  // ── Update stats based on event type ──
  switch (eventType) {
    case 'duell_complete':
      stats.total_duells += 1;
      stats.total_games += 1;
      if (eventData.score != null && eventData.score > stats.best_score) {
        stats.best_score = eventData.score;
      }
      if (eventData.gehobene_count != null) {
        stats.gehobene_count += eventData.gehobene_count;
      }
      if (eventData.word_count != null) {
        stats.total_words += eventData.word_count;
      }
      if (eventData.rhetorik_devices != null && eventData.rhetorik_devices > stats.max_rhetorik_devices) {
        stats.max_rhetorik_devices = eventData.rhetorik_devices;
      }
      if (eventData.metaphors != null) {
        stats.total_metaphors += eventData.metaphors;
      }
      if (eventData.perfect_category) {
        stats.perfect_categories += 1;
      }
      if (eventData.submit_time != null && eventData.submit_time < stats.fastest_submit) {
        stats.fastest_submit = eventData.submit_time;
      }
      if (eventData.category_id != null) {
        const played = storage.get('categories_played_set', []);
        if (!played.includes(eventData.category_id)) {
          played.push(eventData.category_id);
          storage.set('categories_played_set', played);
          stats.categories_played = played.length;
        }
      }
      if (eventData.difficulty != null) {
        const diffs = storage.get('difficulties_played_set', []);
        if (!diffs.includes(eventData.difficulty)) {
          diffs.push(eventData.difficulty);
          storage.set('difficulties_played_set', diffs);
          stats.difficulties_played = diffs.length;
        }
      }
      stats.current_streak += 1;
      break;

    case 'uebung_complete':
      stats.total_uebungen += 1;
      stats.total_games += 1;
      if (eventData.score != null && eventData.score > stats.best_score) {
        stats.best_score = eventData.score;
      }
      if (eventData.gehobene_count != null) {
        stats.gehobene_count += eventData.gehobene_count;
      }
      if (eventData.word_count != null) {
        stats.total_words += eventData.word_count;
      }
      if (eventData.rhetorik_devices != null && eventData.rhetorik_devices > stats.max_rhetorik_devices) {
        stats.max_rhetorik_devices = eventData.rhetorik_devices;
      }
      if (eventData.metaphors != null) {
        stats.total_metaphors += eventData.metaphors;
      }
      stats.current_streak += 1;
      break;

    case 'story_chapter':
      stats.story_chapters_completed += 1;
      if (eventData.complete) {
        stats.story_complete = true;
      }
      break;

    case 'daily_complete':
      stats.daily_completed += 1;
      if (eventData.streak != null) {
        stats.daily_streak = eventData.streak;
      } else {
        stats.daily_streak += 1;
      }
      if (eventData.score != null && eventData.score > stats.best_score) {
        stats.best_score = eventData.score;
      }
      break;

    default:
      // Unknown event — still save any direct stat overrides
      break;
  }

  // Persist updated stats
  updateStats(stats);

  // ── Check all achievements ──
  const unlocked = getUnlocked();
  const newlyUnlocked = [];

  for (const achievement of ACHIEVEMENTS) {
    if (unlocked.includes(achievement.id)) continue;

    try {
      if (achievement.condition(stats)) {
        unlocked.push(achievement.id);
        newlyUnlocked.push(achievement);
      }
    } catch {
      // Condition threw — skip silently
    }
  }

  // Persist newly unlocked
  if (newlyUnlocked.length > 0) {
    storage.set(UNLOCKED_KEY, unlocked);

    // Best-effort sync to Supabase (fire & forget; local write already done)
    for (const ach of newlyUnlocked) {
      syncAchievementToSupabase(ach.id).catch(() => {});
    }

    // Emit events for each new unlock
    for (const ach of newlyUnlocked) {
      eventBus.emit('achievement:unlocked', ach);
    }
  }

  return newlyUnlocked;
}

/**
 * Upsert a single unlocked achievement to Supabase. Best-effort; failures
 * are swallowed because the local write is already authoritative.
 */
async function syncAchievementToSupabase(achievementId) {
  try {
    const { supabase } = await import('../lib/supabase.js');
    if (!supabase) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('user_achievements').upsert({
      user_id: user.id,
      achievement_id: achievementId,
      unlocked_at: new Date().toISOString(),
    }, { onConflict: 'user_id,achievement_id' });
  } catch (e) {
    console.warn('Achievement sync failed:', e);
  }
}

/**
 * Pull all user_achievements from Supabase and merge into localStorage.
 * Called on login. Local-only unlocks are preserved (union merge).
 */
export async function syncAchievementsFromSupabase(userId) {
  if (!userId) return;
  try {
    const { supabase } = await import('../lib/supabase.js');
    if (!supabase) return;
    const { data, error } = await supabase
      .from('user_achievements')
      .select('achievement_id')
      .eq('user_id', userId);
    if (error || !data) return;

    const cloudIds = data.map(r => r.achievement_id).filter(Boolean);
    if (cloudIds.length === 0) return;

    const local = getUnlocked();
    const merged = Array.from(new Set([...local, ...cloudIds]));
    if (merged.length !== local.length) {
      storage.set(UNLOCKED_KEY, merged);
    }
  } catch (e) {
    console.warn('Achievement pull failed:', e);
  }
}

/**
 * Returns progress summary.
 */
export function getProgress() {
  return {
    unlocked: getUnlocked().length,
    total: ACHIEVEMENTS.length,
  };
}
