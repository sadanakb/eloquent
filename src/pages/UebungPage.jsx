import { useState, useEffect, useRef } from 'react';
import { SITUATIONEN, SITUATION_KATEGORIEN, SITUATIONEN_NACH_KATEGORIE } from '../data/situationen.js';
import { kiBewertung } from '../engine/scoring-engine.js';
import { Card } from '../components/Card.jsx';
import { Button } from '../components/Button.jsx';
import { BewertungDisplay } from '../components/BewertungDisplay.jsx';
import { AntwortEingabe } from '../components/AntwortEingabe.jsx';
import { OrnamentIcon } from '../components/Ornament.jsx';
import styles from './UebungPage.module.css';

export function UebungPage() {
  const [phase, setPhase] = useState('choose');
  const [kategorie, setKategorie] = useState(null);
  const [situation, setSituation] = useState(null);
  const [schwierigkeit, setSchwierigkeit] = useState('mittel');
  const [ergebnis, setErgebnis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const loadingStartRef = useRef(null);

  useEffect(() => {
    if (!loading) {
      loadingStartRef.current = null;
      setElapsed(0);
      document.title = 'ELOQUENT';
      return;
    }
    loadingStartRef.current = Date.now();
    const iv = setInterval(() => {
      const sec = Math.floor((Date.now() - loadingStartRef.current) / 1000);
      setElapsed(sec);
      document.title = `${sec}s \u2014 Bewertung...`;
    }, 1000);
    return () => clearInterval(iv);
  }, [loading]);

  const chooseDiff = (kat) => {
    setKategorie(kat);
    setPhase('difficulty');
  };

  const start = (diff) => {
    const actualDiff = diff || ['leicht', 'mittel', 'schwer'][Math.floor(Math.random() * 3)];
    let pool;
    if (kategorie && SITUATIONEN_NACH_KATEGORIE?.[kategorie]) {
      pool = diff ? (SITUATIONEN_NACH_KATEGORIE[kategorie][diff] || []) : [
        ...(SITUATIONEN_NACH_KATEGORIE[kategorie].leicht || []),
        ...(SITUATIONEN_NACH_KATEGORIE[kategorie].mittel || []),
        ...(SITUATIONEN_NACH_KATEGORIE[kategorie].schwer || []),
      ];
    } else {
      pool = diff ? SITUATIONEN[diff] : [...SITUATIONEN.leicht, ...SITUATIONEN.mittel, ...SITUATIONEN.schwer];
    }
    if (pool.length === 0) pool = SITUATIONEN[actualDiff] || SITUATIONEN.mittel;
    setSituation(pool[Math.floor(Math.random() * pool.length)]);
    setSchwierigkeit(actualDiff);
    setErgebnis(null);
    setPhase('write');
  };

  const submit = async (text) => {
    if (text === null) {
      setErgebnis({
        kategorien: {
          situationsbezug: { p: 0, f: 'Keine Antwort abgegeben.' },
          wortvielfalt: { p: 0, f: '' }, rhetorik: { p: 0, f: '' },
          wortschatz: { p: 0, f: '' }, argumentation: { p: 0, f: '' },
          kreativitaet: { p: 0, f: '' }, textstruktur: { p: 0, f: '' },
        },
        mittel: [], gehobene: [], tipps: ['Nächstes Mal unbedingt eine Antwort abgeben!'],
        empfehlungen: [], feedback: 'Keine Antwort eingereicht \u2014 0 Punkte.', gaming: false, _methode: 'skip',
      });
      setPhase('result');
      return;
    }
    setLoading(true);
    setPhase('result');
    const r = await kiBewertung(situation, text);
    setErgebnis(r);
    setLoading(false);
  };

  const diffOptions = [
    { label: 'Leicht', diff: 'leicht', desc: 'Lockere Alltagsthemen' },
    { label: 'Mittel', diff: 'mittel', desc: 'Anspruchsvollere Aufgaben' },
    { label: 'Schwer', diff: 'schwer', desc: 'Reden & Plädoyers' },
    { label: 'Zufall', diff: null, desc: 'Überrasch mich' },
  ];

  return (
    <div className={styles.wrapper}>
      {phase === 'choose' && (
        <div className="animate-in" style={{ textAlign: 'center' }}>
          <h1 className={styles.title}>
            <OrnamentIcon name="ziel" size="md" style={{ marginRight: 8, verticalAlign: 'text-bottom' }} />
            Übungsmodus
          </h1>
          <p className={styles.subtitle}>Wähle eine Kategorie. Trainiere ohne Druck.</p>
          <div className={styles.katGrid}>
            {(SITUATION_KATEGORIEN || []).map(kat => (
              <Card key={kat.id} onClick={() => chooseDiff(kat.id)} className={styles.katCard}>
                <div className={styles.katIcon}>
                  <OrnamentIcon name="feder" size="md" />
                </div>
                <div className={styles.katLabel}>{kat.label}</div>
              </Card>
            ))}
          </div>
          <Button variant="ghost" onClick={() => chooseDiff(null)}>Zufällige Kategorie</Button>
        </div>
      )}

      {phase === 'difficulty' && (
        <div className="animate-in" style={{ textAlign: 'center' }}>
          <h2 className={styles.title} style={{ fontSize: 28 }}>Schwierigkeit wählen</h2>
          {kategorie && SITUATION_KATEGORIEN && (
            <p className={styles.subtitle}>{SITUATION_KATEGORIEN.find(k => k.id === kategorie)?.label}</p>
          )}
          <div className={styles.diffGrid}>
            {diffOptions.map(o => (
              <Card key={o.label} onClick={() => start(o.diff)} style={{ cursor: 'pointer', textAlign: 'left' }}>
                <div className={styles.diffRow}>
                  <div>
                    <div className={styles.diffLabel}>{o.label}</div>
                    <div className={styles.diffDesc}>{o.desc}</div>
                  </div>
                  <span className={styles.diffArrow}>\u2192</span>
                </div>
              </Card>
            ))}
          </div>
          <div style={{ marginTop: 16 }}>
            <Button variant="ghost" onClick={() => setPhase('choose')}>\u2190 Zurück</Button>
          </div>
        </div>
      )}

      {phase === 'write' && situation && (
        <AntwortEingabe situation={situation} onSubmit={submit} schwierigkeit={schwierigkeit} />
      )}

      {phase === 'result' && (
        loading ? (
          <div className={styles.loadingWrap}>
            <div className={styles.loadingIcon}>
              <OrnamentIcon name="tintenfass" size="xl" />
            </div>
            <h2 className={styles.loadingTitle}>
              {elapsed >= 15 ? 'KI braucht etwas länger...' : 'KI analysiert deine Antwort...'}
            </h2>
            <p className={styles.loadingText}>
              {elapsed > 0 && <span className={styles.elapsed}>{elapsed}s </span>}
              {elapsed >= 15 ? 'Qualität braucht Zeit \u2014 bitte noch kurz Geduld' : 'Bitte warten'}
              <span className={styles.dots}>{'.'.repeat((elapsed % 3) + 1)}</span>
            </p>
          </div>
        ) : (
          <BewertungDisplay ergebnis={ergebnis} onWeiter={() => { setKategorie(null); setPhase('choose'); }} />
        )
      )}
    </div>
  );
}
