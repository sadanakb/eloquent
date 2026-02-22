import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { WOERTERBUCH } from '../data/woerterbuch.js';
import { Card } from './Card.jsx';
import { Badge } from './Badge.jsx';
import { Button } from './Button.jsx';
import { OrnamentIcon } from './Ornament.jsx';
import styles from './AntwortEingabe.module.css';

const TIMER_DURATIONS = { leicht: 180, mittel: 150, schwer: 120 };
const DEFAULT_TIMER = 150;

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function WortHinweise() {
  const woerter = useMemo(() => {
    const shuffled = [...WOERTERBUCH].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 5);
  }, []);

  const [offen, setOffen] = useState(false);

  return (
    <div className={styles.hinweiseWrap}>
      <div onClick={() => setOffen(!offen)} className={styles.hinweiseHeader}>
        <span className={styles.hinweiseLabel}>
          <OrnamentIcon name="buch" size="sm" style={{ marginRight: 6, verticalAlign: 'text-bottom' }} />
          Wort-Inspiration ({woerter.length} Wörter)
        </span>
        <span className={offen ? styles.hinweiseArrowOpen : styles.hinweiseArrow}>▼</span>
      </div>
      {offen && (
        <div className={styles.hinweiseBody}>
          {woerter.map((w, i) => (
            <div key={i} className={styles.hinweiseItem}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 2 }}>
                <span className={styles.hinweiseWort}>{w.wort}</span>
                <span className={styles.hinweiseArt}>{w.wortart}</span>
              </div>
              <div className={styles.hinweiseDef}>{w.definition}</div>
              <div className={styles.hinweiseBsp}>{'\u201E'}{w.beispiel}{'\u201C'}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function AntwortEingabe({ situation, spielerName, onSubmit, schwierigkeit }) {
  const [text, setText] = useState('');
  const wc = text.trim().split(/\s+/).filter(Boolean).length;
  const taRef = useRef(null);
  const textRef = useRef(text);
  const submittedRef = useRef(false);

  const totalTime = TIMER_DURATIONS[schwierigkeit] || DEFAULT_TIMER;
  const [timeLeft, setTimeLeft] = useState(totalTime);

  useEffect(() => { textRef.current = text; }, [text]);
  useEffect(() => { taRef.current?.focus(); }, []);

  useEffect(() => {
    submittedRef.current = false;
    setTimeLeft(totalTime);
  }, [totalTime]);

  const doSubmit = useCallback(() => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    const currentText = textRef.current.trim();
    const currentWc = currentText.split(/\s+/).filter(Boolean).length;
    if (!currentText || currentWc === 0) {
      onSubmit(null);
    } else {
      onSubmit(currentText);
    }
  }, [onSubmit]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          doSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [doSubmit]);

  const ratio = timeLeft / totalTime;
  const isUrgent = timeLeft <= 15;
  const timerColor = ratio > 0.5 ? 'var(--success)' : ratio > 0.25 ? 'var(--accent-gold)' : 'var(--error)';

  return (
    <div className={`${styles.wrapper} animate-in`}>
      <Card>
        {/* Timer */}
        <div>
          <div className={styles.timerRow}>
            <span className={styles.timerLabel}>Verbleibende Zeit</span>
            <span
              className={isUrgent ? styles.timerUrgent : styles.timerNormal}
              style={{ color: timerColor }}
            >
              {formatTime(timeLeft)}
            </span>
          </div>
          <div className={styles.progressTrack}>
            <div className={styles.progressFill} style={{ width: `${ratio * 100}%`, background: timerColor }} />
          </div>
        </div>

        <div className={styles.situationContext}>
          <Badge>{situation.kontext}</Badge>
          <h2 className={styles.situationTitle}>{situation.titel}</h2>
          <p className={styles.situationDesc}>{situation.beschreibung}</p>
        </div>

        <WortHinweise />

        <div style={{ position: 'relative' }}>
          {spielerName && (
            <div className={styles.spielerLabel}>
              <OrnamentIcon name="feder" size="sm" style={{ marginRight: 6, verticalAlign: 'text-bottom' }} />
              {spielerName}, zeig deine Eloquenz:
            </div>
          )}
          <textarea
            ref={taRef}
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Schreibe hier deine eloquente Antwort..."
            disabled={timeLeft <= 0}
            className={styles.textarea}
            style={isUrgent ? { borderColor: timerColor } : undefined}
          />
          <div className={styles.footer}>
            <span className={wc < 10 ? styles.wordCountLow : styles.wordCountOk}>
              {wc} Wörter {wc < 10 ? '(min. 10)' : '\u2713'}
            </span>
            <Button variant="gold" disabled={wc < 10 || timeLeft <= 0} onClick={() => { if (submittedRef.current) return; doSubmit(); }}>
              Antwort abgeben \u2192
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
