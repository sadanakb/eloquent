import { useMemo, useState } from 'react';
import { ACHIEVEMENTS, ACHIEVEMENT_CATEGORIES } from '../data/achievements.js';
import { getUnlocked } from '../engine/achievements.js';
import { Card } from '../components/Card.jsx';
import { GoldBar } from '../components/GoldBar.jsx';
import { OrnamentIcon, OrnamentDivider } from '../components/Ornament.jsx';
import styles from './AchievementPage.module.css';

export function AchievementPage({ onNavigate }) {
  const [activeCategory, setActiveCategory] = useState('Alle');
  const unlocked = useMemo(() => getUnlocked(), []);
  const unlockedSet = useMemo(() => new Set(unlocked), [unlocked]);

  const filtered = useMemo(() => {
    if (activeCategory === 'Alle') return ACHIEVEMENTS;
    return ACHIEVEMENTS.filter(a => a.category === activeCategory);
  }, [activeCategory]);

  const totalUnlocked = unlocked.length;
  const totalAchievements = ACHIEVEMENTS.length;

  return (
    <div className={styles.wrapper}>
      {/* ── Header ── */}
      <div className={styles.header}>
        {onNavigate && (
          <button
            className={styles.backBtn}
            onClick={() => onNavigate('home')}
            aria-label="Zurück"
          >
            ← Zurück
          </button>
        )}
        <h1 className={styles.title}>Erfolge</h1>
        <p className={styles.subtitle}>
          {totalUnlocked} von {totalAchievements} freigeschaltet
        </p>

        {/* Progress bar */}
        <div className={styles.progressWrap}>
          <GoldBar value={totalUnlocked} max={totalAchievements} />
        </div>
      </div>

      <OrnamentDivider />

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

      {/* ── Achievement grid ── */}
      <div className={styles.grid}>
        {filtered.map(ach => {
          const isUnlocked = unlockedSet.has(ach.id);

          return (
            <Card
              key={ach.id}
              className={`${styles.achCard} ${isUnlocked ? styles.unlocked : styles.locked}`}
              glow={isUnlocked}
            >
              <div className={styles.achIcon}>
                {isUnlocked ? (
                  <OrnamentIcon name={ach.icon} size="lg" className={styles.iconColor} />
                ) : (
                  <OrnamentIcon name="ziel" size="lg" className={styles.iconMuted} />
                )}
              </div>
              <div className={styles.achInfo}>
                <div className={styles.achName}>
                  {isUnlocked ? ach.name : '???'}
                </div>
                <div className={styles.achDesc}>
                  {isUnlocked ? ach.description : 'Noch nicht freigeschaltet'}
                </div>
                {isUnlocked && (
                  <div className={styles.achCategory}>{ach.category}</div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <p className={styles.empty}>Keine Erfolge in dieser Kategorie.</p>
      )}
    </div>
  );
}
