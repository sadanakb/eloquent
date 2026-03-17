import { useState } from 'react';
import eventBus from '../../engine/event-bus.js';
import { Card } from '../Card.jsx';
import { Badge } from '../Badge.jsx';
import { Button } from '../Button.jsx';
import styles from './FillBlankChallenge.module.css';

export function FillBlankChallenge({ challenge, onComplete }) {
  const [selected, setSelected] = useState(null);

  const { satz, optionen, richtig, erklaerung, punkte } = challenge;
  const isAnswered = selected !== null;
  const isCorrect = selected === richtig;

  const handleSelect = (idx) => {
    if (isAnswered) return;
    setSelected(idx);
    if (idx === richtig) {
      eventBus.emit('sound:play', { sound: 'success' });
    } else {
      eventBus.emit('sound:play', { sound: 'error' });
    }
  };

  // Split the sentence around "___"
  const parts = satz.split('___');
  const filledWord = isAnswered ? optionen[selected] : null;

  return (
    <div className={`${styles.wrapper} animate-in`}>
      <Card>
        {/* Sentence with blank */}
        <div className={styles.satzWrap}>
          {parts.map((part, i) => (
            <span key={i}>
              {part}
              {i < parts.length - 1 && (
                <span
                  className={
                    !isAnswered
                      ? styles.blank
                      : isCorrect
                        ? styles.blankCorrect
                        : styles.blankWrong
                  }
                >
                  {filledWord || '\u2003\u2003\u2003'}
                </span>
              )}
            </span>
          ))}
        </div>

        {/* Options */}
        <div className={styles.optionen}>
          {optionen.map((opt, i) => {
            const isThis = selected === i;
            const istRichtig = i === richtig;

            let optClass = styles.optionBtn;
            if (isAnswered) {
              if (istRichtig) optClass = styles.optionCorrect;
              else if (isThis && !istRichtig) optClass = styles.optionWrong;
              else optClass = styles.optionFaded;
            }

            return (
              <button
                key={i}
                onClick={() => handleSelect(i)}
                className={optClass}
                disabled={isAnswered}
              >
                {opt}
              </button>
            );
          })}
        </div>

        {/* Result */}
        {isAnswered && (
          <div className={`${styles.resultBox} animate-in`}>
            <div className={isCorrect ? styles.resultCorrect : styles.resultWrong}>
              <div className={isCorrect ? styles.resultLabelOk : styles.resultLabelFail}>
                {isCorrect ? '\u2713 Richtig!' : '\u2717 Leider falsch'}
              </div>
              {!isCorrect && (
                <div className={styles.correctAnswer}>
                  Richtige Antwort: <strong>{optionen[richtig]}</strong>
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
