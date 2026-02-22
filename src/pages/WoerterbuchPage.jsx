import { useState } from 'react';
import { WOERTERBUCH } from '../data/woerterbuch.js';
import { Card } from '../components/Card.jsx';
import { Badge } from '../components/Badge.jsx';
import { OrnamentIcon, OrnamentDivider } from '../components/Ornament.jsx';
import styles from './WoerterbuchPage.module.css';

export function WoerterbuchPage() {
  const [filter, setFilter] = useState('Alle');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState(null);
  const cats = ['Alle', ...new Set(WOERTERBUCH.map(w => w.kategorie))];

  const filtered = WOERTERBUCH.filter(w => {
    if (filter !== 'Alle' && w.kategorie !== filter) return false;
    if (search && !w.wort.toLowerCase().includes(search.toLowerCase()) && !w.definition.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const dayIdx = new Date().getDate() % WOERTERBUCH.length;
  const wdt = WOERTERBUCH[dayIdx];

  return (
    <div className={styles.wrapper}>
      <div className={`${styles.header} animate-in`}>
        <h1 className={styles.title}>
          <OrnamentIcon name="buch" size="md" style={{ marginRight: 8, verticalAlign: 'text-bottom' }} />
          Wörterbücherei
        </h1>
        <p className={styles.subtitle}>Dein Werkzeugkasten der Eloquenz</p>
      </div>

      <Card glow ornate style={{ marginBottom: 24 }}>
        <div className={styles.wdtLabel}>Wort des Tages</div>
        <div className={styles.wdtWord}>{wdt.wort}</div>
        <div className={styles.wdtDef}>{wdt.definition}</div>
        <div className={styles.wdtExample}>{'\u201E'}{wdt.beispiel}{'\u201C'}</div>
      </Card>

      <div className={styles.searchRow}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Wort suchen..."
          className={styles.searchInput}
        />
        <div className={styles.catRow}>
          {cats.map(c => (
            <span
              key={c}
              onClick={() => setFilter(c)}
              className={filter === c ? styles.catChipActive : styles.catChip}
            >{c}</span>
          ))}
        </div>
      </div>

      <div className={styles.list}>
        {filtered.map((w, i) => (
          <Card key={w.wort} onClick={() => setExpanded(expanded === i ? null : i)}
            style={{ padding: 16, cursor: 'pointer', animation: `textReveal 0.3s ease-out ${Math.min(i * 0.03, 0.5)}s both` }}>
            <div className={styles.wordRow}>
              <div className={styles.wordInfo}>
                <div className={styles.wordHeader}>
                  <span className={styles.wordName}>{w.wort}</span>
                  <Badge>{w.wortart}</Badge>
                  <span className={styles.schwierigkeit}>{'\u2022'.repeat(w.schwierigkeit)}</span>
                </div>
                <div className={styles.wordDef}>{w.definition}</div>
              </div>
              <Badge>{w.kategorie}</Badge>
            </div>
            {expanded === i && (
              <div className={styles.expandedSection}>
                <div className={styles.example}>{'\u201E'}{w.beispiel}{'\u201C'}</div>
                <div className={styles.synonymRow}>
                  <span className={styles.synonymLabel}>Synonyme:</span>
                  {w.synonyme.map(s => <Badge key={s}>{s}</Badge>)}
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>
      <div className={styles.count}>{filtered.length} von {WOERTERBUCH.length} Wörtern</div>
    </div>
  );
}
