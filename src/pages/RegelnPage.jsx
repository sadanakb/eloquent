import { useState } from 'react';
import { OrnamentDivider } from '../components/Ornament.jsx';
import styles from './RegelnPage.module.css';

const TABS = [
  { id: 'spielablauf', label: 'Spielablauf' },
  { id: 'wertung', label: 'Wertung' },
  { id: 'besonderheiten', label: 'Besonderheiten' },
  { id: 'rangsystem', label: 'Rangsystem' },
  { id: 'tipps', label: 'Tipps' },
];

function SpielablaufTab() {
  return (
    <div className={styles.tabContent}>
      <blockquote className={styles.blockquote}>
        „Ein Duell nicht der Klingen, sondern der Worte — wer am eloquentesten spricht, trägt den Sieg davon."
      </blockquote>
      <ol className={styles.numberedList}>
        <li>Zwei Spieler treten gegeneinander in <strong>3 Runden</strong> an.</li>
        <li>Jede Runde präsentiert eine neue <strong>Situation</strong> mit steigender Schwierigkeit.</li>
        <li>Beide Spieler verfassen eine Antwort auf die Situation — ohne die Antwort des Gegners zu sehen.</li>
        <li>Nach Ablauf der Zeit werden beide Antworten der KI zur Bewertung vorgelegt.</li>
        <li>Die KI analysiert nach <strong>7 Kriterien</strong> und ermittelt den Sieger jeder Runde.</li>
        <li>Der Spieler mit den meisten Rundensiegen gewinnt das Duell und erhält Pokale.</li>
      </ol>
      <p className={styles.para}>
        Das Duell kann sowohl gegen einen menschlichen Gegner (Online-Modus) als auch gegen die KI (Solo-Modus) ausgetragen werden. In jedem Fall bewertet dieselbe KI-Instanz die Eloquenz beider Parteien nach objektiven Kriterien.
      </p>
    </div>
  );
}

function WertungTab() {
  const scores = [
    { value: '25', label: 'Rhetorik' },
    { value: '15', label: 'Situationsbezug' },
    { value: '15', label: 'Wortvielfalt' },
    { value: '15', label: 'Wortschatz' },
    { value: '15', label: 'Argumentation' },
    { value: '10', label: 'Kreativität' },
    { value: '5', label: 'Textstruktur' },
  ];

  return (
    <div className={styles.tabContent}>
      <blockquote className={styles.blockquote}>
        „Die Qualität eines Gedankens offenbart sich nicht allein in seinem Inhalt, sondern in der Kunst seiner Darbietung."
      </blockquote>
      <div className={styles.scoreGrid}>
        {scores.map(s => (
          <div key={s.label} className={styles.scoreCell}>
            <span className={styles.scoreValue}>{s.value}</span>
            <span className={styles.scoreLabel}>{s.label}</span>
          </div>
        ))}
      </div>
      <p className={styles.para}>
        Die Gesamtpunktzahl beläuft sich auf <strong>100 Punkte</strong> pro Runde. Der Spieler mit der höheren Gesamtpunktzahl gewinnt die Runde. Bei Gleichstand entscheidet die Rhetorik-Wertung.
      </p>
    </div>
  );
}

function BesonderheitenTab() {
  return (
    <div className={styles.tabContent}>
      <blockquote className={styles.blockquote}>
        „Es sind die Feinheiten, die den Meister vom Schüler unterscheiden."
      </blockquote>
      <ol className={styles.numberedList}>
        <li><strong>Zeitlimit:</strong> Jede Runde hat ein festgelegtes Zeitlimit. Wer zu spät antwortet, erhält einen Abzug.</li>
        <li><strong>Themenwechsel:</strong> Die Situation ändert sich jede Runde — Flexibilität ist gefragt.</li>
        <li><strong>Steigende Schwierigkeit:</strong> Runde 1 ist moderat, Runde 3 verlangt höchste rhetorische Kunst.</li>
        <li><strong>KI-Transparenz:</strong> Nach dem Duell siehst du die vollständige Begründung der KI für jede Wertung.</li>
        <li><strong>Rematch:</strong> Nach jedem Duell kannst du sofort eine Revanche fordern.</li>
      </ol>
      <p className={styles.para}>
        Im Online-Modus werden beide Spieler erst dann bewertet, wenn beide ihre Antwort eingereicht haben. Kein Spieler sieht die Antwort des anderen vor der Bewertung.
      </p>
    </div>
  );
}

