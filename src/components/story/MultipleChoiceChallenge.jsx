import { useState } from 'react';
import eventBus from '../../engine/event-bus.js';
import { Card } from '../Card.jsx';
import { Badge } from '../Badge.jsx';
import { Button } from '../Button.jsx';
import styles from './MultipleChoiceChallenge.module.css';

export function MultipleChoiceChallenge({ challenge, onComplete }) {
  const [selected, setSelected] = useState(null);

  const { frage, optionen, richtig, erklaerung, punkte } = challenge;
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

  return (
    <div className={`${styles.wrapper} animate-in`}>
      <Card>
        <p className={styles.frage}>{frage}</p>

        <div className={styles.optionen}>
          {optionen.map((opt, i) => {
            const isThis = selected === i;
            const istRichtig = i === richtig;

            let optClass = styles.option;
            if (isAnswered) {
              if (istRichtig) optClass = styles.optionCorrect;
              else if (isThis && !istRichtig) optClass = styles.optionWrong;
              else optClass = `${styles.option} ${styles.optionFaded}`;
            }

            return (
              <div
                key={i}
                onClick={() => handleSelect(i)}
                className={optClass}
                style={isThis ? { fontWeight: 600 } : undefined}
              >
                <div className={styles.optionLetter}>{String.fromCharCode(65 + i)}</div>
                <span>{opt}</span>
              </div>
            );
          })}
        </div>

        {isAnswered && (
          <div className={`${styles.resultBox} animate-in`}>
            <div className={isCorrect ? styles.resultCorrect : styles.resultWrong}>
              <div className={isCorrect ? styles.resultLabelOk : styles.resultLabelFail}>
                {isCorrect ? '\u2713 Richtig!' : '\u2717 Leider falsch'}
              </div>
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
