import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  const { code: routeCode } = useParams();
  const navigate = useNavigate();
  const [phase, setPhase] = useState('menu');
  const [showAuth, setShowAuth] = useState(false);
  const autoJoinedRef = useRef(false);

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
  // submitError carries the cause for a failed submit so we can render a
  // persistent, informative card in the result phase (never silent reset).
  // shape: { kind: 'match_ended'|'network'|'unknown', message: string, raw?: any }
  const [submitError, setSubmitError] = useState(null);
  // UX hint flags — persistent info cards in waiting/scoring phases.
  const [waitingLongHint, setWaitingLongHint] = useState(false);
  const [scoringLongHint, setScoringLongHint] = useState(false);
  const opponentSubmittedRef = useRef(false);

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
  const [challengeLoading, setChallengeLoading] = useState(false);

  // Presence
  const [opponentDisconnected, setOpponentDisconnected] = useState(false);
  const [disconnectCountdown, setDisconnectCountdown] = useState(30);
  const presenceRef = useRef(null);
  const countdownIntervalRef = useRef(null);
  // Tracks whether the local player has successfully submitted their text.
  // Used as a Guard in onOpponentTimeout: we only auto-forfeit the opponent
  // if WE have already submitted; otherwise we wait to avoid destroying our
  // own in-progress work.
  const mySubmittedRef = useRef(false);

  const myElo = profile?.elo_rating || 1200;

  // Friends
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [friendsLoading, setFriendsLoading] = useState(false);
  const [showAddFriend, setShowAddFriend] = useState(false);
  const friendSubRef = useRef(null);

  // Reconnect: check for active matches on mount
  const { activeMatch, reconnectState, isLoading: reconnectLoading } = useActiveMatch(user?.id);
  const [showReconnectChoice, setShowReconnectChoice] = useState(false);

  useEffect(() => {
    if (reconnectState && activeMatch && !match) {
      // Show choice dialog instead of auto-resuming
      setShowReconnectChoice(true);
    }
  }, [reconnectState, activeMatch]);

  const handleResumeMatch = () => {
    setShowReconnectChoice(false);
    if (!activeMatch || !reconnectState) return;

    setMatch(activeMatch);
    if (activeMatch.situation_id) {
      const sit = getSituationById(activeMatch.situation_id);
      if (sit) setSituation(sit);
    }

    if (reconnectState.phase === 'auto_submit') {
      setMatch(reconnectState.match);
      subscribeToMatchIfNeeded(reconnectState.match.id);
      setPhase('waiting');
      mySubmittedRef.current = true;
      submitAnswer(reconnectState.match.id, user.id, '(Zeit abgelaufen)').catch(err => {
        logger.error('Auto-submit on reconnect failed:', err);
      });
      return;
    }
    // For all resumed phases, ensure we have a live subscription so
    // state transitions (opponent submit, scores ready, forfeit) arrive
    // via Realtime and not only via the 3s polling fallback.
    subscribeToMatchIfNeeded(activeMatch.id);
    setPhase(reconnectState.phase);
  };

  const handleAbandonMatch = async () => {
    setShowReconnectChoice(false);
    if (activeMatch?.id && user?.id) {
      try {
        await forfeitMatch(activeMatch.id, user.id);
      } catch (err) {
        logger.error('Abandon match forfeit failed:', err);
      }
    }
    clearActiveMatch();
  };

  // Auto-join match when navigating to /duell/:code (from "Annehmen" toast)
  useEffect(() => {
    if (!routeCode || !user?.id || !isAuthenticated || autoJoinedRef.current || match) return;
    autoJoinedRef.current = true;

    (async () => {
      try {
        const m = await joinFriendChallenge(routeCode, user.id);
        if (!m) {
          eventBus.emit('toast:message', { message: 'Match nicht gefunden oder bereits abgelaufen.' });
          navigate('/duell', { replace: true });
          return;
        }
        setMatch(m);
        markActiveMatch(m.id);
        if (m.situation_id) {
          const sit = getSituationById(m.situation_id);
          setSituation(sit || getRandomSituation());
        } else {
          setSituation(getRandomSituation());
        }
        const opponentId = m.player1_id === user.id ? m.player2_id : m.player1_id;
        if (supabase && opponentId) {
          const { data } = await supabase
            .from('profiles')
            .select('username, avatar_url, elo_rating')
            .eq('id', opponentId)
            .maybeSingle();
          setOpponent(data);
        }
        setPhase('matched');
        // Clean up URL so refresh doesn't re-join
        navigate('/duell', { replace: true });
      } catch (err) {
        logger.error('Auto-join from route code failed:', err);
        eventBus.emit('toast:message', { message: 'Beitritt fehlgeschlagen: ' + (err.message || 'Unbekannter Fehler') });
        navigate('/duell', { replace: true });
      }
    })();
  }, [routeCode, user?.id, isAuthenticated]);

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
      isScoringRef.current = false;
    };
  }, []);

  // Warn before leaving during active match
  useEffect(() => {
    if (!['writing', 'waiting', 'scoring'].includes(phase)) return;
    const handler = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [phase]);

  // Presence tracking during writing/waiting only — NEVER during scoring
  // (scoring phase must complete, even if opponent briefly disconnects)
  useEffect(() => {
    if (!match?.id || !user?.id || !['writing', 'waiting'].includes(phase)) {
      return;
    }

    const presence = createPresence(match.id, user.id, {
      onOpponentOnline: () => {
        setOpponentDisconnected(false);
        setDisconnectCountdown(30);
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = null;
        }
      },
      onOpponentOffline: () => {
        setOpponentDisconnected(true);
        setDisconnectCountdown(30);
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
        // Strict guards — any failed check aborts forfeit silently.
        try {
          if (isScoringRef.current) return;
          if (['scoring', 'result'].includes(phase)) return;

          // Guard A: we ourselves must already have submitted. Forfeiting the
          // opponent while we still have an unfinished text only punishes us.
          if (!mySubmittedRef.current) {
            logger.info('Auto-forfeit skipped: local player has not submitted yet');
            return;
          }

          // Guard B: opponent must NOT have submitted yet. If they did, scoring
          // is imminent and a forfeit here would destroy valid work.
          if (opponentSubmittedRef.current) {
            logger.info('Auto-forfeit skipped: opponent already submitted');
            return;
          }

          // Guard C: live DB recheck — status still active, no scores yet,
          // and opponent text still missing.
          const { data: fresh } = await supabase
            .from('matches')
            .select('status, player1_text, player2_text, player1_score')
            .eq('id', match.id)
            .maybeSingle();

          if (!fresh) {
            logger.info('Auto-forfeit skipped: match not found on recheck');
            return;
          }
          if (fresh.status !== 'active') {
            logger.info('Auto-forfeit skipped: match status ' + fresh.status);
            return;
          }
          if (fresh.player1_text && fresh.player2_text) {
            logger.info('Auto-forfeit skipped: both texts present');
            return;
          }
          if (fresh.player1_score != null) {
            logger.info('Auto-forfeit skipped: already scored');
            return;
          }

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

  // Track latest phase in a ref so event-bus listeners (registered once) can
  // read the current phase without being re-attached on every transition.
  const phaseRef = useRef(phase);
  useEffect(() => { phaseRef.current = phase; }, [phase]);

  // Listen for matchmaking events
  useEffect(() => {
    const onFound = async ({ match: m }) => {
      // Phase-guard: only react while we are actively searching. After
      // handleCancelSearch or any phase change, late "found" events from
      // stale subscriptions must be ignored (otherwise user gets yanked
      // back into a match they already abandoned).
      if (phaseRef.current !== 'searching') return;

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
  }, [user?.id]);

  const handleQuickMatch = async () => {
    if (!user) return;

    // Prevent double match: check for existing active match
    if (supabase) {
      const { data: existing } = await supabase
        .from('matches')
        .select('id, status')
        .or(`player1_id.eq.${user.id},player2_id.eq.${user.id}`)
        .in('status', ['active', 'scoring'])
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

  // Ensures exactly one active match subscription at a time.
  // If a subscription already exists (e.g. from startWriting / resume / friend
  // challenge), it is torn down before a new one is created. Safe to call
  // multiple times with the same matchId.
  const subscribeToMatchIfNeeded = useCallback((matchId, cb = handleMatchEvent) => {
    if (!matchId || !user?.id) return;
    if (unsubMatchRef.current) {
      try { unsubMatchRef.current(); } catch { /* ignore */ }
      unsubMatchRef.current = null;
    }
    const unsub = subscribeToMatch(matchId, cb, user.id);
    unsubMatchRef.current = unsub;
  }, [handleMatchEvent, user?.id]);

  const startWriting = () => {
    if (!match) return;
    subscribeToMatchIfNeeded(match.id);
    setPhase('writing');
  };

  // performScoring is defined further down. Wrap it in a ref so handleMatchEvent
  // (and other callbacks) can call it without needing to be re-declared
  // every render / introducing circular useCallback deps.
  const performScoringRef = useRef(() => {});

  const handleMatchEvent = useCallback((event) => {
    if (event.type === 'opponent_submitted') {
      opponentSubmittedRef.current = true;
      setOpponentStatus('submitted');
    }
    if (event.type === 'scores_ready') {
      // Scores came from server via Realtime
      clearActiveMatch();
      const m = event.match;
      const isP1 = m.player1_id === user?.id;
      setPlayerScore(isP1 ? m.player1_score : m.player2_score);
      setOpponentScore(isP1 ? m.player2_score : m.player1_score);
      setWinner(m.winner_id === user?.id ? 'player' : m.winner_id ? 'opponent' : 'draw');
      if (m.scoring_method) setScoringMethod(m.scoring_method);
      // ELO delta: snapshot current profile ELO, then refresh and diff.
      // The DB trigger / score-match function has already updated profiles.elo_rating.
      const oldElo = profile?.elo_rating ?? 1200;
      (async () => {
        try {
          const fresh = await updateProfile({});
          const newElo = fresh?.elo_rating ?? oldElo;
          setEloChange(newElo - oldElo);
        } catch {
          setEloChange(0);
        }
      })();
      isScoringRef.current = false;
      setPhase('result');
    }
    if (event.type === 'opponent_disconnected') {
      const m = event.match;
      // If both texts are already submitted, scoring MUST run — don't show forfeit result.
      // Recover the match and run scoring so scores are computed.
      if (m?.player1_text && m?.player2_text && m?.player1_score == null) {
        logger.info('Forfeit arrived with both texts present — running scoring instead');
        performScoringRef.current();
        return;
      }
      clearActiveMatch();
      // Winner determined by DB (forfeit_match sets winner_id correctly)
      setWinner(m?.winner_id === user?.id ? 'player' : m?.winner_id ? 'opponent' : 'player');
      isScoringRef.current = false;
      setPhase('result');
      updateProfile({});
    }
  }, [user?.id, updateProfile, profile?.elo_rating]);

  const submittingRef = useRef(false);

  // Submit answer — returns { success: true|false, reason? } so AntwortEingabe
  // knows whether to lock the UI. NEVER silently setPhase('menu') — a failed
  // submit always surfaces via a persistent error card in the result phase.
  const handleWritingSubmit = useCallback(async (text) => {
    if (submittingRef.current) return { success: false, reason: 'in_flight' };
    if (!match || !user) return { success: false, reason: 'no_match' };
    submittingRef.current = true;

    // If text is null/empty (timer expired), use placeholder
    const submitText = text && text.trim().length > 0 ? text.trim() : '(Zeit abgelaufen)';

    try {
      const updatedMatch = await submitAnswer(match.id, user.id, submitText);
      if (!updatedMatch) {
        submittingRef.current = false;
        setSubmitError({
          kind: 'unknown',
          message: 'Abgabe fehlgeschlagen — keine Antwort vom Server. Bitte nochmal versuchen.',
        });
        setPhase('result');
        return { success: false, reason: 'no_match_returned' };
      }
      mySubmittedRef.current = true;
      submittingRef.current = false;
      // Trust DB status — 'scoring' means both players have submitted
      if (updatedMatch.status === 'scoring') {
        // Kick off scoring in the background. AntwortEingabe proceeds into
        // its post-submit disabled state; performScoring will itself move
        // us to 'scoring' then 'result'.
        performScoringRef.current();
      } else {
        setPhase('waiting');
      }
      return { success: true };
    } catch (err) {
      submittingRef.current = false;
      logger.error('Submit answer failed:', err?.message);
      const msg = err?.message || '';
      if (msg.includes('nicht mehr aktiv') || msg.includes('bereits')) {
        // Match ended while we were typing — surface a clear, recoverable
        // error card instead of dumping the user back to the menu.
        clearActiveMatch();
        setSubmitError({
          kind: 'match_ended',
          message: 'Das Match wurde während deiner Eingabe beendet. Dein Text konnte nicht gespeichert werden.',
          raw: msg,
        });
        setPhase('result');
        return { success: false, reason: 'match_ended' };
      }
      // Network / unknown error
      const isNetwork = /network|fetch|timeout|abort/i.test(msg);
      setSubmitError({
        kind: isNetwork ? 'network' : 'unknown',
        message: isNetwork
          ? 'Keine Verbindung zum Server. Prüfe deine Internetverbindung und versuche es erneut.'
          : ('Abgabe fehlgeschlagen: ' + (msg || 'unbekannter Fehler')),
        raw: msg,
      });
      setPhase('result');
      return { success: false, reason: isNetwork ? 'network' : 'unknown' };
    }
  }, [match, user]);

  // Helper: apply scoring result to state
  const applyScoringResult = useCallback((result) => {
    if (!match || !user) return;
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
    isScoringRef.current = false;
    setPhase('result');
    // Refresh profile to get updated ELO
    updateProfile({});
  }, [match, user, updateProfile]);


  const performScoring = useCallback(async () => {
    if (isScoringRef.current) return;
    if (!match || !user) return;
    isScoringRef.current = true;
    setScoringLongHint(false);
    setPhase('scoring');

    try {
      // 1. Versuche Server-Scoring (Edge Function)
      let result = null;
      try {
        result = await requestServerScoring(match.id);
      } catch (e) {
        logger.warn('Server scoring failed:', e.message);
      }

      // 1a. Server hat 202/in_progress geliefert — ein anderer Client/Invocation
      //     scort bereits. Nicht fallback-scoren! Realtime/Polling liefert
      //     den finalen State nach. setPhase bleibt 'scoring'.
      if (result?.status === 'in_progress') {
        logger.info('Server scoring in progress, awaiting realtime/polling');
        isScoringRef.current = false;
        return;
      }

      // 2. Server hat Scores geliefert → benutzen
      if (result?.player1_score != null) {
        applyScoringResult(result);
        return;
      }
      if (result?.already_completed && result?.player1_score != null) {
        applyScoringResult(result);
        return;
      }

      // 3. Prüfe ob ein anderer Client schon gescored hat
      const { data: checkMatch } = await supabase
        .from('matches')
        .select('status, player1_score, player2_score, winner_id, scoring_method')
        .eq('id', match.id)
        .single();

      if (checkMatch?.player1_score != null) {
        applyScoringResult(checkMatch);
        return;
      }

      // 4. Fallback: Client-seitiges Scoring
      logger.info('Client-side scoring fallback');
      const { data: fullMatch } = await supabase
        .from('matches')
        .select('*')
        .eq('id', match.id)
        .single();

      if (!fullMatch?.player1_text || !fullMatch?.player2_text) {
        logger.warn('Cannot score: missing texts');
        clearActiveMatch();
        setSubmitError({
          kind: 'unknown',
          message: 'Bewertung fehlgeschlagen: Texte konnten nicht geladen werden.',
        });
        setPhase('result');
        return;
      }

      const { kiBewertung } = await import('../engine/scoring-engine.js');
      const sit = situation || { titel: '', kontext: '', beschreibung: '' };

      const [score1, score2] = await Promise.all([
        kiBewertung(sit, fullMatch.player1_text),
        kiBewertung(sit, fullMatch.player2_text),
      ]);

      const sumKat = (r) => r?.kategorien
        ? Object.values(r.kategorien).reduce((s, k) => s + (k?.p || 0), 0)
        : 50;
      const p1Score = sumKat(score1);
      const p2Score = sumKat(score2);
      const winnerId = p1Score > p2Score ? fullMatch.player1_id
                     : p2Score > p1Score ? fullMatch.player2_id
                     : null;

      // Atomic DB-side write via RPC — self-healing even if match status
      // is 'forfeited' or 'scoring'. Handles ELO updates server-side.
      const { data: completedMatch, error: rpcErr } = await supabase.rpc(
        'complete_match_with_scores',
        {
          p_match_id: match.id,
          p_player1_score: p1Score,
          p_player2_score: p2Score,
          p_scoring_method: 'client',
        }
      );

      if (rpcErr) {
        logger.warn('complete_match_with_scores RPC failed, falling back to direct update:', rpcErr.message);
        // Last-resort direct update (bypassed by RLS when policies hold)
        await supabase
          .from('matches')
          .update({
            player1_score: p1Score,
            player2_score: p2Score,
            winner_id: winnerId,
            status: 'completed',
            completed_at: new Date().toISOString(),
            scoring_method: 'client',
          })
          .eq('id', match.id)
          .is('player1_score', null);
      }

      applyScoringResult(completedMatch || {
        player1_score: p1Score,
        player2_score: p2Score,
        winner_id: winnerId,
        scoring_method: 'client',
      });

    } catch (e) {
      logger.error('Scoring completely failed:', e);
      setSubmitError({
        kind: 'unknown',
        message: 'Bewertung fehlgeschlagen: ' + (e?.message || 'unbekannter Fehler'),
      });
      clearActiveMatch();
      setPhase('result');
    } finally {
      isScoringRef.current = false;
    }
  }, [match, user, situation, applyScoringResult]);

  // Expose current performScoring to refs-that-want-to-call-it
  useEffect(() => {
    performScoringRef.current = performScoring;
  }, [performScoring]);

  // When waiting and opponent submits, trigger server scoring
  useEffect(() => {
    if (phase === 'waiting' && opponentStatus === 'submitted') {
      performScoring();
    }
  }, [phase, opponentStatus, performScoring]);

  // UX: show persistent info hint in 'waiting' if opponent didn't submit within 15s.
  useEffect(() => {
    if (phase !== 'waiting') {
      setWaitingLongHint(false);
      return;
    }
    setWaitingLongHint(false);
    if (opponentSubmittedRef.current) return;
    const t = setTimeout(() => {
      if (!opponentSubmittedRef.current && isOnline()) {
        setWaitingLongHint(true);
      }
    }, 15000);
    return () => clearTimeout(t);
  }, [phase]);

  // UX: show persistent info hint in 'scoring' if it takes > 30s.
  useEffect(() => {
    if (phase !== 'scoring') {
      setScoringLongHint(false);
      return;
    }
    setScoringLongHint(false);
    const t = setTimeout(() => setScoringLongHint(true), 30000);
    return () => clearTimeout(t);
  }, [phase]);

  // Polling fallback: if Realtime doesn't deliver, check match status periodically
  useEffect(() => {
    if (!['waiting', 'scoring'].includes(phase) || !match?.id || !supabase) return;

    const pollStart = Date.now();
    const poll = setInterval(async () => {
      if (Date.now() - pollStart > 10 * 60 * 1000) {
        clearInterval(poll);
        eventBus.emit('toast:message', { message: 'Match läuft zu lange. Klicke "Aufgeben & Verlassen" um das Match zu beenden.' });
        return;
      }
      try {
        const { data } = await supabase
          .from('matches')
          .select('status, player1_text, player2_text, player1_score, player2_score, winner_id, scoring_method')
          .eq('id', match.id)
          .single();

        if (!data) return;

        // Match completed with scores — show results directly
        if (data.status === 'completed' && data.player1_score != null) {
          logger.debug('Polling detected completed match with scores');
          clearInterval(poll);
          applyScoringResult(data);
          return;
        }

        // Both submitted but scoring not started yet — trigger it
        if (phase === 'waiting') {
          if (data.status === 'scoring' || data.status === 'completed') {
            logger.debug('Polling detected scoring/completed status');
            clearInterval(poll);
            performScoring();
          } else if (data.player1_text && data.player2_text && data.status === 'active') {
            logger.debug('Polling detected both texts submitted, triggering scoring');
            clearInterval(poll);
            performScoring();
          }
        }
      } catch (err) {
        logger.debug('Polling check failed:', err);
      }
    }, 3000);

    return () => clearInterval(poll);
  }, [phase, match?.id]);

  // Friend challenge
  const handleCreateChallenge = async () => {
    if (!user || challengeLoading) return;
    setChallengeLoading(true);
    try {
      const result = await createFriendChallenge(user.id);
      if (!result) return;
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
      subscribeToMatchIfNeeded(result.matchId, async (event) => {
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
    } catch (err) {
      logger.error('Create challenge failed:', err?.message || err);
      eventBus.emit('toast:message', { message: 'Fehler beim Erstellen der Herausforderung' });
    } finally {
      setChallengeLoading(false);
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
    // FIX 4 — Clean up match subscription before resetting
    clearActiveMatch();
    if (unsubMatchRef.current) { unsubMatchRef.current(); unsubMatchRef.current = null; }
    presenceRef.current?.destroy(); presenceRef.current = null;
    setOpponentDisconnected(false);
    setDisconnectCountdown(30);
    setPlayerResult(null);
    setOpponentScore(null);
    setPlayerScore(null);
    setEloChange(0);
    setWinner(null);
    setScoringMethod('ki');
    setOpponentStatus('writing');
    setMatch(null);
    setOpponent(null);
    setSubmitError(null);
    setWaitingLongHint(false);
    setScoringLongHint(false);
    mySubmittedRef.current = false;
    opponentSubmittedRef.current = false;
    // Re-enter matchmaking queue (creates a fresh match)
    setPhase('searching');
    setSearchElapsed(0);
    setEloRange(200);
    await handleQuickMatch();
  };

  const handleForfeitAndLeave = async () => {
    // Forfeit the match in DB so opponent gets the win
    if (match?.id && user?.id) {
      try {
        await forfeitMatch(match.id, user.id);
      } catch (err) {
        logger.error('Forfeit failed:', err);
      }
    }
    // Clean up everything and go back to menu
    clearActiveMatch();
    if (unsubMatchRef.current) { unsubMatchRef.current(); unsubMatchRef.current = null; }
    presenceRef.current?.destroy(); presenceRef.current = null;
    isScoringRef.current = false;
    setOpponentDisconnected(false);
    setDisconnectCountdown(30);
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
    setShowReconnectChoice(false);
    setSubmitError(null);
    setWaitingLongHint(false);
    setScoringLongHint(false);
    mySubmittedRef.current = false;
    opponentSubmittedRef.current = false;
  };

  const handleNewMatch = () => {
    // FIX 4 — Clean up match subscription before resetting
    clearActiveMatch();
    if (unsubMatchRef.current) { unsubMatchRef.current(); unsubMatchRef.current = null; }
    presenceRef.current?.destroy(); presenceRef.current = null;
    setOpponentDisconnected(false);
    setDisconnectCountdown(30);
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
    setSubmitError(null);
    setWaitingLongHint(false);
    setScoringLongHint(false);
    mySubmittedRef.current = false;
    opponentSubmittedRef.current = false;
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
    if (!user || challengeLoading) return;
    setChallengeLoading(true);
    try {
      const result = await createFriendChallenge(user.id);
      if (!result) {
        eventBus.emit('toast:message', { message: 'Fehler beim Erstellen der Herausforderung' });
        return;
      }
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
      subscribeToMatchIfNeeded(result.matchId, async (event) => {
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
    } catch (err) {
      logger.error('Challenge friend failed:', err?.message || err);
      eventBus.emit('toast:message', { message: 'Fehler beim Erstellen der Herausforderung' });
    } finally {
      setChallengeLoading(false);
    }
  };

  const handleRemoveFriend = async (friend) => {
    await removeFriend(friend.friendshipId);
    setFriends(prev => prev.filter(f => f.id !== friend.id));
    eventBus.emit('toast:message', { message: 'Freund entfernt' });
  };

  const handleAcceptRequest = async (friendshipId) => {
    await respondToRequest(friendshipId, user.id, true);
    eventBus.emit('toast:message', { message: 'Freundschaft angenommen!' });
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
    eventBus.emit('toast:message', { message: 'Anfrage abgelehnt' });
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

        {/* Reconnect choice dialog */}
        {showReconnectChoice && phase === 'menu' && (
          <Card className={styles.matchCard} style={{ textAlign: 'center', marginBottom: '1rem' }}>
            <OrnamentIcon name="tintenfass" size="lg" style={{ marginBottom: '0.75rem' }} />
            <h3 className={styles.cardTitle}>Laufendes Spiel gefunden</h3>
            <p className={styles.cardDesc}>Du hast ein aktives Match. Möchtest du weiterspielen?</p>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', justifyContent: 'center' }}>
              <Button variant="primary" onClick={handleResumeMatch}>
                Fortsetzen
              </Button>
              <Button variant="secondary" onClick={handleAbandonMatch}>
                Verlassen
              </Button>
            </div>
          </Card>
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
            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
              <Button variant="tertiary" onClick={handleForfeitAndLeave}>
                Aufgeben & Verlassen
              </Button>
            </div>
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
            {waitingLongHint && (
              <div role="status" aria-live="polite" style={{
                marginTop: '1rem',
                padding: '0.75rem 1rem',
                borderRadius: 8,
                background: 'rgba(218, 165, 32, 0.12)',
                border: '1px solid rgba(218, 165, 32, 0.4)',
                color: 'var(--text-primary, #eee)',
                fontSize: '0.9rem',
                maxWidth: 440,
              }}>
                Gegner schreibt noch… das kann bis zu 2–3 Minuten dauern.
              </div>
            )}
            <Button variant="tertiary" onClick={handleForfeitAndLeave} style={{ marginTop: '2rem' }}>
              Aufgeben & Verlassen
            </Button>
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
            {scoringLongHint && (
              <div role="status" aria-live="polite" style={{
                marginTop: '1rem',
                padding: '0.75rem 1rem',
                borderRadius: 8,
                background: 'rgba(218, 165, 32, 0.12)',
                border: '1px solid rgba(218, 165, 32, 0.4)',
                color: 'var(--text-primary, #eee)',
                fontSize: '0.9rem',
                maxWidth: 440,
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
              }}>
                <span>Scoring dauert länger als üblich…</span>
                <Button
                  variant="secondary"
                  onClick={() => { isScoringRef.current = false; performScoring(); }}
                >
                  Nochmal versuchen
                </Button>
              </div>
            )}
            <Button variant="tertiary" onClick={handleForfeitAndLeave} style={{ marginTop: '2rem' }}>
              Aufgeben & Verlassen
            </Button>
          </div>
        )}

        {/* ── RESULT: ERROR-CARD ── (submit failed, match ended mid-typing, etc.) */}
        {phase === 'result' && submitError && (
          <div className="animate-in">
            <Card ornate style={{ marginBottom: 16, textAlign: 'center' }}>
              <OrnamentIcon name="tintenfass" size="lg" style={{ marginBottom: '0.75rem' }} />
              <h2 className={styles.resultMainTitle} style={{ marginTop: 0 }}>
                {submitError.kind === 'match_ended' ? 'Match beendet'
                  : submitError.kind === 'network' ? 'Verbindungsproblem'
                  : 'Abgabe fehlgeschlagen'}
              </h2>
              <p className={styles.stateText} style={{ marginTop: '0.5rem' }}>
                {submitError.message}
              </p>
              <div className={styles.resultActions} style={{ marginTop: '1.5rem' }}>
                <Button variant="primary" onClick={handleNewMatch}>
                  Neues Match
                </Button>
                <Button variant="tertiary" onClick={() => onNavigate('home')}>
                  Zum Menü
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* ── RESULT ── */}
        {phase === 'result' && !submitError && (
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
