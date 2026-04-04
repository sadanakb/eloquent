import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { SITUATIONEN, SITUATION_KATEGORIEN, SITUATIONEN_NACH_KATEGORIE } from '../data/situationen.js';
import { kiBewertung } from '../engine/scoring-engine.js';
import { Card } from '../components/Card.jsx';
import { Button } from '../components/Button.jsx';
import { Badge } from '../components/Badge.jsx';
import { BewertungDisplay } from '../components/BewertungDisplay.jsx';
import { AntwortEingabe } from '../components/AntwortEingabe.jsx';
import { OrnamentIcon } from '../components/Ornament.jsx';
import { checkAchievements } from '../engine/achievements.js';
import { completeDailyChallenge } from '../engine/daily.js';
import styles from './UebungPage.module.css';

// Day abbreviations in German
const DAY_LABELS = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

function getStreakDays() {
  // Build last 7 days array with completion status from localStorage if available
  const days = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const label = DAY_LABELS[d.getDay()];
    const completed = localStorage.getItem(`streak_${key}`) === '1';
    days.push({ label, key, completed, isToday: i === 0 });
  }
  return days;
}

const SKILL_BARS = [
  { label: 'Vokabular', key: 'vokabular' },
  { label: 'Grammatik', key: 'grammatik' },
  { label: 'Stilistik', key: 'stilistik' },
  { label: 'Kreativität', key: 'kreativitaet' },
];

