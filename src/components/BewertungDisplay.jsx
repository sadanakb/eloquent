import { useEffect } from 'react';
import eventBus from '../engine/event-bus.js';
import { getNote } from '../data/raenge.js';
import { GoldBar } from './GoldBar.jsx';
import { GoldParticles } from './GoldParticles.jsx';
import { Card } from './Card.jsx';
import { Badge } from './Badge.jsx';
import { Button } from './Button.jsx';
import { OrnamentIcon, OrnamentDivider } from './Ornament.jsx';
import { useCountUp } from '../hooks/useCountUp.js';
import styles from './BewertungDisplay.module.css';

export function BewertungDisplay({ ergebnis, spielerName, onWeiter }) {
  if (!ergebnis) return null;
  const kat = ergebnis.kategorien || {};
  const maxMap = { situationsbezug: 15, wortvielfalt: 15, rhetorik: 25, wortschatz: 15, argumentation: 15, kreativitaet: 10, textstruktur: 5 };
  const labelMap = { situationsbezug: 'Situationsbezug', wortvielfalt: 'Wortvielfalt', rhetorik: 'Rhetorik', wortschatz: 'Wortschatz', argumentation: 'Argumentation', kreativitaet: 'Kreativität', textstruktur: 'Textstruktur' };
  const gesamt = Object.entries(kat).reduce((s, [k, v]) => s + Math.min(v.p || 0, maxMap[k] || 0), 0);
  const animatedScore = useCountUp(gesamt, 1200);
  const { note, emoji } = getNote(gesamt);

  useEffect(() => {
    eventBus.emit('sound:play', { sound: 'success' });
    if (gesamt >= 70) {
      setTimeout(() => eventBus.emit('sound:play', { sound: 'goldGain' }), 500);
    }
  }, []);

  return (
    <div className={`${styles.wrapper} animate-in`}>
      <Card glow ornate>
        <div className={styles.header}>
          {spielerName && <div className={styles.playerLabel}>Bewertung für</div>}
          {spielerName && <div className={styles.playerName}>{spielerName}</div>}
          <div className={`${styles.score} animate-stamp`}>
            {animatedScore.toFixed(1)}
          </div>
          <GoldParticles active={gesamt >= 75} />
          <div className={styles.scoreLabel}>von 100 Punkten</div>
          <Badge>{note}</Badge>

          <div>
            {ergebnis._methode === 'ki' ? (
              <span className={styles.methodKi}>
                KI-Bewertung {ergebnis._provider ? `(${ergebnis._provider}` : ''}{ergebnis._model ? ` / ${ergebnis._model})` : ergebnis._provider ? ')' : ''}{ergebnis._duration ? ` \u00B7 ${ergebnis._duration}s` : ''}
              </span>
            ) : (
              <span className={styles.methodHeuristik}>
                Heuristik-Bewertung{ergebnis._duration ? ` \u00B7 ${ergebnis._duration}s` : ''}
              </span>
            )}
          </div>

          {ergebnis._kiError && (
            <div className={styles.errorBanner}>
              KI-Fehler: {ergebnis._kiError.slice(0, 120)}
              {ergebnis._kiError.length > 120 ? '...' : ''}
            </div>
          )}
        </div>

        <OrnamentDivider />

        <div className={styles.categories}>
          {Object.entries(kat).map(([key, val], i) => (
            <div key={key} className={styles.catRow}>
              <div className={styles.catHeader}>
                <span className={styles.catLabel}>{labelMap[key] || key}</span>
                <span className={styles.catScore}>{(val.p || 0).toFixed(1)}/{maxMap[key]}</span>
              </div>
              <GoldBar value={val.p || 0} max={maxMap[key]} delay={i * 0.1} />
              {val.f && <div className={styles.catFeedback}>{val.f}</div>}
            </div>
          ))}
        </div>

        {ergebnis.mittel?.length > 0 && (
          <div className={styles.section}>
            <div className={styles.sectionTitleRhetorik}>
              <OrnamentIcon name="feder" size="sm" style={{ marginRight: 6, verticalAlign: 'text-bottom' }} />
              Erkannte rhetorische Mittel
            </div>
            {ergebnis.mittel.map((m, i) => (
              <div key={i} className={styles.mittelCard}>
                <span className={styles.mittelName}>{m.name}</span>
                <div className={styles.mittelZitat}>{'\u201E'}{m.beispiel || m.zitat || ''}{'\u201C'}</div>
              </div>
            ))}
          </div>
        )}

        {ergebnis.gehobene?.length > 0 && (
          <div className={styles.section}>
            <div className={styles.sectionTitleWortschatz}>
              <OrnamentIcon name="buchOffen" size="sm" style={{ marginRight: 6, verticalAlign: 'text-bottom' }} />
              Gehobene Wörter verwendet
            </div>
            <div className={styles.gehobeneWrap}>
              {ergebnis.gehobene.map((w, i) => <Badge key={i}>{typeof w === 'string' ? w : w?.wort || ''}</Badge>)}
            </div>
          </div>
        )}

        {ergebnis.feedback && (
          <div className={styles.feedbackBox}>
            <div className={styles.feedbackText}>{ergebnis.feedback}</div>
          </div>
        )}

        {ergebnis.tipps?.length > 0 && (
          <div className={styles.section}>
            <div className={styles.sectionTitleTipps}>
              <OrnamentIcon name="ziel" size="sm" style={{ marginRight: 6, verticalAlign: 'text-bottom' }} />
              Verbesserungsvorschläge
            </div>
            {ergebnis.tipps.map((t, i) => (
              <div key={i} className={styles.tipp}>{t}</div>
            ))}
          </div>
        )}

        {ergebnis.empfehlungen?.length > 0 && (
          <div className={styles.section}>
            <div className={styles.sectionTitleEmpfehlungen}>
              <OrnamentIcon name="buch" size="sm" style={{ marginRight: 6, verticalAlign: 'text-bottom' }} />
              Probier diese Wörter nächstes Mal
            </div>
            {ergebnis.empfehlungen.map((e, i) => (
              <div key={i} className={styles.empfCard}>
                <span className={styles.empfWort}>{e.wort}</span>
                <span className={styles.empfBedeutung}>{e.bedeutung}</span>
              </div>
            ))}
          </div>
        )}

        {onWeiter && (
          <div className={styles.weiterBtn}>
            <Button variant="gold" onClick={onWeiter}>Weiter \u2192</Button>
          </div>
        )}
      </Card>
    </div>
  );
}
