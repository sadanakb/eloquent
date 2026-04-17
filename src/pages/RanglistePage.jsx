import { useState, useEffect, useCallback } from 'react';
import { getRang } from '../data/raenge.js';
import { supabase, isOnline } from '../lib/supabase.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { getRankTitle } from '../engine/elo.js';
import { Badge } from '../components/Badge.jsx';
import { Ornament } from '../components/Ornament.jsx';
import { CrownIcon, ShieldIcon } from '../components/icons/Icons.jsx';
import { logger } from '../engine/logger.js';
import { getFriends } from '../engine/friends.js';
import styles from './RanglistePage.module.css';

function AvatarCircle({ avatarUrl, username, size = 48, isFirst = false }) {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={username}
        className={`${styles.avatar} ${isFirst ? styles.avatarFirst : ''}`}
        style={{ width: size, height: size }}
        loading="lazy"
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

function PodiumColumn({ entry, rank }) {
  const isFirst = rank === 1;
  const isSecond = rank === 2;
  const username = entry.username || 'Anonym';
  const elo = entry.elo_rating || 1200;
  const avatarUrl = entry.avatar_url;

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
  const [friendsData, setFriendsData] = useState([]);
  const [loadingGlobal, setLoadingGlobal] = useState(false);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [leaderboardError, setLeaderboardError] = useState(null);

  const auth = useAuth();
  const userId = auth?.user?.id;

  const fetchLeaderboard = useCallback(async () => {
    if (!isOnline() || !supabase) return;
    try {
      setLoadingGlobal(true);
      setLeaderboardError(null);
      const { data, error } = await supabase
        .from('weekly_leaderboard')
        .select('*')
        .order('elo_rating', { ascending: false })
        .limit(100);

      if (error) {
        logger.error('Leaderboard fetch failed:', error.message);
        setLeaderboardError('Rangliste konnte nicht geladen werden.');
        setGlobalData([]);
      } else {
        setGlobalData(data || []);
      }
    } catch (err) {
      logger.error('Leaderboard fetch error:', err);
      setLeaderboardError('Rangliste konnte nicht geladen werden. Bitte versuche es später erneut.');
      setGlobalData([]);
    } finally {
      setLoadingGlobal(false);
    }
  }, []);

  useEffect(() => {
    if (tab !== 'global') return;
    fetchLeaderboard();
  }, [tab, fetchLeaderboard]);

  // Fetch friends for the "Freunde" tab
  useEffect(() => {
    if (tab !== 'freunde' || !userId) return;
    const loadFriends = async () => {
      setLoadingFriends(true);
      const data = await getFriends(userId);
      setFriendsData(
        data
          .map(f => ({ user_id: f.id, username: f.username, avatar_url: f.avatar_url, elo_rating: f.elo_rating || 1200 }))
          .sort((a, b) => b.elo_rating - a.elo_rating)
      );
      setLoadingFriends(false);
    };
    loadFriends();
  }, [tab, userId]);

  // Determine the current data set to render
  const isFriends = tab === 'freunde';
  const isGlobal = tab === 'global';

  const activeData = isFriends ? friendsData : globalData;

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

  const showPodium = ((isGlobal && auth?.isAuthenticated && !loadingGlobal) || (isFriends && !loadingFriends)) && activeData.length >= 1;

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
        </div>

        {/* Messages */}
        {isGlobal && !isOnline() && (
          <div className={styles.message} role="alert">
            <p>Du bist offline. Übungsmodus und Story sind weiterhin verfügbar.</p>
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

        {isGlobal && isOnline() && auth?.isAuthenticated && !loadingGlobal && leaderboardError && (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <p style={{ color: 'var(--text-secondary, #666)', marginBottom: '1rem' }}>
              {leaderboardError}
            </p>
            <button
              onClick={() => fetchLeaderboard()}
              className="btn-gold"
              style={{ padding: '0.5rem 1.5rem', cursor: 'pointer' }}
            >
              Erneut versuchen
            </button>
          </div>
        )}

        {isGlobal && isOnline() && auth?.isAuthenticated && !loadingGlobal && !leaderboardError && globalData.length === 0 && (
          <div className={styles.message}>
            <p>Noch keine Einträge vorhanden.</p>
          </div>
        )}

        {isFriends && loadingFriends && (
          <div className={styles.message}>
            <p>Laden...</p>
          </div>
        )}

        {isFriends && !loadingFriends && friendsData.length === 0 && (
          <div className={styles.message}>
            <p>Noch keine Freunde. Füge Freunde über das Duell-Menü hinzu!</p>
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
              const username = entry.username || 'Anonym';
              const elo = entry.elo_rating || 1200;
              const avatarUrl = entry.avatar_url;

              return (
                <div
                  key={entry.user_id || i}
                  className={`${styles.listRow} ${isMe ? styles.listRowMe : ''}`}
                  style={{ animationDelay: `${i * 0.04}s` }}
                >
                  <span className={styles.listRank}>{rank}</span>
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={username} className={styles.listAvatar} loading="lazy" />
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