function getSkillValues() {
  try {
    const raw = localStorage.getItem('skill_levels');
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  return { vokabular: 42, grammatik: 65, stilistik: 38, kreativitaet: 55 };
}

function SkillSidebarContent({ skills }) {
  return (
    <>
      <h3 className={styles.skillHeading}>Deine Stärken</h3>
      <div className={styles.skillBars}>
        {SKILL_BARS.map(s => (
          <div key={s.key} className={styles.skillItem}>
            <span className={styles.skillLabel}>{s.label}</span>
            <div className={styles.skillTrack}>
              <div
                className={styles.skillFill}
                style={{ width: `${skills[s.key] || 0}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      <p className={styles.focusHint}>
        <em>Fokus: Stilistik ausbauen für mehr Ausdruckskraft.</em>
      </p>
    </>
  );
}

export function UebungPage({ onNavigate }) {
  const location = useLocation();
  const dailyMode = location.state?.dailyMode || false;
  const dailySituation = location.state?.dailySituation || null;

  const [phase, setPhase] = useState('choose');
  const [kategorie, setKategorie] = useState(null);
  const [situation, setSituation] = useState(null);
  const [schwierigkeit, setSchwierigkeit] = useState('mittel');
  const [ergebnis, setErgebnis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const loadingStartRef = useRef(null);

  const streakDays = getStreakDays();
  const skills = getSkillValues();

  // If navigated with daily challenge state, skip selection and go straight to writing
  useEffect(() => {
    if (dailyMode && dailySituation) {
      setSituation(dailySituation);
      setSchwierigkeit('mittel');
      setPhase('write');
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
    if (text === null || !text.trim()) {
      setErgebnis({
        kategorien: {
          situationsbezug: { p: 0, f: 'Keine Antwort abgegeben.' },
          wortvielfalt: { p: 0, f: '' }, rhetorik: { p: 0, f: '' },
          wortschatz: { p: 0, f: '' }, argumentation: { p: 0, f: '' },
          kreativitaet: { p: 0, f: '' }, textstruktur: { p: 0, f: '' },
        },
        mittel: [], gehobene: [], tipps: ['Nächstes Mal unbedingt eine Antwort abgeben!'],
        empfehlungen: [], feedback: 'Keine Antwort eingereicht — 0 Punkte.', gaming: false, _methode: 'skip',
      });
      setPhase('result');
      return;
    }
    setLoading(true);
    setPhase('result');
    const r = await kiBewertung(situation, text);
    setErgebnis(r);
    setLoading(false);
    // Check achievements
    const score = Object.values(r.kategorien || {}).reduce((s, v) => s + (v.p || 0), 0);
    checkAchievements('uebung_complete', {
      score,
      gehobene: r.gehobene || [],
      mittel: r.mittel || [],
      kategorie: kategorie,
    });
    // Record daily challenge completion if in daily mode
    if (dailyMode) {
      completeDailyChallenge(score);
    }
    // Mark today as completed in streak
    const todayKey = new Date().toISOString().slice(0, 10);
    localStorage.setItem(`streak_${todayKey}`, '1');
  };

  const diffOptions = [
    { label: 'Leicht', diff: 'leicht', desc: 'Lockere Alltagsthemen' },
    { label: 'Mittel', diff: 'mittel', desc: 'Anspruchsvollere Aufgaben' },
    { label: 'Schwer', diff: 'schwer', desc: 'Reden & Plädoyers' },
    { label: 'Zufall', diff: null, desc: 'Überrasch mich' },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.container}>

        {/* Streak Strip */}
        <div className={styles.streakStrip}>
          {streakDays.map(day => (
            <div
              key={day.key}
              className={day.completed ? styles.streakPillActive : styles.streakPillInactive}
              title={day.key}
            >
              {day.label}
            </div>
          ))}
        </div>

        {/* Phase: choose */}
        {phase === 'choose' && (
          <div className={`${styles.centeredPhase} animate-in`}>
            <h1 className={styles.pageTitle}>
              <OrnamentIcon name="ziel" size="md" style={{ marginRight: 8, verticalAlign: 'text-bottom' }} />
              Übungsmodus
            </h1>
            <p className={styles.pageSubtitle}>Wähle eine Kategorie. Trainiere ohne Druck.</p>
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

            <div className={styles.localDuellSection}>
              <button className={styles.localDuellBtn} onClick={() => onNavigate('lokal')}>
                <span className={styles.localDuellIcon}>&#x2694;</span>
                <span>
                  <strong>Lokales Duell</strong>
                  <small>Spiel zu zweit auf einem Gerät</small>
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Phase: difficulty */}
        {phase === 'difficulty' && (
          <div className={`${styles.centeredPhase} animate-in`}>
            <h2 className={styles.pageTitle} style={{ fontSize: 28 }}>Schwierigkeit wählen</h2>
            {kategorie && SITUATION_KATEGORIEN && (
              <p className={styles.pageSubtitle}>{SITUATION_KATEGORIEN.find(k => k.id === kategorie)?.label}</p>
            )}
            <div className={styles.diffGrid}>
              {diffOptions.map(o => (
                <Card key={o.label} onClick={() => start(o.diff)} style={{ cursor: 'pointer', textAlign: 'left' }}>
                  <div className={styles.diffRow}>
                    <div>
                      <div className={styles.diffLabel}>{o.label}</div>
                      <div className={styles.diffDesc}>{o.desc}</div>
                    </div>
                    <span className={styles.diffArrow}>→</span>
                  </div>
                </Card>
              ))}
            </div>
            <div style={{ marginTop: 16 }}>
              <Button variant="ghost" onClick={() => setPhase('choose')}>← Zurück</Button>
            </div>
          </div>
        )}

        {/* Phase: write — 2-column layout */}
        {phase === 'write' && situation && (
          <div className={styles.writeLayout}>
            {/* Main Task Column */}
            <div className={styles.taskColumn}>
              <AntwortEingabe situation={situation} onSubmit={submit} schwierigkeit={schwierigkeit} />
            </div>

            {/* Desktop Skill Sidebar */}
            <aside className={styles.skillSidebarDesktop}>
              <SkillSidebarContent skills={skills} />
            </aside>

            {/* Mobile Skill Sidebar */}
            <details className={styles.skillSidebarMobile}>
              <summary className={styles.skillSummary}>Deine Stärken ▾</summary>
              <div className={styles.skillMobileContent}>
                <SkillSidebarContent skills={skills} />
              </div>
            </details>
          </div>
        )}

        {/* Phase: result */}
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
                {elapsed >= 15 ? 'Qualität braucht Zeit — bitte noch kurz Geduld' : 'Bitte warten'}
                <span className={styles.dots}>{'.'.repeat((elapsed % 3) + 1)}</span>
              </p>
            </div>
          ) : (
            <BewertungDisplay ergebnis={ergebnis} onWeiter={() => { setKategorie(null); setPhase('choose'); }} />
          )
        )}

      </div>
    </div>
  );
}
