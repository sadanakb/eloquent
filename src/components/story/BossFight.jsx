import { useState, useEffect } from 'react';
import eventBus from '../../engine/event-bus.js';
import { Card } from '../Card.jsx';
import { GoldBar } from '../GoldBar.jsx';
import { Badge } from '../Badge.jsx';
import { Button } from '../Button.jsx';
import { OrnamentIcon } from '../Ornament.jsx';
import { AntwortEingabe } from '../AntwortEingabe.jsx';
import { BewertungDisplay } from '../BewertungDisplay.jsx';
import { kiBewertung } from '../../engine/scoring-engine.js';
import { logger } from '../../engine/logger.js';
import styles from './BossFight.module.css';

export function BossFight({ boss, onComplete, archetypeBonus }) {
  const [phase, setPhase] = useState('intro');
  const [bossHP, setBossHP] = useState(boss.hp);
  const [playerScore, setPlayerScore] = useState(0);
  const [ergebnis, setErgebnis] = useState(null);
  const [animatingHP, setAnimatingHP] = useState(false);

  const {
    name, title, portrait, hp, threshold, weakness, weaknessBonus,
    situation, dialog_intro, dialog_win, dialog_lose,
  } = boss;

  const handleFight = () => {
    setPhase('fight');
    eventBus.emit('sound:play', { sound: 'click' });
  };

  const handleSubmit = async (text) => {
    if (!text) {
      setPlayerScore(0);
      setErgebnis(null);
      setPhase('result');
      return;
    }

    setPhase('scoring');

    try {
      const result = await kiBewertung(situation, text);
      setErgebnis(result);

      const kat = result.kategorien || {};
      let totalScore = Object.values(kat).reduce((sum, v) => sum + (v.p || 0), 0);

      // Check for weakness bonus
      if (weakness && result.mittel?.length > 0) {
        const hasWeakness = result.mittel.some(
          (m) => m.name.toLowerCase().includes(weakness.toLowerCase())
        );
        if (hasWeakness && weaknessBonus) {
          totalScore += weaknessBonus;
        }
      }

      // Apply archetype bonus
      if (archetypeBonus) {
        const bonus = archetypeBonus(result);
        if (bonus) {
          totalScore += bonus;
        }
      }

      totalScore = Math.min(totalScore, 100);
      setPlayerScore(totalScore);
      setPhase('result');
    } catch (e) {
      logger.error('[BossFight] Bewertung fehlgeschlagen:', e);
      setPlayerScore(0);
      setErgebnis(null);
      setPhase('result');
    }
  };

  // Animate boss HP going down in result phase
  useEffect(() => {
    if (phase !== 'result') return;

    const damage = playerScore;
    if (damage <= 0) return;

    setAnimatingHP(true);
    const newHP = Math.max(hp - damage, 0);
    const timer = setTimeout(() => {
      setBossHP(newHP);
      setAnimatingHP(false);
    }, 600);

    return () => clearTimeout(timer);
  }, [phase, playerScore, hp]);

  const won = playerScore >= threshold;

  const handleRetry = () => {
    setPhase('fight');
    setPlayerScore(0);
    setErgebnis(null);
    setBossHP(boss.hp);
  };

  return (
    <div className={styles.wrapper}>
      {/* ── INTRO ── */}
      {phase === 'intro' && (
        <div className={`${styles.introWrap} animate-in`}>
          <div className={styles.bossPortrait}>
            <OrnamentIcon name={portrait || 'stern'} size="xl" style={{ color: 'var(--accent-gold)' }} />
          </div>
          <h2 className={styles.bossName}>{name}</h2>
          <p className={styles.bossTitle}>{title}</p>

          <div className={styles.hpSection}>
            <div className={styles.hpLabel}>
              <span>Boss HP</span>
              <span className={styles.hpValue}>{bossHP}/{hp}</span>
            </div>
            <GoldBar value={bossHP} max={hp} />
          </div>

          <Card className={styles.dialogCard}>
            <div className={styles.dialogText}>{dialog_intro}</div>
          </Card>

          <Button variant="gold" onClick={handleFight}>
            Herausfordern →
          </Button>
        </div>
      )}

      {/* ── FIGHT ── */}
      {phase === 'fight' && (
        <div className="animate-in">
          <div className={styles.fightHeader}>
            <div className={styles.fightBossInfo}>
              <OrnamentIcon name={portrait || 'stern'} size="sm" />
              <span className={styles.fightBossName}>{name}</span>
            </div>
            <GoldBar value={bossHP} max={hp} />
          </div>

          <AntwortEingabe
            situation={situation}
            schwierigkeit="schwer"
            onSubmit={handleSubmit}
          />
        </div>
      )}

      {/* ── SCORING ── */}
      {phase === 'scoring' && (
        <div className={`${styles.scoringWrap} animate-in`}>
          <div className={styles.bossPortraitSmall}>
            <OrnamentIcon name={portrait || 'stern'} size="lg" style={{ color: 'var(--accent-gold)' }} />
          </div>
          <div className={styles.spinner} />
          <p className={styles.scoringText}>Der Boss prüft eure Worte...</p>
        </div>
      )}

      {/* ── RESULT ── */}
      {phase === 'result' && (
        <div className={`${styles.resultWrap} animate-in`}>
          <div className={styles.bossPortraitSmall}>
            <OrnamentIcon name={portrait || 'stern'} size="lg" style={{ color: won ? 'var(--success)' : 'var(--error)' }} />
          </div>
          <h3 className={styles.bossName}>{name}</h3>

          <div className={styles.hpSection}>
            <div className={styles.hpLabel}>
              <span>Boss HP</span>
              <span className={styles.hpValue}>{bossHP}/{hp}</span>
            </div>
            <GoldBar value={bossHP} max={hp} />
          </div>

          <div className={styles.damageInfo}>
            <Badge style={{ fontSize: 14 }}>
              {playerScore > 0 ? `${playerScore} Schaden zugef\u00FCgt` : 'Kein Schaden'}
            </Badge>
          </div>

          {ergebnis && <BewertungDisplay ergebnis={ergebnis} />}

          <Card className={won ? styles.resultCardWin : styles.resultCardLose}>
            <div className={won ? styles.resultLabelWin : styles.resultLabelLose}>
              {won ? '\u2713 Sieg!' : '\u2717 Niederlage'}
            </div>
            <div className={styles.dialogText}>
              {won ? dialog_win : dialog_lose}
            </div>
          </Card>

          <div className={styles.resultActions}>
            {won ? (
              <Button variant="gold" onClick={() => onComplete(true, playerScore)}>
                Weiter →
              </Button>
            ) : (
              <>
                <Button variant="gold" onClick={handleRetry}>
                  Erneut versuchen
                </Button>
                <Button variant="ghost" onClick={() => onComplete(false, playerScore)}>
                  Aufgeben
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
