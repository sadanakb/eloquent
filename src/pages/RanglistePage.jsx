import { useState, useEffect } from 'react';
import { getRang } from '../data/raenge.js';
import { supabase, isOnline } from '../lib/supabase.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { getRankTitle } from '../engine/elo.js';
import { Card } from '../components/Card.jsx';
import { Badge } from '../components/Badge.jsx';
import { Button } from '../components/Button.jsx';
import { OrnamentIcon } from '../components/Ornament.jsx';
import styles from './RanglistePage.module.css';

const demo = [
  { name: 'Aurelius', pokale: 2340, siege: 42, gespielt: 55 },
  { name: 'Cicero', pokale: 1850, siege: 35, gespielt: 48 },
  { name: 'Valeria', pokale: 1200, siege: 28, gespielt: 40 },
  { name: 'Ernat', pokale: 13, siege: 1, gespielt: 1 },
  { name: 'Sadan', pokale: 5, siege: 0, gespielt: 1 },
];

const rankLabels = ['I', 'II', 'III'];

export function RanglistePage() {
  const [tab, setTab] = useState('lokal');
  const [globalData, setGlobalData] = useState([]);
  const [loadingGlobal, setLoadingGlobal] = useState(false);

  const auth = useAuth();

  const userId = auth?.user?.id;

  useEffect(() => {
    if (tab !== 'global') return;
    if (!isOnline() || !supabase) return;

    setLoadingGlobal(true);
    supabase
      .from('weekly_leaderboard')
      .select('*')
      .order('elo_rating', { ascending: false })
      .limit(100)
      .then(({ data, error }) => {
        if (error) {
          console.error('Leaderboard fetch failed:', error.message);
          setGlobalData([]);
        } else {
          setGlobalData(data || []);
        }
        setLoadingGlobal(false);
      });
  }, [tab]);

  return (
    <div className={styles.wrapper}>
      <div className={`${styles.header} animate-in`}>
        <h1 className={styles.title}>
          <OrnamentIcon name="lorbeer" size="md" style={{ marginRight: 8, verticalAlign: 'text-bottom' }} />
          Rangliste
        </h1>
        <p className={styles.subtitle}>Die eloquentesten Redner</p>
      </div>

      {/* Tab Switcher */}
      <div className={styles.tabBar}>
        <button
          onClick={() => setTab('lokal')}
          className={tab === 'lokal' ? styles.tabActive : styles.tab}
        >
          Lokal
        </button>
        <button
          onClick={() => setTab('global')}
          className={tab === 'global' ? styles.tabActive : styles.tab}
        >
          Global
        </button>
      </div>

      {/* Lokal Tab */}
      {tab === 'lokal' && (
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
      )}

      {/* Global Tab */}
      {tab === 'global' && (
        <div className={styles.list}>
          {!isOnline() && (
            <div className={styles.globalMsg}>
              <OrnamentIcon name="tintenfass" size="lg" />
              <p>Online-Rangliste nicht verfuegbar. Keine Serververbindung.</p>
            </div>
          )}

          {isOnline() && !auth?.isAuthenticated && (
            <div className={styles.globalMsg}>
              <OrnamentIcon name="federn" size="lg" />
              <p>Melde dich an, um die globale Rangliste zu sehen.</p>
            </div>
          )}

          {isOnline() && auth?.isAuthenticated && loadingGlobal && (
            <div className={styles.globalMsg}>
              <p>Lade Rangliste...</p>
            </div>
          )}

          {isOnline() && auth?.isAuthenticated && !loadingGlobal && globalData.length === 0 && (
            <div className={styles.globalMsg}>
              <p>Noch keine Eintraege vorhanden.</p>
            </div>
          )}

          {isOnline() && auth?.isAuthenticated && !loadingGlobal && globalData.map((entry, i) => {
            const isMe = entry.user_id === userId;
            const wins = entry.wins || 0;
            const losses = entry.losses || 0;
            const elo = entry.elo_rating || 1200;
            const rankTitle = getRankTitle(elo);

            return (
              <Card
                key={entry.user_id || i}
                glow={isMe}
                style={{
                  animation: `textReveal 0.4s ease-out ${i * 0.05}s both`,
                  padding: 16,
                  ...(isMe ? { border: '1px solid var(--accent-gold)' } : {}),
                }}
              >
                <div className={styles.row}>
                  <div className={i < 3 ? styles.rankGold : styles.rank}>
                    {rankLabels[i] || `${i + 1}.`}
                  </div>
                  <div className={styles.info}>
                    <div className={styles.nameRow}>
                      <span className={i === 0 ? styles.nameTop : isMe ? styles.nameMe : styles.name}>
                        {entry.username || 'Anonym'}
                      </span>
                      <span className={styles.rangLabel}>{rankTitle}</span>
                      {isMe && <Badge>Du</Badge>}
                    </div>
                    <div className={styles.stats}>
                      <span className={styles.stat}>{wins}W / {losses}L</span>
                    </div>
                  </div>
                  <div className={styles.scoreCol}>
                    <div className={styles.scoreNum}>{elo}</div>
                    <div className={styles.scoreLabel}>Elo</div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
