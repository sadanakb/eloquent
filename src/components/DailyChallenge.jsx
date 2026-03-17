import { useState, useEffect } from 'react';
import { Card } from './Card.jsx';
import { Button } from './Button.jsx';
import { getDailyChallenge, getWortDesTages, getDailyStatus } from '../engine/daily.js';
import styles from './DailyChallenge.module.css';

export function DailyChallenge({ onPlay }) {
  const [challenge, setChallenge] = useState(null);
  const [wort, setWort] = useState(null);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    setChallenge(getDailyChallenge());
    setWort(getWortDesTages());
    setStatus(getDailyStatus());
  }, []);

  if (!challenge || !wort || !status) return null;

  const { situation, date } = challenge;

  return (
    <Card ornate className={styles.wrapper}>
      {/* Header */}
      <div className={styles.header}>
        <span className={styles.calendarIcon} aria-hidden="true">&#x1F4C5;</span>
        <h2 className={styles.title}>Tages-Challenge</h2>
        <span className={styles.date}>{date}</span>
      </div>

      {/* Situation preview */}
      <div className={styles.section}>
        <h3 className={styles.situationTitle}>{situation.titel}</h3>
        <p className={styles.situationContext}>{situation.beschreibung}</p>
      </div>

      {/* Wort des Tages */}
      <div className={styles.wortSection}>
        <span className={styles.wortLabel}>Wort des Tages</span>
        <span className={styles.wort}>{wort.wort}</span>
        <span className={styles.wortDef}>{wort.definition}</span>
      </div>

      {/* Streak */}
      {status.streak > 0 && (
        <div className={styles.streak}>
          Streak: {status.streak} {status.streak === 1 ? 'Tag' : 'Tage'}
        </div>
      )}

      {/* Action area */}
      {status.completed ? (
        <div className={styles.completed}>
          <span className={styles.scoreLabel}>Dein Ergebnis: <strong>{status.score}</strong></span>
          <p className={styles.nextHint}>Morgen kommt die n&auml;chste!</p>
        </div>
      ) : (
        <Button variant="gold" onClick={onPlay} className={styles.playBtn}>
          Jetzt spielen
        </Button>
      )}
    </Card>
  );
}
