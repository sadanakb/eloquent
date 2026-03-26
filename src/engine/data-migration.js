import { supabase } from '../lib/supabase.js';
import storage from './storage.js';
import { logger } from './logger.js';

const MIGRATED_KEY = 'supabase_migrated';

export async function migrateToSupabase(userId) {
  if (!supabase) return false;
  if (hasMigrated()) return true;

  try {
    // Gather local data
    const stats = storage.get('stats', {});
    const achievements = storage.get('achievements_unlocked', []);
    const xpData = storage.get('xp', {});

    // Fetch existing profile to resolve conflicts (keep higher values)
    const { data: existing } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    // Build profile update with conflict resolution: keep higher values
    const profileUpdate = {};

    if (stats.wins != null) {
      profileUpdate.wins = Math.max(stats.wins || 0, existing?.wins || 0);
    }
    if (stats.losses != null) {
      profileUpdate.losses = Math.max(stats.losses || 0, existing?.losses || 0);
    }
    if (stats.totalGames != null) {
      profileUpdate.total_games = Math.max(stats.totalGames || 0, existing?.total_games || 0);
    }
    if (xpData.totalXp != null || xpData.total != null) {
      const localXp = xpData.totalXp || xpData.total || 0;
      profileUpdate.total_xp = Math.max(localXp, existing?.total_xp || 0);
    }
    if (stats.favoriteCategory) {
      profileUpdate.favorite_category = stats.favoriteCategory;
    }

    // Update profile if we have any data
    if (Object.keys(profileUpdate).length > 0) {
      profileUpdate.updated_at = new Date().toISOString();
      const { error: profileError } = await supabase
        .from('profiles')
        .update(profileUpdate)
        .eq('id', userId);

      if (profileError) {
        logger.error('Profile migration failed:', profileError.message);
        return false;
      }
    }

    // Migrate unlocked achievements
    if (achievements.length > 0) {
      const rows = achievements.map((achievementId) => ({
        user_id: userId,
        achievement_id: typeof achievementId === 'string' ? achievementId : achievementId.id,
      }));

      const { error: achievError } = await supabase
        .from('user_achievements')
        .upsert(rows, { onConflict: 'user_id,achievement_id', ignoreDuplicates: true });

      if (achievError) {
        logger.error('Achievement migration failed:', achievError.message);
        return false;
      }
    }

    // Mark as migrated
    storage.set(MIGRATED_KEY, true);
    return true;
  } catch (err) {
    logger.error('Migration error:', err);
    return false;
  }
}

export function hasMigrated() {
  return storage.get(MIGRATED_KEY, false) === true;
}
