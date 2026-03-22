import { useAuth } from '../contexts/AuthContext.jsx';
import { Card } from '../components/Card.jsx';
import { Ornament } from '../components/Ornament.jsx';
import { DailyChallenge } from '../components/DailyChallenge.jsx';
import { getDailyChallenge } from '../engine/daily.js';
import {
  CrossedFeathers,
  GlobeNetwork,
  Bullseye,
  OpenBook,
  StarIcon,
  TrophyIcon,
  BookmarkBook,
  ScrollIcon,
} from '../components/icons/Icons.jsx';
import styles from './HeroPage.module.css';

const TITLE = 'ELOQUENT';

export function HeroPage({ onNavigate }) {
  const { isAuthenticated, profile } = useAuth();

  return (
    <div className={styles.page}>
      <div className={styles.container}>

        {/* ── Hero Section ── */}
        <header className={styles.hero}>
          {isAuthenticated && profile?.username && (
            <p className={styles.greeting}>
              Willkommen zurück, <strong>{profile.username}</strong>
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

          <div className={styles.ornamentRow}>
            <Ornament type="divider" />
          </div>

          <p className={styles.subtitle}>Das Wortduell der Eloquenten</p>

          <div className={styles.ornamentRow}>
            <Ornament type="divider" />
          </div>
        </header>

        {/* ── Primary Action Cards ── */}
        <section className={styles.primaryGrid}>
          <Card
            clickable
            onClick={() => onNavigate('duell')}
            className={styles.primaryCard}
          >
            <div className={styles.cardIcon}>
              <CrossedFeathers size={32} color="var(--gold-500)" />
            </div>
            <div className={styles.cardInfo}>
              <h2 className={styles.cardTitle}>Duell starten</h2>
              <p className={styles.cardDesc}>Spiel gegen einen Freund</p>
            </div>
          </Card>

          <Card
            clickable
            onClick={() => onNavigate('online')}
            className={styles.primaryCard}
          >
            <div className={styles.cardIcon}>
              <GlobeNetwork size={32} color="var(--gold-500)" />
            </div>
            <div className={styles.cardInfo}>
              <h2 className={styles.cardTitle}>Online Match</h2>
              <p className={styles.cardDesc}>Finde Gegner weltweit</p>
            </div>
          </Card>
        </section>

        {/* ── Secondary Mode Cards ── */}
        <section className={styles.secondaryRow}>
          <Card
            clickable
            onClick={() => onNavigate('uebung')}
            className={styles.secondaryCard}
          >
            <Bullseye size={24} color="var(--gold-500)" />
            <span className={styles.secondaryLabel}>Übung</span>
          </Card>

          <Card
            clickable
            onClick={() => onNavigate('story')}
            className={styles.secondaryCard}
          >
            <OpenBook size={24} color="var(--gold-500)" />
            <span className={styles.secondaryLabel}>Story</span>
          </Card>

          <Card
            clickable
            onClick={() => {
              const daily = getDailyChallenge();
              onNavigate('uebung', { dailyMode: true, dailySituation: daily.situation });
            }}
            className={styles.secondaryCard}
          >
            <StarIcon size={24} color="var(--gold-500)" />
            <span className={styles.secondaryLabel}>Tages-Challenge</span>
          </Card>
        </section>

        {/* ── Featured: Tages-Challenge Card ── */}
        <section className={styles.featuredSection}>
          <Card featured className={styles.featuredCard}>
            <h2 className={styles.featuredHeading}>Heutiges Wort</h2>
            <DailyChallenge onPlay={() => {
              const daily = getDailyChallenge();
              onNavigate('uebung', { dailyMode: true, dailySituation: daily.situation });
            }} />
          </Card>
        </section>

        {/* ── Quick Links Footer ── */}
        <nav className={styles.quickLinks}>
          {[
            { icon: <BookmarkBook size={16} color="var(--ink-600)" />, label: 'Wörterbuch', page: 'woerterbuch' },
            { icon: <TrophyIcon size={16} color="var(--ink-600)" />, label: 'Rangliste', page: 'rangliste' },
            { icon: <StarIcon size={16} color="var(--ink-600)" />, label: 'Errungenschaften', page: 'achievements' },
            { icon: <ScrollIcon size={16} color="var(--ink-600)" />, label: 'Regeln', page: 'regeln' },
          ].map(item => (
            <button
              key={item.page}
              onClick={() => onNavigate(item.page)}
              className={styles.quickLink}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

      </div>
    </div>
  );
}