function RangsystemTab() {
  const ranks = [
    { title: 'Lehrling', desc: '0–99 Pokale' },
    { title: 'Geselle', desc: '100–299 Pokale' },
    { title: 'Meister', desc: '300–599 Pokale' },
    { title: 'Großmeister', desc: '600–999 Pokale' },
    { title: 'Eloquenter', desc: '1000+ Pokale' },
  ];

  return (
    <div className={styles.tabContent}>
      <blockquote className={styles.blockquote}>
        „Der Weg zur Eloquenz ist lang — doch jedes gewonnene Duell bringt dich einen Schritt näher."
      </blockquote>
      <div className={styles.rankList}>
        {ranks.map((rank, i) => (
          <div key={rank.title} className={styles.rankItem}>
            <span className={styles.rankNumber}>{i + 1}</span>
            <div className={styles.rankInfo}>
              <span className={styles.rankTitle}>{rank.title}</span>
              <span className={styles.rankDesc}>{rank.desc}</span>
            </div>
          </div>
        ))}
      </div>
      <p className={styles.para}>
        Pokale werden für gewonnene Duelle vergeben. Je höher die Schwierigkeit und je knapper der Sieg, desto mehr Pokale erhältst du. Verlierst du ein Duell, verlierst du keine Pokale — Eloquenz wird belohnt, nicht bestraft.
      </p>
    </div>
  );
}

function TippsTab() {
  return (
    <div className={styles.tabContent}>
      <blockquote className={styles.blockquote}>
        „Ein guter Redner bereitet sich vor — ein großer Redner lässt es natürlich erscheinen."
      </blockquote>
      <ol className={styles.numberedList}>
        <li><strong>Metaphern &amp; Vergleiche:</strong> „wie ein Leuchtturm in stürmischer Nacht" — Bilder sprechen mehr als Fakten.</li>
        <li><strong>Rhetorische Fragen:</strong> „Ist es nicht so, dass...?" — binden den Leser in den Gedanken ein.</li>
        <li><strong>Trikolon:</strong> „Freiheit, Gleichheit, Brüderlichkeit" — Dreiergruppen klingen vollständig und überzeugend.</li>
        <li><strong>Antithesen:</strong> „Nicht nur..., sondern auch..." — zeigen Tiefe und Differenziertheit.</li>
        <li><strong>Gehobener Wortschatz:</strong> „nichtsdestotrotz", „eloquent", „sublim", „prädestiniert" — Variiere zwischen einfach und gehoben.</li>
        <li><strong>Satzrhythmus:</strong> Variiere deine Satzlänge! Kurze Sätze schaffen Nachdruck. Längere, verschachtelte Konstruktionen hingegen vermitteln Komplexität und intellektuelle Tiefe.</li>
        <li><strong>Situationsbezug:</strong> Beziehe dich immer konkret auf die vorgegebene Situation — allgemeine Antworten werden niedriger bewertet.</li>
      </ol>
    </div>
  );
}

const TAB_COMPONENTS = {
  spielablauf: SpielablaufTab,
  wertung: WertungTab,
  besonderheiten: BesonderheitenTab,
  rangsystem: RangsystemTab,
  tipps: TippsTab,
};

export function RegelnPage() {
  const [activeTab, setActiveTab] = useState('spielablauf');
  const ActiveComponent = TAB_COMPONENTS[activeTab];

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <OrnamentDivider />
          <h1 className={styles.title}>REGELN</h1>
          <p className={styles.subtitle}>Die Kunst des Wortduells</p>
          <OrnamentDivider />
        </header>

        <nav className={styles.tabBar} aria-label="Regelabschnitte">
          {TABS.map(tab => (
            <button
              key={tab.id}
              className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
              onClick={() => setActiveTab(tab.id)}
              aria-selected={activeTab === tab.id}
              role="tab"
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <main>
          <ActiveComponent />
        </main>
      </div>
    </div>
  );
}
