import { Card } from '../components/Card.jsx';
import { OrnamentIcon, OrnamentDivider } from '../components/Ornament.jsx';
import styles from './RegelnPage.module.css';

export function RegelnPage() {
  const sections = [
    {
      icon: 'federn',
      title: 'Duell-Modus',
      items: [
        'Zwei Spieler treten in 3 Runden an',
        'Jede Runde eine Situation mit steigender Schwierigkeit',
        'Die KI bewertet beide Antworten nach 7 Kriterien',
        'Der eloquentere Spieler gewinnt Pokale',
      ],
    },
    {
      icon: 'ziel',
      title: 'Bewertungskriterien',
      items: [
        'Situationsbezug (15 Pkt) — Passt die Antwort?',
        'Wortvielfalt (15 Pkt) — Abwechslung statt Wiederholungen',
        'Rhetorik (25 Pkt) — Metaphern, Fragen, Antithesen...',
        'Wortschatz (15 Pkt) — Gehobene Ausdrücke',
        'Argumentation (15 Pkt) — Logischer Aufbau',
        'Kreativität (10 Pkt) — Originelle Gedanken',
        'Textstruktur (5 Pkt) — Kohärenz & Bindewörter',
      ],
    },
    {
      icon: 'feder',
      title: 'Tipps',
      items: [
        'Vergleiche: „wie ein Leuchtturm in stürmischer Nacht"',
        'Rhetorische Fragen: „Ist es nicht so, dass...?"',
        'Trikolon: „Freiheit, Gleichheit, Brüderlichkeit"',
        'Antithesen: „Nicht nur..., sondern auch..."',
        'Gehobene Wörter: „nichtsdestotrotz", „eloquent", „sublim"',
        'Variiere deine Satzlänge!',
      ],
    },
  ];

  return (
    <div className={styles.wrapper}>
      <div className={`${styles.header} animate-in`}>
        <h1 className={styles.title}>Spielregeln</h1>
      </div>
      {sections.map(section => (
        <Card key={section.title} style={{ marginBottom: 16 }}>
          <h2 className={styles.sectionTitle}>
            <OrnamentIcon name={section.icon} size="sm" style={{ marginRight: 8, verticalAlign: 'text-bottom' }} />
            {section.title}
          </h2>
          {section.items.map((item, i) => (
            <div key={i} className={styles.ruleItem}>{item}</div>
          ))}
        </Card>
      ))}
    </div>
  );
}
