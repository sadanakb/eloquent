import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { supabase, isOnline } from '../lib/supabase.js';
import { joinQueue, leaveQueue } from '../engine/matchmaking.js';
import {
  subscribeToMatch,
  submitAnswer,
  requestServerScoring,
  createFriendChallenge,
  joinFriendChallenge,
  forfeitMatch,
  cleanupMyStaleData,
} from '../engine/online-game.js';
import { createPresence } from '../engine/presence.js';
import { getRankTitle } from '../engine/elo.js';
import eventBus from '../engine/event-bus.js';
import { SITUATIONEN, getSituationById } from '../data/situationen.js';
import { useActiveMatch, markActiveMatch, clearActiveMatch } from '../hooks/useActiveMatch.js';
import { AntwortEingabe } from '../components/AntwortEingabe.jsx';
import { BewertungDisplay } from '../components/BewertungDisplay.jsx';
import { Card } from '../components/Card.jsx';
import { Badge } from '../components/Badge.jsx';
import { Button } from '../components/Button.jsx';
import { GoldBar } from '../components/GoldBar.jsx';
import { OrnamentIcon, OrnamentDivider } from '../components/Ornament.jsx';
import { Confetti } from '../components/Confetti.jsx';
import { AuthModal } from '../components/AuthModal.jsx';
import { Input } from '../components/Input.jsx';
import { GlobeNetwork, BoltIcon } from '../components/icons/Icons.jsx';
import { logger } from '../engine/logger.js';
import { getFriends, getPendingRequests, sendFriendRequest, sendFriendRequestByCode, respondToRequest, removeFriend, searchUsers, subscribeFriendEvents, updateLastSeen, isUserOnline } from '../engine/friends.js';
import { FriendListSection } from '../components/FriendListSection.jsx';
import { FriendRequestsSection } from '../components/FriendRequestsSection.jsx';
import { AddFriendModal } from '../components/AddFriendModal.jsx';
import styles from './OnlineDuellPage.module.css';

function getRandomSituation() {
  const pool = SITUATIONEN.mittel?.length ? SITUATIONEN.mittel
    : SITUATIONEN.leicht?.length ? SITUATIONEN.leicht
    : [];
  return pool[Math.floor(Math.random() * pool.length)];
}

