import { useState, useEffect } from 'react';
import { getRang } from '../data/raenge.js';
import { supabase, isOnline } from '../lib/supabase.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { getRankTitle } from '../engine/elo.js';
import { Badge } from '../components/Badge.jsx';
import { Ornament } from '../components/Ornament.jsx';
import { CrownIcon, ShieldIcon } from '../components/icons/Icons.jsx';
import styles from './RanglistePage.module.css';

const demo = [
  { name: 'Aurelius', pokale: 2340, siege: 42, gespielt: 55 },
  { name: 'Cicero', pokale: 1850, siege: 35, gespielt: 48 },
  { name: 'Valeria', pokale: 1200, siege: 28, gespielt: 40 },
  { name: 'Ernat', pokale: 13, siege: 1, gespielt: 1 },
  { name: 'Sadan', pokale: 5, siege: 0, gespielt: 1 },
];

function AvatarCircle({ avatarUrl, username, size = 48, isFirst = false }) {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={username}
        className={`${styles.avatar} ${isFirst ? styles.avatarFirst : ''}`}
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className={`${styles.avatarPlaceholder} ${isFirst ? styles.avatarFirst : ''}`}
      style={{ width: size, height: size }}
    >
      <ShieldIcon size={size * 0.5} color="var(--gold-500)" />
    </div>
  );
}

function PodiumColumn({ entry, rank, isDemo = false }) {
  const isFirst = rank === 1;
  const isSecond = rank === 2;
  const username = isDemo ? entry.name : (entry.username || 'Anonym');
  const elo = isDemo ? entry.pokale : (entry.elo_rating || 1200);
  const avatarUrl = isDemo ? null : entry.avatar_url;

  const pedestalHeightClass = isFirst
    ? styles.pedestalFirst
    : isSecond
    ? styles.pedestalSecond
    : styles.pedestalThird;

  const avatarSize = isFirst ? 56 : 44;

  return (
    <div className={`${styles.podiumCol} ${isFirst ? styles.podiumColFirst : ''}`}>
      {isFirst && (
        <div className={styles.crownWrapper}>
          <CrownIcon size={24} color="var(--gold-500)" />
        </div>
      )}
      <AvatarCircle
        avatarUrl={avatarUrl}
        username={username}
        size={avatarSize}
        isFirst={isFirst}
      />
      <div className={styles.podiumUsername}>{username}</div>
      <div className={styles.podiumElo}>{elo}</div>
      <div className={`${styles.pedestal} ${pedestalHeightClass}`}>
        <span className={styles.pedestalRank}>{rank}</span>
      </div>
    </div>
  );
}

