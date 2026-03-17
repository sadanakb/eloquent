import { useState } from 'react';
import { AntwortEingabe } from '../AntwortEingabe.jsx';
import { BewertungDisplay } from '../BewertungDisplay.jsx';
import { Button } from '../Button.jsx';
import { kiBewertung } from '../../engine/scoring-engine.js';
import styles from './FreeTextChallenge.module.css';

const ZEIT_TO_SCHWIERIGKEIT = {
  180: 'leicht',
  150: 'mittel',
  120: 'schwer',
};

function findSchwierigkeit(zeitLimit) {
  if (!zeitLimit) return 'mittel';
  if (zeitLimit >= 180) return 'leicht';
  if (zeitLimit >= 150) return 'mittel';
  return 'schwer';
}

export function FreeTextChallenge({ challenge, onComplete }) {
  const [phase, setPhase] = useState('write');
  const [ergebnis, setErgebnis] = useState(null);

  const { situation, zeitLimit, punkte } = challenge;
  const schwierigkeit = ZEIT_TO_SCHWIERIGKEIT[zeitLimit] || findSchwierigkeit(zeitLimit);

  const handleSubmit = async (text) => {
    if (!text) {
      onComplete(0, false);
      return;
    }

    setPhase('scoring');

    try {
      const result = await kiBewertung(situation, text);
      setErgebnis(result);
      setPhase('result');
    } catch (e) {
      console.error('[FreeTextChallenge] Bewertung fehlgeschlagen:', e);
      setErgebnis(null);
      setPhase('result');
    }
  };

  const handleWeiter = () => {
    if (!ergebnis) {
      onComplete(0, false);
      return;
    }

    const kat = ergebnis.kategorien || {};
    const totalScore = Object.values(kat).reduce((sum, v) => sum + (v.p || 0), 0);
    // Scale from 0-100 range to challenge.punkte range
    const scaledScore = Math.round((totalScore / 100) * punkte);
    const isCorrect = totalScore >= 50;

    onComplete(scaledScore, isCorrect);
  };

  return (
    <div className={styles.wrapper}>
      {phase === 'write' && (
        <AntwortEingabe
          situation={situation}
          schwierigkeit={schwierigkeit}
          onSubmit={handleSubmit}
        />
      )}

      {phase === 'scoring' && (
        <div className={`${styles.scoringWrap} animate-in`}>
          <div className={styles.spinner} />
          <p className={styles.scoringText}>Deine Antwort wird bewertet...</p>
        </div>
      )}

      {phase === 'result' && (
        <div className="animate-in">
          {ergebnis ? (
            <BewertungDisplay ergebnis={ergebnis} />
          ) : (
            <p className={styles.errorText}>
              Die Bewertung konnte leider nicht durchgeführt werden.
            </p>
          )}
          <div className={styles.weiterWrap}>
            <Button variant="gold" onClick={handleWeiter}>
              Weiter &rarr;
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
