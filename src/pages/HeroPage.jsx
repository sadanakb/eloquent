import { useAuth } from '../contexts/AuthContext.jsx';
import { Button } from '../components/Button.jsx';
import { Logo } from '../components/Logo.jsx';
import { OrnamentIcon, OrnamentDivider } from '../components/Ornament.jsx';
import { DailyChallenge } from '../components/DailyChallenge.jsx';
import { getDailyChallenge } from '../engine/daily.js';
import styles from './HeroPage.module.css';

export function HeroPage({ onNavigate }) {
  const { isAuthenticated, profile } = useAuth();

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <Logo />
        <p className={styles.tagline}>
          Die Kunst der Sprache als Wettkampf.
        </p>
        <p className={styles.subTagline}>Tritt an. Formuliere. Überzeuge.</p>
      </div>

      <div className={styles.container}>
        {/* Primary Actions */}
        <div className={styles.primaryGrid}>
          <button className={styles.primaryCard} onClick={() => onNavigate('duell')}>
            <div className={styles.primaryIcon}>
              <OrnamentIcon name="federn" size="lg" />
            </div>
            <div className={styles.primaryInfo}>
              <h2 className={styles.primaryTitle}>Duell starten</h2>
              <p className={styles.primaryDesc}>Fordere einen Freund zum lokalen Wortduell heraus</p>
            </div>
          </button>

          <button className={styles.primaryCard} onClick={() => onNavigate('online')}>
            <div className={`${styles.primaryIcon} ${styles.primaryIconAccent}`}>
              <OrnamentIcon name="lorbeer" size="lg" />
            </div>
            <div className={styles.primaryInfo}>
              <h2 className={styles.primaryTitle}>Online Match</h2>
              <p className={styles.primaryDesc}>Miss dich mit Eloquenz-Meistern aus aller Welt</p>
            </div>
          </button>
        </div>

        {/* Secondary Actions */}
        <div className={styles.secondaryGrid}>
          <button className={styles.secondaryCard} onClick={() => onNavigate('uebung')}>
            <OrnamentIcon name="ziel" size="md" />
            <span className={styles.secondaryLabel}>Übungsmodus</span>
          </button>

          <button className={styles.secondaryCard} onClick={() => onNavigate('story')}>
            <OrnamentIcon name="buchOffen" size="md" />
            <span className={styles.secondaryLabel}>Story-Modus</span>
          </button>

          <button className={styles.secondaryCard} onClick={() => {
            const daily = getDailyChallenge();
            onNavigate('uebung', { dailyMode: true, dailySituation: daily.situation });
          }}>
            <OrnamentIcon name="stern" size="md" />
            <span className={styles.secondaryLabel}>Tages-Challenge</span>
          </button>
        </div>

        {/* Daily Challenge Detail */}
        <DailyChallenge onPlay={() => {
          const daily = getDailyChallenge();
          onNavigate('uebung', { dailyMode: true, dailySituation: daily.situation });
        }} />

        {/* Quick Links — desktop only */}
        <nav className={styles.quickLinks}>
          {[
            { icon: 'buch', label: 'Wörterbuch', page: 'woerterbuch' },
            { icon: 'lorbeer', label: 'Rangliste', page: 'rangliste' },
            { icon: 'stern', label: 'Achievements', page: 'achievements' },
            { icon: 'feder', label: 'Regeln', page: 'regeln' },
          ].map(item => (
            <button key={item.page} onClick={() => onNavigate(item.page)} className={styles.quickLink}>
              <OrnamentIcon name={item.icon} size="sm" />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* User greeting */}
        {isAuthenticated && profile?.username && (
          <div className={styles.greeting}>
            Willkommen zurück, <strong>{profile.username}</strong>
          </div>
        )}
      </div>
    </div>
  );
}
