import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { getRankTitle } from '../engine/elo.js';
import { getXP } from '../engine/xp-system.js';
import { getProgress, getUnlocked } from '../engine/achievements.js';
import { ACHIEVEMENTS } from '../data/achievements.js';
import { Card } from '../components/Card.jsx';
import { Badge } from '../components/Badge.jsx';
import { Button } from '../components/Button.jsx';
import { OrnamentDivider } from '../components/Ornament.jsx';
import { AuthModal } from '../components/AuthModal.jsx';
import { ShieldIcon, TrophyIcon, StarIcon } from '../components/icons/Icons.jsx';
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
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.loadingWrap}>
            <ShieldIcon size={40} color="var(--gold-500)" />
            <p className={styles.loadingText}>Profil wird geladen…</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={`${styles.loginPrompt} animate-in`}>
            <ShieldIcon size={56} color="var(--gold-500)" />
            <h2 className={styles.loginTitle}>Anmeldung erforderlich</h2>
            <p className={styles.loginText}>
              Melde dich an, um dein Profil zu sehen, Online-Duelle zu spielen
              und deinen Fortschritt zu verfolgen.
            </p>
            <Button variant="primary" onClick={() => setShowAuth(true)}>
              Jetzt anmelden
            </Button>
          </div>
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

  const xpPercent = Math.round(xpData.xpProgress * 100);

  // Get top 5 most recently unlocked achievements
  const unlockedAchievements = ACHIEVEMENTS
    .filter(a => unlockedIds.includes(a.id))
    .slice(-5)
    .reverse();

  return (
    <div className={styles.page}>
      <div className={styles.container}>

        {/* Profile Header */}
        <Card className={`${styles.headerCard} animate-in`}>
          <div className={styles.avatarArea}>
            {profile?.avatar_url && !AVATAR_ICON_MAP[profile.avatar_url] ? (
              <img
                src={profile.avatar_url}
                alt={profile?.username || 'Avatar'}
                className={styles.avatarImg}
                loading="lazy"
              />
            ) : (
              <div className={styles.avatarIcon}>
                <ShieldIcon size={64} color="var(--gold-500)" />
              </div>
            )}
          </div>
          <h1 className={styles.username}>{profile?.username || 'Spieler'}</h1>
          {profile?.friend_code && (
            <div className={styles.rankRow} style={{ marginBottom: '0.25rem' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                #{profile.friend_code}
              </span>
            </div>
          )}
          <div className={styles.rankRow}>
            <Badge type="rank">{rankTitle}</Badge>
            <span className={styles.eloNum}>{elo} Elo</span>
          </div>
        </Card>

        {/* Stats Grid */}
        <Card className={styles.statsCard}>
          <h2 className={styles.sectionHeading}>Statistiken</h2>
          <OrnamentDivider />
          <div className={styles.statsGrid}>
            <div className={styles.statBox}>
              <span className={styles.statValue}>{wins}</span>
              <span className={styles.statLabel}>Siege</span>
            </div>
            <div className={styles.statBox}>
              <span className={styles.statValue}>{losses}</span>
              <span className={styles.statLabel}>Niederlagen</span>
            </div>
            <div className={styles.statBox}>
              <span className={styles.statValue}>{winRate}%</span>
              <span className={styles.statLabel}>Siegquote</span>
            </div>
            <div className={styles.statBox}>
              <span className={styles.statValue}>{totalGames}</span>
              <span className={styles.statLabel}>Spiele gesamt</span>
            </div>
          </div>
        </Card>

        {/* XP Progress */}
        <Card className={styles.xpCard}>
          <h2 className={styles.sectionHeading}>Erfahrung</h2>
          <OrnamentDivider />
          <div className={styles.xpMeta}>
            <span className={styles.xpLevel}>Lv. {xpData.level} — {xpData.levelName}</span>
            <span className={styles.xpTotal}>{xpData.totalXP} XP</span>
          </div>
          <div className={styles.progressTrack}>
            <div
              className={styles.progressFill}
              style={{ width: `${xpPercent}%` }}
            />
          </div>
          <div className={styles.xpFooter}>
            {xpData.xpForNextLevel > 0
              ? `Noch ${xpData.xpForNextLevel} XP bis zum nächsten Level`
              : 'Maximales Level erreicht!'}
          </div>
        </Card>

        {/* Achievements */}
        <Card className={styles.achievementsCard}>
          <h2 className={styles.sectionHeading}>
            Errungenschaften ({achievementProgress.unlocked}/{achievementProgress.total})
          </h2>
          <OrnamentDivider />
          {unlockedAchievements.length > 0 ? (
            <div className={styles.achievementList}>
              {unlockedAchievements.map((ach, idx) => (
                <div
                  key={ach.id}
                  className={styles.achievementRow}
                  style={{ animationDelay: `${idx * 0.05}s` }}
                >
                  <span className={styles.achievementIcon}>{ach.icon || <StarIcon size={18} color="var(--gold-500)" />}</span>
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
            <Button variant="tertiary" onClick={() => onNavigate('achievements')}>
              Alle Errungenschaften ansehen
            </Button>
          </div>
        </Card>

        {/* Match History */}
        <Card className={styles.historyCard}>
          <h2 className={styles.sectionHeading}>Letzte Spiele</h2>
          <OrnamentDivider />
          <p className={styles.emptyText}>Noch keine Online-Matches gespielt.</p>
        </Card>

        {/* Actions */}
        <div className={styles.actions}>
          <Button variant="secondary" onClick={() => setShowEditAuth(true)}>
            Profil bearbeiten
          </Button>
          <Button variant="secondary" onClick={signOut}>
            Abmelden
          </Button>
        </div>

      </div>

      {showEditAuth && <AuthModal onClose={() => setShowEditAuth(false)} />}
    </div>
  );
}