export function RanglistePage() {
  const [tab, setTab] = useState('global');
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

  // Determine the current data set to render
  const isLokal = tab === 'lokal';
  const isFriends = tab === 'freunde';
  const isGlobal = tab === 'global';

  // For lokal tab use demo data, for global use fetched data
  const activeData = isLokal ? demo.map(d => ({
    user_id: d.name,
    username: d.name,
    elo_rating: d.pokale,
    wins: d.siege,
    losses: d.gespielt - d.siege,
    avatar_url: null,
  })) : globalData;

  const top3 = activeData.slice(0, 3);
  const rest = activeData.slice(3);

  // podium order: [2nd, 1st, 3rd]
  const podiumOrder = [
    top3[1] ? { entry: top3[1], rank: 2 } : null,
    top3[0] ? { entry: top3[0], rank: 1 } : null,
    top3[2] ? { entry: top3[2], rank: 3 } : null,
  ].filter(Boolean);

  // Find own rank
  const ownIndex = isGlobal
    ? globalData.findIndex(e => e.user_id === userId)
    : -1;
  const ownEntry = ownIndex >= 0 ? globalData[ownIndex] : null;
  const ownRank = ownIndex + 1;

  // Milestone CTA
  let milestoneCta = null;
  if (ownEntry) {
    const milestones = [1, 3, 10, 25, 50, 100];
    const nextMilestone = milestones.find(m => m > ownRank);
    if (nextMilestone && nextMilestone - ownRank <= 5) {
      milestoneCta = `Noch ${nextMilestone - ownRank} Plätze bis Rang ${nextMilestone} →`;
    }
  }

  const showPodium = (isLokal || (isGlobal && auth?.isAuthenticated && !loadingGlobal)) && activeData.length >= 1;

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* Page Header */}
        <div className={styles.header}>
          <h1 className={styles.title}>RANGLISTE</h1>
          <Ornament type="divider" className={styles.ornament} />
        </div>

        {/* Filter Tabs */}
        <div className={styles.tabBar}>
          <button
            className={tab === 'global' ? styles.tabActive : styles.tab}
            onClick={() => setTab('global')}
          >
            Global
          </button>
          <button
            className={tab === 'freunde' ? styles.tabActive : styles.tab}
            onClick={() => setTab('freunde')}
          >
            Freunde
          </button>
          <button
            className={tab === 'lokal' ? styles.tabActive : styles.tab}
            onClick={() => setTab('lokal')}
          >
            Diese Woche
          </button>
        </div>

        {/* Messages */}
        {isGlobal && !isOnline() && (
          <div className={styles.message}>
            <p>Online-Rangliste nicht verfügbar. Keine Serververbindung.</p>
          </div>
        )}

        {isGlobal && isOnline() && !auth?.isAuthenticated && (
          <div className={styles.message}>
            <p>Melde dich an, um die globale Rangliste zu sehen.</p>
          </div>
        )}

        {isGlobal && isOnline() && auth?.isAuthenticated && loadingGlobal && (
          <div className={styles.message}>
            <p>Lade Rangliste…</p>
          </div>
        )}

        {isGlobal && isOnline() && auth?.isAuthenticated && !loadingGlobal && globalData.length === 0 && (
          <div className={styles.message}>
            <p>Noch keine Einträge vorhanden.</p>
          </div>
        )}

        {isFriends && (
          <div className={styles.message}>
            <p>Freundesliste noch nicht verfügbar.</p>
          </div>
        )}

        {/* Podium */}
        {showPodium && podiumOrder.length > 0 && (
          <div className={styles.podium}>
            {podiumOrder.map(({ entry, rank }) => (
              <PodiumColumn
                key={rank}
                entry={entry}
                rank={rank}
                isDemo={isLokal}
              />
            ))}
          </div>
        )}

        {/* Ranked list (rank 4+) */}
        {showPodium && rest.length > 0 && (
          <div className={styles.list}>
            {rest.map((entry, i) => {
              const idx = i + 3; // 0-based index in full list
              const rank = idx + 1;
              const isMe = isGlobal && entry.user_id === userId;
              const username = isLokal ? entry.username : (entry.username || 'Anonym');
              const elo = entry.elo_rating || 1200;
              const avatarUrl = isLokal ? null : entry.avatar_url;

              return (
                <div
                  key={entry.user_id || i}
                  className={`${styles.listRow} ${isMe ? styles.listRowMe : ''}`}
                  style={{ animationDelay: `${i * 0.04}s` }}
                >
                  <span className={styles.listRank}>{rank}</span>
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={username} className={styles.listAvatar} />
                  ) : (
                    <div className={styles.listAvatarPlaceholder}>
                      <ShieldIcon size={12} color="var(--gold-500)" />
                    </div>
                  )}
                  <span className={`${styles.listUsername} ${isMe ? styles.listUsernameMe : ''}`}>
                    {username}
                    {isMe && <Badge>Du</Badge>}
                  </span>
                  <span className={styles.listElo}>{elo}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Sticky own rank */}
        {ownEntry && ownRank > 3 && (
          <div className={styles.ownRank}>
            <span className={styles.listRank}>{ownRank}</span>
            <div className={styles.listAvatarPlaceholder}>
              <ShieldIcon size={12} color="var(--gold-500)" />
            </div>
            <span className={`${styles.listUsername} ${styles.listUsernameMe}`}>
              {ownEntry.username || 'Du'}
              <Badge>Du</Badge>
            </span>
            <span className={styles.listElo}>{ownEntry.elo_rating || 1200}</span>
            {milestoneCta && (
              <span className={styles.milestoneCta}>{milestoneCta}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