export function OnlineDuellPage({ onNavigate }) {
  const { user, profile, isAuthenticated, isLoading, updateProfile } = useAuth();
  const [phase, setPhase] = useState('menu');
  const [showAuth, setShowAuth] = useState(false);

  // Matchmaking
  const [searchElapsed, setSearchElapsed] = useState(0);
  const [eloRange, setEloRange] = useState(200);
  const leaveQueueRef = useRef(null);

  // Match state
  const [match, setMatch] = useState(null);
  const [opponent, setOpponent] = useState(null);
  const [situation, setSituation] = useState(null);
  const [countdown, setCountdown] = useState(5);
  const [opponentStatus, setOpponentStatus] = useState('writing');
  const unsubMatchRef = useRef(null);
  const isScoringRef = useRef(false);
  const scoringTimeoutRef = useRef(null);

  // Result
  const [playerResult, setPlayerResult] = useState(null);
  const [opponentScore, setOpponentScore] = useState(null);
  const [playerScore, setPlayerScore] = useState(null);
  const [eloChange, setEloChange] = useState(0);
  const [winner, setWinner] = useState(null);
  const [scoringMethod, setScoringMethod] = useState('ki');

  // Friend challenge
  const [friendCode, setFriendCode] = useState('');
  const [friendCodeInput, setFriendCodeInput] = useState('');
  const [friendWaiting, setFriendWaiting] = useState(false);
  const [showCodeInput, setShowCodeInput] = useState(false);

  // Presence
  const [opponentDisconnected, setOpponentDisconnected] = useState(false);
  const [disconnectCountdown, setDisconnectCountdown] = useState(60);
  const presenceRef = useRef(null);
  const countdownIntervalRef = useRef(null);

  const myElo = profile?.elo_rating || 1200;

  // Friends
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [friendsLoading, setFriendsLoading] = useState(false);
  const [showAddFriend, setShowAddFriend] = useState(false);
  const friendSubRef = useRef(null);

  // Reconnect: check for active matches on mount
  const { activeMatch, reconnectState, isLoading: reconnectLoading } = useActiveMatch(user?.id);

  useEffect(() => {
    if (reconnectState && activeMatch && !match) {
      // Restore the match state
      setMatch(activeMatch);

      // Restore the situation from match data
      if (activeMatch.situation_id) {
        const sit = getSituationById(activeMatch.situation_id);
        if (sit) setSituation(sit);
      }

      // Handle auto_submit: time expired — submit placeholder and move to waiting
      if (reconnectState.phase === 'auto_submit') {
        setMatch(reconnectState.match);
        setPhase('waiting');
        submitAnswer(reconnectState.match.id, user.id, '(Zeit abgelaufen)').catch(err => {
          logger.error('Auto-submit on reconnect failed:', err);
        });
        return;
      }

      // Jump to the appropriate phase
      setPhase(reconnectState.phase);
    }
  }, [reconnectState, activeMatch]);

  // Clean up stale data on page load
  useEffect(() => {
    if (user?.id) {
      cleanupMyStaleData(user.id);
    }
  }, [user?.id]);

  // Load friends and friend requests
  useEffect(() => {
    if (!user?.id) return;

    const loadFriends = async () => {
      setFriendsLoading(true);
      const [friendsData, requestsData] = await Promise.all([
        getFriends(user.id),
        getPendingRequests(user.id),
      ]);
      setFriends(friendsData.map(f => ({ ...f, isOnline: isUserOnline(f.last_seen_at) })));
      setFriendRequests(requestsData);
      setFriendsLoading(false);
    };

    loadFriends();

    // Subscribe to friend events for real-time updates
    const channel = subscribeFriendEvents(user.id,
      () => loadFriends(), // onInsert — reload on new request
      () => loadFriends(), // onUpdate — reload on acceptance
    );
    friendSubRef.current = channel;

    // Online status heartbeat
    updateLastSeen(user.id);
    const heartbeat = setInterval(() => updateLastSeen(user.id), 60000);

    return () => {
      if (friendSubRef.current) {
        supabase.removeChannel(friendSubRef.current);
      }
      clearInterval(heartbeat);
    };
  }, [user?.id]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (leaveQueueRef.current) leaveQueueRef.current();
      if (unsubMatchRef.current) unsubMatchRef.current();
      presenceRef.current?.destroy();
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      if (scoringTimeoutRef.current) {
        clearTimeout(scoringTimeoutRef.current);
        scoringTimeoutRef.current = null;
      }
      isScoringRef.current = false;
    };
  }, []);

  // Presence tracking during active match phases
  useEffect(() => {
    if (!match?.id || !user?.id || !['writing', 'waiting', 'scoring'].includes(phase)) {
      return;
    }

    const presence = createPresence(match.id, user.id, {
      onOpponentOnline: () => {
        setOpponentDisconnected(false);
        setDisconnectCountdown(60);
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = null;
        }
      },
      onOpponentOffline: () => {
        setOpponentDisconnected(true);
        setDisconnectCountdown(60);
        countdownIntervalRef.current = setInterval(() => {
          setDisconnectCountdown(prev => {
            if (prev <= 1) {
              clearInterval(countdownIntervalRef.current);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      },
      onOpponentTimeout: async () => {
        try {
          const opponentId = match.player1_id === user.id ? match.player2_id : match.player1_id;
          if (opponentId) {
            await forfeitMatch(match.id, opponentId);
          }
        } catch (err) {
          logger.error('Auto-forfeit error:', err);
        }
      },
    });
    presenceRef.current = presence;

    return () => {
      presence?.destroy();
      presenceRef.current = null;
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
    };
  }, [match?.id, user?.id, phase]);

  // Search timer with 2-minute timeout
  useEffect(() => {
    if (phase !== 'searching') return;
    const start = Date.now();
    const iv = setInterval(() => {
      const sec = Math.floor((Date.now() - start) / 1000);
      setSearchElapsed(sec);
      if (sec >= 30) setEloRange(400);
      if (sec >= 120) {
        clearInterval(iv);
        handleCancelSearch();
        eventBus.emit('toast:message', {
          message: 'Kein Gegner gefunden. Versuche es später oder fordere einen Freund heraus!',
        });
      }
    }, 1000);
    return () => clearInterval(iv);
  }, [phase]);

  // Countdown for matched phase
  useEffect(() => {
    if (phase !== 'matched') return;
    setCountdown(5);
    const iv = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(iv);
          startWriting();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [phase]);

  // Listen for matchmaking events
  useEffect(() => {
    const onFound = async ({ match: m }) => {
      setMatch(m);
      markActiveMatch(m.id);
      // Fetch opponent profile
      const opponentId = m.player1_id === user?.id ? m.player2_id : m.player1_id;
      if (supabase && opponentId) {
        const { data } = await supabase
          .from('profiles')
          .select('username, avatar_url, elo_rating')
          .eq('id', opponentId)
          .maybeSingle();
        setOpponent(data);
      }
      // Use situation from match record so both players see the same one
      if (m.situation_id) {
        const sit = getSituationById(m.situation_id);
        setSituation(sit || getRandomSituation());
      } else {
        setSituation(getRandomSituation());
      }
      setPhase('matched');
    };

    const onExpanding = ({ range }) => {
      setEloRange(range);
    };

    eventBus.on('matchmaking:found', onFound);
    eventBus.on('matchmaking:expanding', onExpanding);
    return () => {
      eventBus.off('matchmaking:found', onFound);
      eventBus.off('matchmaking:expanding', onExpanding);
    };
  }, [user]);

  const handleQuickMatch = async () => {
    if (!user) return;

    // Prevent double match: check for existing active match
    if (supabase) {
      const { data: existing } = await supabase
        .from('matches')
        .select('id, status')
        .or(`player1_id.eq.${user.id},player2_id.eq.${user.id}`)
        .in('status', ['active', 'scoring', 'waiting'])
        .limit(1)
        .maybeSingle();

      if (existing) {
        eventBus.emit('toast:message', { message: 'Du hast bereits ein laufendes Spiel.' });
        return;
      }
    }

    setPhase('searching');
    setSearchElapsed(0);
    setEloRange(200);
    const unsub = await joinQueue(user.id, myElo);
    leaveQueueRef.current = unsub;
  };

  const handleCancelSearch = async () => {
    if (leaveQueueRef.current) {
      await leaveQueueRef.current();
      leaveQueueRef.current = null;
    }
    setPhase('menu');
  };

  const startWriting = () => {
    if (!match) return;
    // Subscribe to match updates
    const unsub = subscribeToMatch(match.id, handleMatchEvent);
    unsubMatchRef.current = unsub;
    setPhase('writing');
  };

  const handleMatchEvent = useCallback((event) => {
    if (event.type === 'opponent_submitted') {
      setOpponentStatus('submitted');
    }
    if (event.type === 'scores_ready') {
      // Scores came from server
      clearActiveMatch();
      const m = event.match;
      const isP1 = m.player1_id === user?.id;
      setPlayerScore(isP1 ? m.player1_score : m.player2_score);
      setOpponentScore(isP1 ? m.player2_score : m.player1_score);
      setWinner(m.winner_id === user?.id ? 'player' : m.winner_id ? 'opponent' : 'draw');
      setPhase('result');
    }
    if (event.type === 'opponent_disconnected') {
      clearActiveMatch();
      setWinner('player');
      setPhase('result');
    }
  }, [user]);

  // FIX 1 — Trust DB status instead of stale opponentStatus state
  const handleWritingSubmit = async (text) => {
    if (!match || !user) return;
    try {
      const updatedMatch = await submitAnswer(match.id, user.id, text);
      // Trust DB status — 'scoring' means both players have submitted
      if (updatedMatch?.status === 'scoring') {
        await performScoring();
      } else {
        setPhase('waiting');
      }
    } catch (err) {
      logger.error('Submit answer failed:', err.message);
      // Still move to waiting so the user isn't stuck
      setPhase('waiting');
    }
  };

  const performScoring = async () => {
    if (isScoringRef.current) return;
    isScoringRef.current = true;
    setPhase('scoring');

    scoringTimeoutRef.current = setTimeout(() => {
      logger.warn('Scoring timeout reached, showing result with available data');
      clearActiveMatch();
      isScoringRef.current = false;
      scoringTimeoutRef.current = null;
      setPhase('result');
    }, 30000);

    try {
      const result = await requestServerScoring(match.id);

      if (result) {
        const isPlayer1 = match.player1_id === user.id;
        const myScore = isPlayer1 ? result.player1_score : result.player2_score;
        const opScore = isPlayer1 ? result.player2_score : result.player1_score;

        setPlayerScore(myScore);
        setOpponentScore(opScore);

        if (result.winner_id === user.id) setWinner('player');
        else if (result.winner_id) setWinner('opponent');
        else setWinner('draw');

        if (result.elo_changes) {
          const myEloChange = isPlayer1 ? result.elo_changes.player1 : result.elo_changes.player2;
          setEloChange(myEloChange);
        }
        if (result.scoring_method) {
          setScoringMethod(result.scoring_method);
        }

        clearActiveMatch();
        setPhase('result');
      }
    } catch (e) {
      logger.error('Server scoring failed:', e);
    } finally {
      if (scoringTimeoutRef.current) {
        clearTimeout(scoringTimeoutRef.current);
        scoringTimeoutRef.current = null;
      }
      isScoringRef.current = false;
    }
  };

  // FIX 2 — When waiting and opponent submits, trigger server scoring
  useEffect(() => {
    if (phase === 'waiting' && opponentStatus === 'submitted') {
      performScoring();
    }
  }, [phase, opponentStatus]);

  // Friend challenge
  const handleCreateChallenge = async () => {
    if (!user) return;
    const result = await createFriendChallenge(user.id);
    if (result) {
      setFriendCode(result.code);
      setFriendWaiting(true);

      // Fetch match to get the situation_id set by createFriendChallenge
      const { data: matchData } = await supabase
        .from('matches')
        .select('*')
        .eq('id', result.matchId)
        .single();

      setMatch(matchData || { id: result.matchId });
      markActiveMatch(result.matchId);
      if (matchData?.situation_id) {
        const sit = getSituationById(matchData.situation_id);
        setSituation(sit || getRandomSituation());
      } else {
        setSituation(getRandomSituation());
      }

      // Subscribe to match for when friend joins
      const unsub = subscribeToMatch(result.matchId, async (event) => {
        if (event.type === 'friend_joined') {
          const m = event.match;
          const opponentId = m.player1_id === user?.id ? m.player2_id : m.player1_id;
          if (supabase && opponentId) {
            // FIX 3 — Use maybeSingle() to handle missing profiles gracefully
            const { data } = await supabase
              .from('profiles')
              .select('username, avatar_url, elo_rating')
              .eq('id', opponentId)
              .maybeSingle();
            setOpponent(data);
          }
          setFriendWaiting(false);
          setMatch(m);
          setPhase('matched');
          return;
        }
        handleMatchEvent(event);
      });
      unsubMatchRef.current = unsub;
    }
  };

  const [joinError, setJoinError] = useState('');

  const sanitizedFriendCode = friendCodeInput.toUpperCase().trim();
  const isValidFriendCode = /^[A-Z0-9]{6}$/.test(sanitizedFriendCode);

  const handleJoinChallenge = async () => {
    if (!user || !isValidFriendCode) return;
    setJoinError('');
    try {
      const m = await joinFriendChallenge(sanitizedFriendCode, user.id);
      if (!m) {
        setJoinError('Code nicht gefunden. Prüfe ob der Code korrekt ist und das Spiel noch wartet.');
        return;
      }
      setMatch(m);
      markActiveMatch(m.id);
      // Use situation from match record so both players see the same one
      if (m.situation_id) {
        const sit = getSituationById(m.situation_id);
        setSituation(sit || getRandomSituation());
      } else {
        setSituation(getRandomSituation());
      }
      const opponentId = m.player1_id === user.id ? m.player2_id : m.player1_id;
      if (supabase && opponentId) {
        // FIX 3 — Use maybeSingle() to handle missing profiles gracefully
        const { data } = await supabase
          .from('profiles')
          .select('username, avatar_url, elo_rating')
          .eq('id', opponentId)
          .maybeSingle();
        setOpponent(data);
      }
      setPhase('matched');
    } catch (err) {
      logger.error('Join challenge failed:', err.message);
      setJoinError('Code nicht gefunden. Prüfe ob der Code korrekt ist und das Spiel noch wartet.');
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Eloquent - Duell-Einladung',
          text: `Fordere mich bei Eloquent heraus! Code: ${friendCode}`,
          url: window.location.origin,
        });
      } catch {
        // User cancelled share
      }
    } else {
      navigator.clipboard?.writeText(friendCode);
    }
  };

  const handleRematch = async () => {
    isScoringRef.current = false;
    if (scoringTimeoutRef.current) { clearTimeout(scoringTimeoutRef.current); scoringTimeoutRef.current = null; }
    // FIX 4 — Clean up match subscription before resetting
    clearActiveMatch();
    if (unsubMatchRef.current) { unsubMatchRef.current(); unsubMatchRef.current = null; }
    presenceRef.current?.destroy(); presenceRef.current = null;
    setOpponentDisconnected(false);
    setDisconnectCountdown(60);
    setPlayerResult(null);
    setOpponentScore(null);
    setPlayerScore(null);
    setEloChange(0);
    setWinner(null);
    setScoringMethod('ki');
    setOpponentStatus('writing');
    setMatch(null);
    setOpponent(null);
    // Re-enter matchmaking queue (creates a fresh match)
    setPhase('searching');
    setSearchElapsed(0);
    setEloRange(200);
    await handleQuickMatch();
  };

  const handleNewMatch = () => {
    // FIX 4 — Clean up match subscription before resetting
    clearActiveMatch();
    if (unsubMatchRef.current) { unsubMatchRef.current(); unsubMatchRef.current = null; }
    presenceRef.current?.destroy(); presenceRef.current = null;
    setOpponentDisconnected(false);
    setDisconnectCountdown(60);
    setPhase('menu');
    setPlayerResult(null);
    setOpponentScore(null);
    setPlayerScore(null);
    setEloChange(0);
    setWinner(null);
    setScoringMethod('ki');
    setOpponentStatus('writing');
    setMatch(null);
    setOpponent(null);
    setFriendCode('');
    setFriendCodeInput('');
    setFriendWaiting(false);
    setShowCodeInput(false);
  };

  // Supabase not initialized — stale cached version, user must reload
  if (!isOnline()) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={`${styles.stateWrap} animate-in`}>
            <OrnamentIcon name="tintenfass" size="xl" className={styles.stateIcon} />
            <h2 className={styles.stateTitle}>Du bist offline</h2>
            <p className={styles.stateText}>
              Für Online-Matches ist eine Internetverbindung nötig. Übungsmodus und Story sind weiterhin verfügbar.
            </p>
            <Button variant="primary" onClick={() => window.location.reload()}>
              Erneut versuchen
            </Button>
            <Button variant="secondary" onClick={() => onNavigate('uebung')}>
              Zum Übungsmodus
            </Button>
            <Button variant="tertiary" onClick={() => onNavigate('home')}>
              Zurück zum Menü
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!isLoading && !isAuthenticated) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <Card className={`animate-in`}>
            <div className={styles.authCard}>
              <OrnamentIcon name="federn" size="lg" className={styles.authIcon} />
              <h2 className={styles.stateTitle}>Anmeldung erforderlich</h2>
              <p className={styles.stateText}>
                Bitte melde dich an, um online zu spielen.
              </p>
              <Button variant="primary" onClick={() => setShowAuth(true)}>
                Anmelden
              </Button>
            </div>
          </Card>
          {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
        </div>
      </div>
    );
  }

  // ── Friend handlers ──
  const handleChallengeFriend = async (friend) => {
    if (!user) return;
    const result = await createFriendChallenge(user.id);
    if (result) {
      // Set player2_id to the friend so they get notified
      await supabase.from('matches').update({ player2_id: friend.id }).eq('id', result.matchId);

      setFriendCode(result.code);
      setFriendWaiting(true);

      const { data: matchData } = await supabase
        .from('matches')
        .select('*')
        .eq('id', result.matchId)
        .single();

      setMatch(matchData || { id: result.matchId });
      markActiveMatch(result.matchId);
      if (matchData?.situation_id) {
        const sit = getSituationById(matchData.situation_id);
        setSituation(sit || getRandomSituation());
      } else {
        setSituation(getRandomSituation());
      }

      // Subscribe to match
      const unsub = subscribeToMatch(result.matchId, async (event) => {
        if (event.type === 'friend_joined') {
          const m = event.match;
          const opponentId = m.player1_id === user?.id ? m.player2_id : m.player1_id;
          if (supabase && opponentId) {
            const { data } = await supabase
              .from('profiles')
              .select('username, avatar_url, elo_rating')
              .eq('id', opponentId)
              .maybeSingle();
            setOpponent(data);
          }
          setFriendWaiting(false);
          setMatch(m);
          setPhase('matched');
          return;
        }
        handleMatchEvent(event);
      });
      unsubMatchRef.current = unsub;
    }
  };

  const handleRemoveFriend = async (friend) => {
    await removeFriend(friend.friendshipId);
    setFriends(prev => prev.filter(f => f.id !== friend.id));
  };

  const handleAcceptRequest = async (friendshipId) => {
    await respondToRequest(friendshipId, user.id, true);
    // Reload both lists
    const [friendsData, requestsData] = await Promise.all([
      getFriends(user.id),
      getPendingRequests(user.id),
    ]);
    setFriends(friendsData.map(f => ({ ...f, isOnline: isUserOnline(f.last_seen_at) })));
    setFriendRequests(requestsData);
  };

  const handleDeclineRequest = async (friendshipId) => {
    await respondToRequest(friendshipId, user.id, false);
    setFriendRequests(prev => prev.filter(r => r.friendshipId !== friendshipId));
  };

  const handleSearchUsers = async (query) => {
    return await searchUsers(query, user.id);
  };

  const handleSendFriendRequest = async (addresseeId) => {
    const result = await sendFriendRequest(user.id, addresseeId);
    return result;
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>

        {/* Opponent disconnect banner */}
        {opponentDisconnected && (
          <div role="alert" aria-live="assertive" style={{
            background: 'linear-gradient(135deg, #8b0000, #a52a2a)',
            color: 'white',
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.9rem',
            fontFamily: 'Lora, serif',
          }}>
            <span>Gegner hat Verbindung verloren</span>
            <span style={{ fontWeight: 'bold', fontVariantNumeric: 'tabular-nums' }}>
              {disconnectCountdown}s verbleibend
            </span>
          </div>
        )}

        {/* Reconnect notice */}
        {reconnectState && phase !== 'menu' && phase !== 'result' && (
          <div style={{
            textAlign: 'center', padding: '0.75rem 1rem',
            fontFamily: 'Lora, serif', color: 'var(--text-secondary)',
            fontSize: '0.9rem', marginBottom: '0.5rem',
          }}>
            Laufendes Spiel gefunden — wird fortgesetzt…
          </div>
        )}

        {/* ── MENU ── */}
        {phase === 'menu' && (
          <div className="animate-in">
            {/* Page header */}
            <div className={styles.header}>
              <h1 className={styles.pageTitle}>ONLINE MATCH</h1>
              <p className={styles.pageSubtitle}>Spiele gegen Gegner aus aller Welt</p>
            </div>

            {/* Quick Match Card */}
            <Card className={styles.matchCard}>
              <div className={styles.cardHeader}>
                <GlobeNetwork size={24} color="var(--gold-500)" />
                <h3 className={styles.cardTitle}>Schnelles Match</h3>
              </div>
              <p className={styles.cardDesc}>
                Wir finden automatisch einen Gegner für dich.
              </p>
              <Button variant="primary" size="md" onClick={handleQuickMatch} className={styles.fullWidth}>
                Match suchen
              </Button>
            </Card>

            {/* Friend Challenge Card */}
            <Card className={styles.matchCard}>
              <div className={styles.cardHeader}>
                <BoltIcon size={24} color="var(--gold-500)" />
                <h3 className={styles.cardTitle}>Freunde herausfordern</h3>
              </div>

              <Button variant="secondary" size="md" onClick={handleCreateChallenge} className={styles.fullWidth}>
                Code erstellen
              </Button>

              <div className={styles.orDivider}>
                <span className={styles.orText}>oder</span>
              </div>

              {!showCodeInput ? (
                <div className={styles.centerAction}>
                  <Button variant="tertiary" size="md" onClick={() => setShowCodeInput(true)}>
                    Code eingeben
                  </Button>
                </div>
              ) : (
                <div className={styles.codeInputArea}>
                  <Input
                    placeholder="ABC123"
                    value={friendCodeInput}
                    onChange={e => setFriendCodeInput(e.target.value.toUpperCase())}
                    maxLength={6}
                    className={styles.codeInput}
                  />
                  <Button
                    variant="primary"
                    size="md"
                    onClick={handleJoinChallenge}
                    disabled={!isValidFriendCode}
                    className={styles.fullWidth}
                  >
                    Beitreten
                  </Button>
                  {friendCodeInput.length > 0 && !isValidFriendCode && (
                    <p className={styles.joinError}>Code muss 6 Zeichen lang sein (Buchstaben und Zahlen)</p>
                  )}
                  {joinError && <p className={styles.joinError}>{joinError}</p>}
                </div>
              )}
            </Card>

            {/* ── Friends Section ── */}
            {isAuthenticated && (
              <>
                <FriendRequestsSection
                  requests={friendRequests}
                  onAccept={handleAcceptRequest}
                  onDecline={handleDeclineRequest}
                  loading={friendsLoading}
                />
                <FriendListSection
                  friends={friends}
                  onChallenge={handleChallengeFriend}
                  onRemove={handleRemoveFriend}
                  onAddClick={() => setShowAddFriend(true)}
                  loading={friendsLoading}
                />
              </>
            )}

            {/* Friend waiting state */}
            {friendWaiting && (
              <Card className={styles.matchCard} style={{ textAlign: 'center' }}>
                <h3 className={styles.friendCodeTitle}>Dein Einladungs-Code</h3>
                <div className={styles.friendCodeDisplay}>{friendCode}</div>
                <p className={styles.friendCodeHint}>Teile diesen Code mit deinem Mitspieler</p>
                <div className={styles.friendCodeActions}>
                  <Button variant="primary" onClick={handleShare}>
                    Teilen
                  </Button>
                  <Button variant="secondary" onClick={() => {
                    if (unsubMatchRef.current) { unsubMatchRef.current(); unsubMatchRef.current = null; }
                    clearActiveMatch();
                    setFriendWaiting(false);
                    setFriendCode('');
                  }}>
                    Abbrechen
                  </Button>
                </div>
                <p className={styles.waitingDots}>Warte auf Mitspieler...</p>
              </Card>
            )}
          </div>
        )}

        {/* ── SEARCHING ── */}
        {phase === 'searching' && (
          <div className={`${styles.searchingWrap} animate-in`}>
            <Card className={styles.searchingCard}>
              <div className={styles.cardHeader}>
                <GlobeNetwork size={24} color="var(--gold-500)" />
                <h3 className={styles.cardTitle}>Schnelles Match</h3>
              </div>
              <p className={styles.cardDesc}>
                Wir finden automatisch einen Gegner für dich.
              </p>
              <Button variant="primary" size="md" disabled className={`${styles.fullWidth} ${styles.searchingButton}`}>
                Suche läuft...
              </Button>
              <div className={styles.searchMeta}>
                <span className={styles.searchTime}>{searchElapsed}s</span>
                <span className={styles.searchRange}>
                  {searchElapsed < 30
                    ? `Suche Gegner (ELO ${Math.max(0, myElo - eloRange)}–${myElo + eloRange})…`
                    : `Erweiterte Suche (ELO ${Math.max(0, myElo - eloRange)}–${myElo + eloRange})…`}
                </span>
              </div>
              {searchElapsed >= 90 && (
                <p className={styles.searchExpanded}>Kein Gegner? Versuche "Freunde herausfordern"!</p>
              )}
            </Card>
            <div className={styles.cancelWrap}>
              <Button variant="tertiary" onClick={handleCancelSearch}>
                Abbrechen
              </Button>
            </div>
          </div>
        )}

        {/* ── MATCHED ── */}
        {phase === 'matched' && (
          <div className={`${styles.matchedWrap} animate-in`}>
            <h2 className={styles.matchedTitle}>Gegner gefunden!</h2>
            <div className={styles.vsScreen}>
              <div className={styles.vsPlayer}>
                <OrnamentIcon name="feder" size="lg" />
                <div className={styles.vsName}>{profile?.username || 'Du'}</div>
                <Badge>{getRankTitle(myElo)}</Badge>
                <div className={styles.vsElo}>{myElo} Elo</div>
              </div>
              <div className={styles.vsCenter}>VS</div>
              <div className={styles.vsPlayer}>
                <OrnamentIcon name="feder" size="lg" />
                <div className={styles.vsName}>{opponent?.username || 'Gegner'}</div>
                <Badge>{getRankTitle(opponent?.elo_rating || 1200)}</Badge>
                <div className={styles.vsElo}>{opponent?.elo_rating || 1200} Elo</div>
              </div>
            </div>
            <div className={styles.matchedCountdown}>
              Startet in {countdown}...
            </div>
            <Button variant="primary" onClick={startWriting}>
              Los geht's!
            </Button>
          </div>
        )}

        {/* ── WRITING ── */}
        {phase === 'writing' && situation && (
          <div>
            <div className={styles.writingHeader}>
              <Badge>Online-Duell</Badge>
              <span className={opponentStatus === 'submitted' ? styles.opponentDone : styles.opponentWriting}>
                {opponentStatus === 'submitted' ? 'Gegner hat abgegeben' : 'Gegner schreibt...'}
              </span>
            </div>
            <AntwortEingabe
              situation={situation}
              spielerName={profile?.username}
              onSubmit={handleWritingSubmit}
              schwierigkeit="mittel"
              matchStartTime={match?.created_at}
            />
          </div>
        )}

        {/* ── WAITING ── */}
        {phase === 'waiting' && (
          <div className={`${styles.stateWrap} animate-in`}>
            <OrnamentIcon name="tintenfass" size="xl" />
            <h2 className={styles.stateTitle}>Warte auf Gegner...</h2>
            <p className={styles.stateText}>
              Du hast deine Antwort abgegeben. Warte, bis dein Gegner fertig ist.
            </p>
          </div>
        )}

        {/* ── SCORING ── */}
        {phase === 'scoring' && (
          <div className={`${styles.stateWrap} animate-in`}>
            <div className={styles.scoringPulse}>
              <OrnamentIcon name="tintenfass" size="xl" />
            </div>
            <h2 className={styles.stateTitle}>KI bewertet beide Antworten...</h2>
            <p className={styles.stateText}>Die Eloquenz wird analysiert</p>
          </div>
        )}

        {/* ── RESULT ── */}
        {phase === 'result' && (
          <div className="animate-in">
            {winner === 'player' && <Confetti active={true} />}

            <h2 className={styles.resultMainTitle}>
              <OrnamentIcon name="lorbeer" size="md" style={{ marginRight: 8, verticalAlign: 'text-bottom' }} />
              {winner === 'player' ? 'Du hast gewonnen!' : winner === 'opponent' ? 'Niederlage' : 'Unentschieden'}
            </h2>

            <Card glow={winner === 'player'} ornate style={{ marginBottom: 16 }}>
              <div className={styles.resultVs}>
                <div className={styles.resultPlayerCol}>
                  <div className={styles.resultPlayerName}>{profile?.username || 'Du'}</div>
                  <div className={styles.resultScoreNum}>{playerScore != null ? playerScore.toFixed(1) : '--'}</div>
                </div>
                <div className={styles.resultVsCenter}>VS</div>
                <div className={styles.resultPlayerCol}>
                  <div className={styles.resultPlayerName}>{opponent?.username || 'Gegner'}</div>
                  <div className={styles.resultScoreNum}>{opponentScore != null ? opponentScore.toFixed(1) : '--'}</div>
                </div>
              </div>

              <OrnamentDivider />

              <div className={styles.eloChangeRow}>
                <span className={styles.eloChangeLabel}>Elo-Veränderung:</span>
                <span className={eloChange >= 0 ? styles.eloChangePos : styles.eloChangeNeg}>
                  {eloChange >= 0 ? '+' : ''}{eloChange}
                </span>
              </div>
              {scoringMethod === 'heuristic' && (
                <div style={{
                  textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)',
                  fontStyle: 'italic', marginTop: '0.5rem',
                }}>
                  Bewertet mit alternativer Methode
                </div>
              )}
            </Card>

            {playerResult && (
              <BewertungDisplay ergebnis={playerResult} spielerName={profile?.username} />
            )}

            <div className={styles.resultActions}>
              <Button variant="primary" onClick={handleRematch}>
                Rematch
              </Button>
              <Button variant="secondary" onClick={handleNewMatch}>
                Neues Match
              </Button>
              <Button variant="tertiary" onClick={() => onNavigate('home')}>
                Zum Menü
              </Button>
            </div>
          </div>
        )}

      </div>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
      {showAddFriend && (
        <AddFriendModal
          isOpen={showAddFriend}
          onClose={() => setShowAddFriend(false)}
          onSendRequest={handleSendFriendRequest}
          onSearchUsers={handleSearchUsers}
          myFriendCode={profile?.friend_code || ''}
        />
      )}
    </div>
  );
}
