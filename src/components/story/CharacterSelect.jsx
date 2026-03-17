import { useState } from 'react';
import eventBus from '../../engine/event-bus.js';
import { Card } from '../Card.jsx';
import { Button } from '../Button.jsx';
import { OrnamentIcon } from '../Ornament.jsx';
import styles from './CharacterSelect.module.css';

export function CharacterSelect({ archetypes, onSelect }) {
  const [selected, setSelected] = useState(null);
  const [confirmed, setConfirmed] = useState(false);

  const handleSelect = (archetype) => {
    if (confirmed) return;
    setSelected(archetype.id);
    eventBus.emit('sound:play', { sound: 'click' });
  };

  const handleConfirm = () => {
    const archetype = archetypes.find((a) => a.id === selected);
    if (!archetype) return;
    setConfirmed(true);
    eventBus.emit('sound:play', { sound: 'success' });
    // Small delay for visual feedback before calling onSelect
    setTimeout(() => onSelect(archetype), 400);
  };

  return (
    <div className={`${styles.wrapper} animate-in`}>
      <h1 className={styles.title}>Wähle deinen Archetyp</h1>
      <p className={styles.subtitle}>
        Dein Archetyp bestimmt deine Stärken auf dem Weg durch die Akademie.
      </p>

      <div className={styles.cardsRow}>
        {archetypes.map((arch) => {
          const isSelected = selected === arch.id;
          const isFaded = selected !== null && !isSelected;

          let cardClass = styles.archCard;
          if (isSelected) cardClass = styles.archCardSelected;
          else if (isFaded) cardClass = styles.archCardFaded;

          return (
            <div
              key={arch.id}
              className={cardClass}
              onClick={() => handleSelect(arch)}
            >
              <Card
                ornate={isSelected}
                glow={isSelected}
                className={styles.innerCard}
              >
                <div className={styles.portraitWrap}>
                  <div
                    className={styles.portrait}
                    style={{ borderColor: arch.color }}
                  >
                    <OrnamentIcon
                      name={arch.icon}
                      size="lg"
                      style={{ color: arch.color }}
                    />
                  </div>
                </div>

                <h3 className={styles.archName} style={{ color: arch.color }}>
                  {arch.name}
                </h3>

                <p className={styles.archDesc}>{arch.description}</p>

                <div
                  className={styles.bonusBadge}
                  style={{ borderColor: arch.color, color: arch.color }}
                >
                  {arch.bonus}
                </div>

                {arch.bonusDetail && (
                  <p className={styles.bonusDetail}>{arch.bonusDetail}</p>
                )}
              </Card>
            </div>
          );
        })}
      </div>

      {selected && !confirmed && (
        <div className={`${styles.confirmWrap} animate-in`}>
          <Button variant="gold" onClick={handleConfirm}>
            Abenteuer beginnen →
          </Button>
        </div>
      )}

      {confirmed && (
        <div className={`${styles.confirmedText} animate-in`}>
          Dein Schicksal ist besiegelt...
        </div>
      )}
    </div>
  );
}
