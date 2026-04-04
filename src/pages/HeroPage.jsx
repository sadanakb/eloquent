import { useAuth } from '../contexts/AuthContext.jsx';
import { Ornament } from '../components/Ornament.jsx';
import { DailyChallenge } from '../components/DailyChallenge.jsx';
import { getDailyChallenge } from '../engine/daily.js';
import {
  TrophyIcon,
  BookmarkBook,
} from '../components/icons/Icons.jsx';
import styles from './HeroPage.module.css';

const TITLE = 'ELOQUENT';

export function HeroPage({ onNavigate, onOpenSettings }) {
  const { isAuthenticated, profile } = useAuth();

  return (
    <div className={styles.page}>
      <div className={styles.container}>

        {/* ── Hero Header ── */}
        <header className={styles.hero}>
          <button
            className={styles.settingsBtn}
            onClick={onOpenSettings}
            aria-label="Einstellungen"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>

          {isAuthenticated && profile?.username && (
            <p className={styles.greeting}>
              Willkommen, <strong>{profile.username}</strong>
            </p>
          )}

          <h1 className={styles.title} aria-label={TITLE}>
            {TITLE.split('').map((char, i) => (
              <span
                key={i}
                className={styles.letter}
                style={{ animationDelay: `${i * 0.06}s` }}
              >
                {char}
              </span>
            ))}
          </h1>

          <Ornament type="divider" />
        </header>

        {/* ── Schnellstart ── */}
        <button
          className={styles.playBtn}
          onClick={() => onNavigate('duell')}
        >
          <span className={styles.playLabel}>Jetzt spielen</span>
          <span className={styles.playHint}>Online-Match starten</span>
        </button>

        {/* ── Tages-Challenge ── */}
        <section className={styles.dailySection}>
          <DailyChallenge onPlay={() => {
            const daily = getDailyChallenge();
            onNavigate('uebung', { dailyMode: true, dailySituation: daily.situation });
          }} />
        </section>

        {/* ── Quick Links ── */}
        <nav className={styles.quickLinks}>
          <button onClick={() => onNavigate('rangliste')} className={styles.quickLink}>
            <TrophyIcon size={18} color="var(--ink-400)" />
            <span>Rangliste</span>
          </button>
          <button onClick={() => onNavigate('woerterbuch')} className={styles.quickLink}>
            <BookmarkBook size={18} color="var(--ink-400)" />
            <span>Wörterbuch</span>
          </button>
        </nav>

      </div>
    </div>
  );
}
