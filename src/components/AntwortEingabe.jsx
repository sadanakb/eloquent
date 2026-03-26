import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import eventBus from '../engine/event-bus.js';
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

export function AntwortEingabe({ situation, spielerName, onSubmit, schwierigkeit, matchStartTime, onPasteDetected }) {
  const [text, setText] = useState('');
  const [pasteHint, setPasteHint] = useState(false);
  const wc = text.trim().split(/\s+/).filter(Boolean).length;
  const charCount = text.length;
  const charsRemaining = 5000 - charCount;
  const showCharCounter = charCount >= 4500;
  const canSubmit = charCount >= 10 && wc >= 10;
  const taRef = useRef(null);
  const textRef = useRef(text);
  const submittedRef = useRef(false);

  const handlePaste = useCallback((e) => {
    const pasted = e.clipboardData?.getData('text') || '';
    if (pasted.length > 100) {
      setPasteHint(true);
      onPasteDetected?.(true);
      setTimeout(() => setPasteHint(false), 5000);
    }
  }, [onPasteDetected]);

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
    if (matchStartTime) {
      // Server-synced timer: calculate from match creation time
      const interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - new Date(matchStartTime).getTime()) / 1000);
        const remaining = Math.max(0, totalTime - elapsed);
        setTimeLeft(remaining);

        if (remaining <= 0) {
          clearInterval(interval);
          if (!submittedRef.current) {
            doSubmit();
          }
        }
      }, 250); // 250ms for smoother updates

      return () => clearInterval(interval);
    } else {
      // Local timer fallback (offline/practice modes)
      const interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            if (!submittedRef.current) {
              doSubmit();
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [matchStartTime, totalTime, doSubmit]);

  useEffect(() => {
    if (timeLeft === 15) {
      eventBus.emit('sound:play', { sound: 'timerWarning' });
    }
  }, [timeLeft]);

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
              aria-live="polite"
              aria-atomic="true"
              role="timer"
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
            onPaste={handlePaste}
            maxLength={5000}
            placeholder="Schreibe hier deine eloquente Antwort..."
            disabled={timeLeft <= 0}
            className={styles.textarea}
            style={isUrgent ? { borderColor: timerColor } : undefined}
            aria-label="Deine Antwort"
          />
          {pasteHint && (
            <div className={styles.pasteHint}>
              Tipp: Eigene Formulierungen werden besser bewertet
            </div>
          )}
          {showCharCounter && (
            <span className={`${styles.charCounter} ${charsRemaining <= 100 ? styles.charCounterUrgent : ''}`}>
              {charsRemaining} Zeichen übrig
            </span>
          )}
          {charCount > 0 && charCount < 10 && (
            <span className={styles.minLengthHint}>Mindestens 10 Zeichen</span>
          )}
          <div className={styles.footer}>
            <span className={wc < 10 ? styles.wordCountLow : styles.wordCountOk}>
              {wc} Wörter {wc < 10 ? '(min. 10)' : '\u2713'}
            </span>
            <Button variant="gold" disabled={!canSubmit || timeLeft <= 0} onClick={() => { if (submittedRef.current) return; doSubmit(); }}>
              Antwort abgeben →
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
