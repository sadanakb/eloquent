import { useMemo, useState } from 'react';
import { ACHIEVEMENTS, ACHIEVEMENT_CATEGORIES } from '../data/achievements.js';
import { getUnlocked, getStats } from '../engine/achievements.js';
import { Button } from '../components/Button.jsx';
import { OrnamentIcon, OrnamentDivider } from '../components/Ornament.jsx';
import { TrophyIcon, LockIcon } from '../components/icons/Icons.jsx';
import styles from './AchievementPage.module.css';

/**
 * Compute a 0–1 progress fraction for a locked achievement.
 * We run the condition with progressively scaled stats to find the threshold.
 * Fallback: binary 0 or 1.
 */
function getProgressFraction(achievement, stats) {
  // Try to find numeric threshold by bisection
  const STAT_KEYS = [
    'total_duells', 'total_uebungen', 'total_games', 'best_score',
    'gehobene_count', 'current_streak', 'story_chapters_completed',
    'daily_completed', 'daily_streak', 'max_rhetorik_devices',
    'total_metaphors', 'categories_played', 'difficulties_played',
    'total_words', 'perfect_categories',
  ];

  // Find which stat key the condition depends on by testing with extreme values
  for (const key of STAT_KEYS) {
    try {
      const testHigh = { ...stats, [key]: 999999 };
      const testLow = { ...stats, [key]: 0 };
      const highUnlocks = achievement.condition(testHigh);
      const lowLocked = !achievement.condition(testLow);
      if (highUnlocks && lowLocked) {
        // Bisect to find threshold
        let lo = 0, hi = 999999;
        for (let i = 0; i < 30; i++) {
          const mid = Math.floor((lo + hi) / 2);
          if (achievement.condition({ ...stats, [key]: mid })) {
            hi = mid;
          } else {
            lo = mid + 1;
          }
        }
        const threshold = hi;
        const current = stats[key] || 0;
        return Math.min(1, current / threshold);
      }
    } catch {
      // ignore
    }
  }
  // Boolean or undetectable — 0
  return 0;
}

