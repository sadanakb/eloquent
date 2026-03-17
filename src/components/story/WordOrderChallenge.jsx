import { useState } from 'react';
import eventBus from '../../engine/event-bus.js';
import { Card } from '../Card.jsx';
import { Badge } from '../Badge.jsx';
import { Button } from '../Button.jsx';
import styles from './WordOrderChallenge.module.css';

export function WordOrderChallenge({ challenge, onComplete }) {
  const [selected, setSelected] = useState([]);
  const [submitted, setSubmitted] = useState(false);

  const { anweisung, woerter, richtigeReihenfolge, erklaerung, punkte } = challenge;

  const availableIndices = woerter
    .map((_, i) => i)
    .filter((i) => !selected.includes(i));

  const isCorrect =
    submitted &&
    selected.length === richtigeReihenfolge.length &&
    selected.every((idx, i) => woerter[idx] === richtigeReihenfolge[i]);

  const handleSelectWord = (idx) => {
    if (submitted) return;
    setSelected((prev) => [...prev, idx]);
  };

  const handleRemoveWord = (positionIdx) => {
    if (submitted) return;
    setSelected((prev) => prev.filter((_, i) => i !== positionIdx));
  };

  const handleSubmit = () => {
    setSubmitted(true);
    const correct =
      selected.length === richtigeReihenfolge.length &&
      selected.every((idx, i) => woerter[idx] === richtigeReihenfolge[i]);

    if (correct) {
      eventBus.emit('sound:play', { sound: 'success' });
    } else {
      eventBus.emit('sound:play', { sound: 'error' });
    }
  };

  const allSelected = selected.length === woerter.length;

  return (
    <div className={`${styles.wrapper} animate-in`}>
      <Card>
        <p className={styles.anweisung}>{anweisung}</p>

        {/* Selected area */}
        <div className={styles.selectedArea}>
          <div className={styles.selectedLabel}>Deine Reihenfolge:</div>
          <div className={styles.tileRow}>
            {selected.length === 0 && (
              <span className={styles.placeholder}>Tippe auf die Wörter in der richtigen Reihenfolge</span>
            )}
            {selected.map((wordIdx, posIdx) => {
              let tileClass = styles.tileSelected;
              if (submitted) {
                const correctWord = richtigeReihenfolge[posIdx];
                tileClass = woerter[wordIdx] === correctWord
                  ? styles.tileCorrect
                  : styles.tileWrong;
              }
              return (
                <button
                  key={`sel-${posIdx}`}
                  className={tileClass}
                  onClick={() => handleRemoveWord(posIdx)}
                  disabled={submitted}
                >
                  {woerter[wordIdx]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Available words */}
        <div className={styles.availableArea}>
          <div className={styles.tileRow}>
            {woerter.map((wort, i) => {
              const isUsed = selected.includes(i);
              return (
                <button
                  key={`avail-${i}`}
                  className={isUsed ? styles.tileUsed : styles.tile}
                  onClick={() => handleSelectWord(i)}
                  disabled={isUsed || submitted}
                >
                  {wort}
                </button>
              );
            })}
          </div>
        </div>

        {/* Submit / Result */}
        {!submitted && (
          <div className={styles.actionRow}>
            <Button
              variant="gold"
              disabled={!allSelected}
              onClick={handleSubmit}
            >
              Prüfen
            </Button>
            {selected.length > 0 && !submitted && (
              <Button variant="ghost" onClick={() => setSelected([])}>
                Zurücksetzen
              </Button>
            )}
          </div>
        )}

        {submitted && (
          <div className={`${styles.resultBox} animate-in`}>
            <div className={isCorrect ? styles.resultCorrect : styles.resultWrong}>
              <div className={isCorrect ? styles.resultLabelOk : styles.resultLabelFail}>
                {isCorrect ? '\u2713 Richtig!' : '\u2717 Falsche Reihenfolge'}
              </div>

              {!isCorrect && (
                <div className={styles.correctOrder}>
                  <span className={styles.correctOrderLabel}>Richtige Reihenfolge:</span>
                  <div className={styles.tileRow}>
                    {richtigeReihenfolge.map((wort, i) => (
                      <span key={i} className={styles.tileCorrectSmall}>{wort}</span>
                    ))}
                  </div>
                </div>
              )}

              <p className={styles.erklaerung}>{erklaerung}</p>
            </div>

            <div className={styles.weiterWrap}>
              <Badge>{isCorrect ? `+${punkte} Punkte` : '0 Punkte'}</Badge>
              <Button variant="gold" onClick={() => onComplete(isCorrect ? punkte : 0, isCorrect)}>
                Weiter →
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
