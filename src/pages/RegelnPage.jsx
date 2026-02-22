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
        'Situationsbezug (15 Pkt) \u2014 Passt die Antwort?',
        'Wortvielfalt (15 Pkt) \u2014 Abwechslung statt Wiederholungen',
        'Rhetorik (25 Pkt) \u2014 Metaphern, Fragen, Antithesen...',
        'Wortschatz (15 Pkt) \u2014 Gehobene Ausdrücke',
        'Argumentation (15 Pkt) \u2014 Logischer Aufbau',
        'Kreativität (10 Pkt) \u2014 Originelle Gedanken',
        'Textstruktur (5 Pkt) \u2014 Kohärenz & Bindewörter',
      ],
    },
    {
      icon: 'feder',
      title: 'Tipps',
      items: [
        "Vergleiche: \u201Ewie ein Leuchtturm in stürmischer Nacht\u201C",
        "Rhetorische Fragen: \u201EIst es nicht so, dass...?\u201C",
        "Trikolon: \u201EFreiheit, Gleichheit, Brüderlichkeit\u201C",
        "Antithesen: \u201ENicht nur..., sondern auch...\u201C",
        "Gehobene Wörter: \u201Enichtsdestotrotz\u201C, \u201Eeloquent\u201C, \u201Esublim\u201C",
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
