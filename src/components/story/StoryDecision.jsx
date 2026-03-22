import eventBus from '../../engine/event-bus.js';
import { useTypewriter } from '../../hooks/useTypewriter.js';
import { Card } from '../Card.jsx';
import { Button } from '../Button.jsx';
import styles from './StoryDecision.module.css';

export function StoryDecision({ decision, onChoose }) {
  const { text, choices } = decision;
  const { displayText, isComplete } = useTypewriter(text, 35);

  const handleChoose = (choice) => {
    eventBus.emit('sound:play', { sound: 'click' });
    onChoose(choice);
  };

  return (
    <div className={`${styles.wrapper} animate-in`}>
      <div className={styles.textWrap}>
        <p className={styles.narrativeText}>
          {displayText}
          {!isComplete && <span className={styles.cursor}>|</span>}
        </p>
      </div>

      {isComplete && (
        <div className={`${styles.choicesWrap} animate-in`}>
          {choices.map((choice, i) => (
            <Card
              key={i}
              onClick={() => handleChoose(choice)}
              className={styles.choiceCard}
            >
              <div className={styles.choiceLetter}>{String.fromCharCode(65 + i)}</div>
              <div className={styles.choiceContent}>
                <div className={styles.choiceLabel}>{choice.label}</div>
                {choice.hint && (
                  <div className={styles.choiceHint}>{choice.hint}</div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
