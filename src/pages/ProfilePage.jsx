import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { getRankTitle } from '../engine/elo.js';
import { getXP } from '../engine/xp-system.js';
import { getProgress, getUnlocked } from '../engine/achievements.js';
import { ACHIEVEMENTS } from '../data/achievements.js';
import { Card } from '../components/Card.jsx';
import { Badge } from '../components/Badge.jsx';
import { GoldBar } from '../components/GoldBar.jsx';
import { Button } from '../components/Button.jsx';
import { OrnamentIcon, OrnamentDivider } from '../components/Ornament.jsx';
import { AuthModal } from '../components/AuthModal.jsx';
import styles from './ProfilePage.module.css';

const AVATAR_ICON_MAP = {
  quill: 'feder',
  book: 'buch',
  inkwell: 'tintenfass',
  laurel: 'lorbeer',
  scroll: 'buchOffen',
  mask: 'stern',
};

export function ProfilePage({ onNavigate }) {
  const { profile, isAuthenticated, isLoading, signOut } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [showEditAuth, setShowEditAuth] = useState(false);

  if (isLoading) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.loadingWrap}>
          <OrnamentIcon name="tintenfass" size="lg" />
          <p className={styles.loadingText}>Profil wird geladen...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className={styles.wrapper}>
        <div className={`${styles.loginPrompt} animate-in`}>
          <OrnamentIcon name="federn" size="xl" className={styles.loginIcon} />
          <h2 className={styles.loginTitle}>Anmeldung erforderlich</h2>
          <p className={styles.loginText}>
            Melde dich an, um dein Profil zu sehen, Online-Duelle zu spielen
            und deinen Fortschritt zu verfolgen.
          </p>
          <Button variant="gold" onClick={() => setShowAuth(true)}>
            Jetzt anmelden
          </Button>
        </div>
        {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
      </div>
    );
  }

  const elo = profile?.elo_rating || 1200;
  const rankTitle = getRankTitle(elo);
  const wins = profile?.wins || 0;
  const losses = profile?.losses || 0;
  const totalGames = profile?.total_games || 0;
  const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;

  const xpData = getXP();
  const achievementProgress = getProgress();
  const unlockedIds = getUnlocked();

  // Get top 5 most recently unlocked achievements
  const unlockedAchievements = ACHIEVEMENTS
    .filter(a => unlockedIds.includes(a.id))
    .slice(-5)
    .reverse();

  return (
    <div className={styles.wrapper}>
      {/* Header */}
      <div className={`${styles.header} animate-in`}>
        <div className={styles.avatarLarge}>
          <OrnamentIcon name={AVATAR_ICON_MAP[profile?.avatar] || 'feder'} size="xl" />
        </div>
        <h1 className={styles.username}>{profile?.username || 'Spieler'}</h1>
        <div className={styles.rankRow}>
          <Badge>{rankTitle}</Badge>
          <span className={styles.eloNum}>{elo} Elo</span>
        </div>
      </div>

      {/* Stats grid */}
      <Card style={{ marginBottom: 16 }}>
        <h3 className={styles.sectionTitle}>
          <OrnamentIcon name="ziel" size="sm" style={{ marginRight: 6, verticalAlign: 'text-bottom' }} />
          Statistiken
        </h3>
        <div className={styles.statsGrid}>
          <div className={styles.statCell}>
            <span className={styles.statValue}>{wins}</span>
            <span className={styles.statLabel}>Siege</span>
          </div>
          <div className={styles.statCell}>
            <span className={styles.statValue}>{losses}</span>
            <span className={styles.statLabel}>Niederlagen</span>
          </div>
          <div className={styles.statCell}>
            <span className={styles.statValue}>{totalGames}</span>
            <span className={styles.statLabel}>Spiele</span>
          </div>
          <div className={styles.statCell}>
            <span className={styles.statValue}>{winRate}%</span>
            <span className={styles.statLabel}>Siegquote</span>
          </div>
        </div>
      </Card>

      {/* XP section */}
      <Card style={{ marginBottom: 16 }}>
        <h3 className={styles.sectionTitle}>
          <OrnamentIcon name="stern" size="sm" style={{ marginRight: 6, verticalAlign: 'text-bottom' }} />
          Erfahrung
        </h3>
        <div className={styles.xpHeader}>
          <span className={styles.xpLevel}>Lv. {xpData.level} {xpData.levelName}</span>
          <span className={styles.xpTotal}>{xpData.totalXP} XP</span>
        </div>
        <GoldBar value={xpData.xpProgress} max={1} />
        <div className={styles.xpFooter}>
          {xpData.xpForNextLevel > 0
            ? `Noch ${xpData.xpForNextLevel} XP bis zum nächsten Level`
            : 'Maximales Level erreicht!'}
        </div>
      </Card>

      {/* Achievements */}
      <Card style={{ marginBottom: 16 }}>
        <h3 className={styles.sectionTitle}>
          <OrnamentIcon name="lorbeer" size="sm" style={{ marginRight: 6, verticalAlign: 'text-bottom' }} />
          Errungenschaften ({achievementProgress.unlocked}/{achievementProgress.total})
        </h3>
        {unlockedAchievements.length > 0 ? (
          <div className={styles.achievementList}>
            {unlockedAchievements.map(ach => (
              <div key={ach.id} className={styles.achievementRow}>
                <span className={styles.achievementIcon}>{ach.icon || ''}</span>
                <div className={styles.achievementInfo}>
                  <span className={styles.achievementName}>{ach.name}</span>
                  <span className={styles.achievementDesc}>{ach.description}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className={styles.emptyText}>Noch keine Errungenschaften freigeschaltet.</p>
        )}
        <div className={styles.linkRow}>
          <Button variant="ghost" onClick={() => onNavigate('achievements')}>
            Alle Errungenschaften
          </Button>
        </div>
      </Card>

      {/* Match history placeholder */}
      <Card style={{ marginBottom: 16 }}>
        <h3 className={styles.sectionTitle}>
          <OrnamentIcon name="buchOffen" size="sm" style={{ marginRight: 6, verticalAlign: 'text-bottom' }} />
          Match-Verlauf
        </h3>
        <p className={styles.emptyText}>Noch keine Online-Matches gespielt.</p>
      </Card>

      {/* Actions */}
      <div className={styles.actions}>
        <Button variant="ghost" onClick={() => setShowEditAuth(true)}>
          Profil bearbeiten
        </Button>
        <Button variant="danger" onClick={signOut}>
          Abmelden
        </Button>
      </div>

      {showEditAuth && <AuthModal onClose={() => setShowEditAuth(false)} />}
    </div>
  );
}