export function AchievementPage({ onNavigate }) {
  const [activeCategory, setActiveCategory] = useState('Alle');

  const unlocked = useMemo(() => getUnlocked(), []);
  const unlockedSet = useMemo(() => new Set(unlocked), [unlocked]);
  const stats = useMemo(() => getStats(), []);

  const totalUnlocked = unlocked.length;
  const totalAchievements = ACHIEVEMENTS.length;
  const progressPercent = totalAchievements > 0
    ? (totalUnlocked / totalAchievements) * 100
    : 0;

  // Last unlocked achievement (last in ACHIEVEMENTS order that is unlocked)
  const lastUnlocked = useMemo(() => {
    const unlockedAchs = ACHIEVEMENTS.filter(a => unlockedSet.has(a.id));
    return unlockedAchs.length > 0 ? unlockedAchs[unlockedAchs.length - 1] : null;
  }, [unlockedSet]);

  // Find closest-to-unlocking locked achievement (highest progress fraction)
  const closestLocked = useMemo(() => {
    const locked = ACHIEVEMENTS.filter(a => !unlockedSet.has(a.id));
    if (locked.length === 0) return null;

    let best = null;
    let bestFraction = 0;
    let bestThreshold = 0;
    let bestCurrent = 0;

    for (const ach of locked) {
      const fraction = getProgressFraction(ach, stats);
      if (fraction > bestFraction) {
        bestFraction = fraction;
        best = ach;
        // Estimate threshold and current values
        // fraction = current / threshold => threshold = current / fraction
        // We need to find which stat key is relevant
        const STAT_KEYS = [
          'total_duells', 'total_uebungen', 'total_games', 'best_score',
          'gehobene_count', 'current_streak', 'story_chapters_completed',
          'daily_completed', 'daily_streak', 'max_rhetorik_devices',
          'total_metaphors', 'categories_played', 'difficulties_played',
          'total_words', 'perfect_categories',
        ];
        for (const key of STAT_KEYS) {
          try {
            const testHigh = { ...stats, [key]: 999999 };
            const testLow = { ...stats, [key]: 0 };
            if (ach.condition(testHigh) && !ach.condition(testLow)) {
              // Bisect threshold
              let lo = 0, hi = 999999;
              for (let i = 0; i < 30; i++) {
                const mid = Math.floor((lo + hi) / 2);
                if (ach.condition({ ...stats, [key]: mid })) hi = mid;
                else lo = mid + 1;
              }
              bestThreshold = hi;
              bestCurrent = stats[key] || 0;
              break;
            }
          } catch { /* ignore */ }
        }
      }
    }

    // Only show banner if ≥ 70% complete
    if (best && bestFraction >= 0.7) {
      return {
        achievement: best,
        fraction: bestFraction,
        current: bestCurrent,
        threshold: bestThreshold,
        remaining: Math.max(1, bestThreshold - bestCurrent),
      };
    }
    return null;
  }, [unlockedSet, stats]);

  const filtered = useMemo(() => {
    if (activeCategory === 'Alle') return ACHIEVEMENTS;
    return ACHIEVEMENTS.filter(a => a.category === activeCategory);
  }, [activeCategory]);

  return (
    <div className={styles.page}>
      <div className={styles.container}>

        {/* ── Back button ── */}
        {onNavigate && (
          <button
            className={styles.backBtn}
            onClick={() => onNavigate('home')}
            aria-label="Zurück zur Startseite"
          >
            ← Zurück
          </button>
        )}

        {/* ── Hero section ── */}
        <div className={styles.hero}>
          <div className={styles.heroIcon}>
            {lastUnlocked ? (
              <OrnamentIcon
                name={lastUnlocked.icon}
                size="xl"
                className={styles.heroIconGold}
              />
            ) : (
              <OrnamentIcon
                name="lorbeer"
                size="xl"
                className={styles.heroIconMuted}
              />
            )}
          </div>

          <h1 className={styles.heroTitle}>
            {lastUnlocked ? lastUnlocked.name : 'Noch keine Erfolge'}
          </h1>

          {lastUnlocked && (
            <p className={styles.heroDesc}>{lastUnlocked.description}</p>
          )}

          <div className={styles.heroCounter}>
            <span className={styles.heroCountNum}>{totalUnlocked}</span>
            <span className={styles.heroCountSep}> / {totalAchievements} freigeschaltet</span>
          </div>

          <div className={styles.progressWrap}>
            <div
              className={styles.progressBar}
              style={{ '--progress-width': `${progressPercent}%` }}
              role="progressbar"
              aria-valuenow={totalUnlocked}
              aria-valuemax={totalAchievements}
              aria-label="Erfolgsfortschritt"
            />
          </div>
        </div>

        <OrnamentDivider />

        {/* ── "Fast geschafft" banner ── */}
        {closestLocked && (
          <div className={styles.banner}>
            <div className={styles.bannerIcon}>
              <TrophyIcon size={20} color="var(--accent-success)" />
            </div>
            <div className={styles.bannerContent}>
              <p className={styles.bannerText}>
                Noch <strong>{closestLocked.remaining}</strong> mehr, dann:{' '}
                <em>{closestLocked.achievement.name}</em>!
              </p>
              <div className={styles.bannerProgress}>
                <div
                  className={styles.bannerProgressBar}
                  style={{ width: `${closestLocked.fraction * 100}%` }}
                />
              </div>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => onNavigate?.('uebung')}
            >
              Jetzt spielen →
            </Button>
          </div>
        )}

        {/* ── Category tabs ── */}
        <div className={styles.tabs}>
          {ACHIEVEMENT_CATEGORIES.map(cat => (
            <button
              key={cat}
              className={`${styles.tab} ${activeCategory === cat ? styles.tabActive : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* ── Badge grid ── */}
        <div className={styles.grid}>
          {filtered.map((ach, index) => {
            const isUnlocked = unlockedSet.has(ach.id);

            return (
              <div
                key={ach.id}
                className={`${styles.badge} ${isUnlocked ? styles.badgeUnlocked : styles.badgeLocked}`}
                style={{ animationDelay: `${index * 0.03}s` }}
                title={isUnlocked ? ach.description : `Gesperrt: ${ach.description}`}
              >
                <div className={styles.badgeIcon}>
                  {isUnlocked ? (
                    <OrnamentIcon
                      name={ach.icon}
                      size="md"
                      className={styles.badgeIconColor}
                    />
                  ) : (
                    <LockIcon size={20} color="var(--ink-400)" />
                  )}
                </div>
                <div className={styles.badgeName}>
                  {isUnlocked ? ach.name : '???'}
                </div>
                <div className={styles.badgeDesc}>
                  {isUnlocked ? ach.description : 'Noch gesperrt'}
                </div>
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <p className={styles.empty}>Keine Erfolge in dieser Kategorie.</p>
        )}
      </div>
    </div>
  );
}
