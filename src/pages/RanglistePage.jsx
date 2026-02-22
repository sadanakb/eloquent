import { getRang } from '../data/raenge.js';
import { Card } from '../components/Card.jsx';
import { OrnamentIcon } from '../components/Ornament.jsx';
import styles from './RanglistePage.module.css';

export function RanglistePage() {
  const demo = [
    { name: 'Aurelius', pokale: 2340, siege: 42, gespielt: 55 },
    { name: 'Cicero', pokale: 1850, siege: 35, gespielt: 48 },
    { name: 'Valeria', pokale: 1200, siege: 28, gespielt: 40 },
    { name: 'Ernat', pokale: 13, siege: 1, gespielt: 1 },
    { name: 'Sadan', pokale: 5, siege: 0, gespielt: 1 },
  ];
  const rankLabels = ['I', 'II', 'III'];

  return (
    <div className={styles.wrapper}>
      <div className={`${styles.header} animate-in`}>
        <h1 className={styles.title}>
          <OrnamentIcon name="lorbeer" size="md" style={{ marginRight: 8, verticalAlign: 'text-bottom' }} />
          Rangliste
        </h1>
        <p className={styles.subtitle}>Die eloquentesten Redner</p>
      </div>
      <div className={styles.list}>
        {demo.map((sp, i) => {
          const rang = getRang(sp.pokale);
          const quote = sp.gespielt > 0 ? Math.round(sp.siege / sp.gespielt * 100) : 0;
          return (
            <Card key={sp.name} style={{ animation: `textReveal 0.4s ease-out ${i * 0.08}s both`, padding: 16 }}>
              <div className={styles.row}>
                <div className={i < 3 ? styles.rankGold : styles.rank}>{rankLabels[i] || `${i + 1}.`}</div>
                <div className={styles.info}>
                  <div className={styles.nameRow}>
                    <span className={i === 0 ? styles.nameTop : styles.name}>{sp.name}</span>
                    <span className={styles.rangLabel}>{rang.name}</span>
                  </div>
                  <div className={styles.stats}>
                    <span className={styles.stat}>{sp.siege}W / {sp.gespielt - sp.siege}L</span>
                    <span className={styles.stat}>{quote}% Quote</span>
                  </div>
                </div>
                <div className={styles.scoreCol}>
                  <div className={styles.scoreNum}>{sp.pokale}</div>
                  <div className={styles.scoreLabel}>Pokale</div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
