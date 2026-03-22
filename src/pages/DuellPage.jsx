import { useState, useRef, useEffect } from 'react';
import eventBus from '../engine/event-bus.js';
import { Confetti } from '../components/Confetti.jsx';
import { SITUATIONEN, SITUATION_KATEGORIEN, SITUATIONEN_NACH_KATEGORIE } from '../data/situationen.js';
import { kiBewertung } from '../engine/scoring-engine.js';
import { Button } from '../components/Button.jsx';
import { Card } from '../components/Card.jsx';
import { Badge } from '../components/Badge.jsx';
import { Input } from '../components/Input.jsx';
import { BewertungDisplay } from '../components/BewertungDisplay.jsx';
import { AntwortEingabe } from '../components/AntwortEingabe.jsx';
import { OrnamentIcon, OrnamentDivider } from '../components/Ornament.jsx';
import { BoltIcon } from '../components/icons/Icons.jsx';
import { checkAchievements } from '../engine/achievements.js';
import styles from './DuellPage.module.css';

export function DuellPage({ onNavigate }) {
  const [phase, setPhase] = useState('setup');
  const [s1, setS1] = useState('');
  const [s2, setS2] = useState('');
  const [kategorie, setKategorie] = useState(null);
  const [runde, setRunde] = useState(1);
  const [situation, setSituation] = useState(null);
  const [ergebnis1, setErgebnis1] = useState(null);
  const [ergebnis2, setErgebnis2] = useState(null);
  const [loading, setLoading] = useState(false);
  const [scores, setScores] = useState({ s1: 0, s2: 0, r1: 0, r2: 0 });
  const [history, setHistory] = useState([]);
  const [elapsed, setElapsed] = useState(0);
  const loadingStartRef = useRef(null);
  const s1PromiseRef = useRef(null);
  const gespielteRef = useRef(new Set());

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
      document.title = `${sec}s — Bewertung...`;
    }, 1000);
    return () => clearInterval(iv);
  }, [loading]);

  const getSituation = (r) => {
    const diff = r <= 1 ? 'leicht' : r <= 2 ? 'mittel' : 'schwer';
    let pool;
    if (kategorie && SITUATIONEN_NACH_KATEGORIE?.[kategorie]?.[diff]) {
      pool = SITUATIONEN_NACH_KATEGORIE[kategorie][diff];
    } else {
      pool = SITUATIONEN[diff];
    }
    const ungespielte = pool.filter(s => !gespielteRef.current.has(s.titel));
    const chosen = ungespielte.length > 0
      ? ungespielte[Math.floor(Math.random() * ungespielte.length)]
      : pool[Math.floor(Math.random() * pool.length)];
    gespielteRef.current.add(chosen.titel);
    return chosen;
  };

  const goToCategory = () => {
    if (!s1.trim() || !s2.trim()) return;
    if (s1.trim().toLowerCase() === s2.trim().toLowerCase()) return;
    setPhase('category');
  };

  const startDuell = (kat) => {
    setKategorie(kat);
    gespielteRef.current = new Set();
    setRunde(1);
    setScores({ s1: 0, s2: 0, r1: 0, r2: 0 });
    setHistory([]);
    const diff = 'leicht';
    let pool;
    if (kat && SITUATIONEN_NACH_KATEGORIE?.[kat]?.[diff]) {
      pool = SITUATIONEN_NACH_KATEGORIE[kat][diff];
    } else {
      pool = SITUATIONEN[diff];
    }
    const chosen = pool[Math.floor(Math.random() * pool.length)];
    gespielteRef.current.add(chosen.titel);
    setSituation(chosen);
    setPhase('s1_write');
  };

  const SKIP_ERGEBNIS = {
    kategorien: {
      situationsbezug: { p: 0, f: 'Keine Antwort abgegeben.' },
      wortvielfalt: { p: 0, f: '' }, rhetorik: { p: 0, f: '' },
      wortschatz: { p: 0, f: '' }, argumentation: { p: 0, f: '' },
      kreativitaet: { p: 0, f: '' }, textstruktur: { p: 0, f: '' },
    },
    mittel: [], gehobene: [], tipps: ['Nächstes Mal unbedingt eine Antwort abgeben!'],
    empfehlungen: [], feedback: 'Keine Antwort eingereicht — 0 Punkte.', gaming: false, _methode: 'skip',
  };

  const handleS1Submit = (text) => {
    if (text === null || !text.trim()) {
      setErgebnis1({ text: null, skipped: true });
      s1PromiseRef.current = null;
    } else {
      setErgebnis1({ text });
      const promise = kiBewertung(situation, text);
      // Prevent unhandled rejection if S1 scoring fails before S2 submits
      promise.catch(() => {});
      s1PromiseRef.current = promise;
    }
    setPhase('s1_pass');
    window.scrollTo(0, 0);
  };

  const handleS2Submit = async (text) => {
    setLoading(true);
    setPhase('result');
    const s1Skipped = ergebnis1?.skipped;
    const s2Skipped = text === null || !text?.trim();
    const s1Promise = s1Skipped ? Promise.resolve(SKIP_ERGEBNIS)
      : (s1PromiseRef.current || kiBewertung(situation, ergebnis1.text));
    let r1, r2;
    try {
      [r1, r2] = await Promise.all([
        s1Promise.catch(e => { console.error('[Duell] S1 Scoring Fehler:', e.message); return SKIP_ERGEBNIS; }),
        s2Skipped ? Promise.resolve(SKIP_ERGEBNIS) : kiBewertung(situation, text).catch(e => { console.error('[Duell] S2 Scoring Fehler:', e.message); return SKIP_ERGEBNIS; }),
      ]);
    } catch (e) {
      console.error('[Duell] Bewertung fehlgeschlagen:', e.message);
      r1 = SKIP_ERGEBNIS;
      r2 = SKIP_ERGEBNIS;
    }
    const p1 = r1 ? Object.values(r1.kategorien || {}).reduce((s, v) => s + (v.p || 0), 0) : 0;
    const p2 = r2 ? Object.values(r2.kategorien || {}).reduce((s, v) => s + (v.p || 0), 0) : 0;
    setErgebnis1(r1);
    setErgebnis2(r2);
    setHistory(prev => [...prev, { runde, p1, p2, situation: situation.titel }]);
    setScores(prev => ({
      s1: prev.s1 + p1, s2: prev.s2 + p2,
      r1: prev.r1 + (p1 > p2 ? 1 : 0), r2: prev.r2 + (p2 > p1 ? 1 : 0),
    }));
    setLoading(false);
    // Check achievements for both players
    const score1 = p1;
    const score2 = p2;
    const bestScore = Math.max(score1, score2);
    checkAchievements('duell_complete', {
      score: bestScore,
      gehobene: [...(r1.gehobene || []), ...(r2.gehobene || [])],
      mittel: [...(r1.mittel || []), ...(r2.mittel || [])],
      kategorie: kategorie,
    });
  };

  const nextRound = () => {
    if (runde >= 3) { setPhase('final'); return; }
    const nr = runde + 1;
    setRunde(nr);
    setSituation(getSituation(nr));
    setErgebnis1(null);
    setErgebnis2(null);
    s1PromiseRef.current = null;
    setPhase('s1_write');
  };

  const diffLabel = runde <= 1 ? 'Leicht' : runde <= 2 ? 'Mittel' : 'Schwer';

  return (
    <div className={styles.wrapper}>
      {phase === 'setup' && (
        <div className={`${styles.setupContainer} animate-in`}>
          <OrnamentDivider />
          <div className={styles.setupHeader}>
            <h1 className={styles.title}>DUELL</h1>
            <p className={styles.subtitle}>Zwei Spieler. Eine Sprache. Ein Sieger.</p>
          </div>
          <OrnamentDivider />
          <div className={styles.playerGrid}>
            <Input
              label="Spieler 1"
              placeholder="Name eingeben..."
              value={s1}
              onChange={e => setS1(e.target.value)}
            />
            <div className={styles.vsCircle}>
              <BoltIcon size={24} color="var(--gold-500)" />
            </div>
            <Input
              label="Spieler 2"
              placeholder="Name eingeben..."
              value={s2}
              onChange={e => setS2(e.target.value)}
            />
          </div>
          <Button
            variant="primary"
            size="lg"
            onClick={goToCategory}
            disabled={!s1.trim() || !s2.trim()}
            className={styles.startButton}
          >
            Duell starten →
          </Button>
        </div>
      )}

      {phase === 'category' && (
        <div className="animate-in">
          <div className={styles.katHeader}>
            <h2 className={styles.title} style={{ fontSize: 28 }}>Kategorie wählen</h2>
            <p className={styles.subtitle}>{s1} vs {s2} — In welchem Feld messt ihr euch?</p>
          </div>
          <div className={styles.katGrid}>
            {(SITUATION_KATEGORIEN || []).map(kat => (
              <Card key={kat.id} onClick={() => startDuell(kat.id)} className={styles.katCard}>
                <div className={styles.katEmoji}><OrnamentIcon name="feder" size="lg" /></div>
                <div className={styles.katLabel}>{kat.label}</div>
              </Card>
            ))}
          </div>
          <div style={{ textAlign: 'center' }}>
            <Button variant="gold" onClick={() => startDuell(null)}>Zufällige Kategorie</Button>
          </div>
        </div>
      )}

      {phase === 's1_write' && situation && (
        <div>
          <div className={styles.roundBar}>
            <Badge>Runde {runde}/3</Badge>
            <Badge>{diffLabel}</Badge>
          </div>
          {scores.s1 + scores.s2 > 0 && (
            <div className={styles.scoreBar}>
              <span className={styles.scoreS1}>{s1}: {scores.s1.toFixed(1)}</span>
              <span className={styles.scoreVs}>vs</span>
              <span className={styles.scoreS2}>{s2}: {scores.s2.toFixed(1)}</span>
            </div>
          )}
          <AntwortEingabe situation={situation} spielerName={s1} onSubmit={handleS1Submit} schwierigkeit={runde <= 1 ? 'leicht' : runde <= 2 ? 'mittel' : 'schwer'} />
        </div>
      )}

      {phase === 's1_pass' && (
        <div className={`${styles.passScreen} animate-in`}>
          <div className={styles.passIcon}>⇄</div>
          <h2 className={styles.passTitle}>Gerät weitergeben</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 32 }}>
            Bitte an <strong className={styles.passPlayer}>{s2}</strong> übergeben.
          </p>
          <Button variant="accent" onClick={() => { setPhase('s2_write'); window.scrollTo(0, 0); }}>
            {s2} ist bereit →
          </Button>
        </div>
      )}

      {phase === 's2_write' && situation && (
        <div>
          <div className={styles.roundBar}>
            <Badge>Runde {runde}/3</Badge>
            <Badge>{diffLabel}</Badge>
          </div>
          <AntwortEingabe situation={situation} spielerName={s2} onSubmit={handleS2Submit} schwierigkeit={runde <= 1 ? 'leicht' : runde <= 2 ? 'mittel' : 'schwer'} />
        </div>
      )}

      {phase === 'result' && (
        loading ? (
          <div className={styles.loadingWrap}>
            <div className={styles.loadingIcon}>
              <OrnamentIcon name="tintenfass" size="xl" />
            </div>
            <h2 className={styles.loadingTitle}>
              {elapsed >= 15 ? 'KI braucht etwas länger...' : 'KI bewertet eure Eloquenz...'}
            </h2>
            <p className={styles.loadingText}>
              {elapsed > 0 && <span className={styles.elapsed}>{elapsed}s </span>}
              {elapsed >= 15 ? 'Qualität braucht Zeit — bitte noch kurz Geduld' : 'Die Antworten werden analysiert'}
              <span className={styles.dots}>{'.'.repeat((elapsed % 3) + 1)}</span>
            </p>
          </div>
        ) : (
          <div>
            <h2 className={styles.resultTitle}>Runde {runde} — Ergebnis</h2>
            <div className={styles.resultGrid}>
              <BewertungDisplay ergebnis={ergebnis1} spielerName={s1} />
              <div className={styles.vsSep}>——— VS ———</div>
              <BewertungDisplay ergebnis={ergebnis2} spielerName={s2} />
            </div>
            <div style={{ textAlign: 'center', marginTop: 28 }}>
              <Button variant="gold" onClick={nextRound}>
                {runde >= 3 ? (
                  <><OrnamentIcon name="lorbeer" size="sm" /> Endergebnis</>
                ) : `Runde ${runde + 1} →`}
              </Button>
            </div>
          </div>
        )
      )}

      {phase === 'final' && (
        <div className="animate-in" style={{ textAlign: 'center' }}>
          <Confetti active={true} />
          <h1 className={styles.finalTitle}>
            <OrnamentIcon name="lorbeer" size="lg" style={{ verticalAlign: 'text-bottom', marginRight: 8 }} />
            Endergebnis
          </h1>
          <Card glow ornate style={{ maxWidth: 500, margin: '0 auto 24px' }}>
            <div className={styles.finalGrid}>
              <div>
                <div className={scores.s1 > scores.s2 ? styles.finalNameWin : styles.finalNameLose}>{s1}</div>
                <div className={styles.finalScoreS1}>{scores.s1.toFixed(1)}</div>
                <div className={styles.finalRounds}>{scores.r1} Runden</div>
              </div>
              <div className={styles.finalVs}>⚔</div>
              <div>
                <div className={scores.s2 > scores.s1 ? styles.finalNameWin : styles.finalNameLose}>{s2}</div>
                <div className={styles.finalScoreS2}>{scores.s2.toFixed(1)}</div>
                <div className={styles.finalRounds}>{scores.r2} Runden</div>
              </div>
            </div>
            <div className={styles.winnerBox}>
              {scores.s1 > scores.s2 ? (
                <div className={styles.winnerS1}>{s1} gewinnt!</div>
              ) : scores.s2 > scores.s1 ? (
                <div className={styles.winnerS2}>{s2} gewinnt!</div>
              ) : (
                <div className={styles.winnerDraw}>Unentschieden!</div>
              )}
            </div>
          </Card>
          <div className={styles.finalActions}>
            <Button variant="gold" onClick={() => setPhase('setup')}>Neues Duell</Button>
            <Button variant="ghost" onClick={() => onNavigate('home')}>Zum Menü</Button>
          </div>
        </div>
      )}
    </div>
  );
}
