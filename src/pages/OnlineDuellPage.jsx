import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { supabase, isOnline } from '../lib/supabase.js';
import { joinQueue, leaveQueue } from '../engine/matchmaking.js';
import {
  subscribeToMatch,
  submitAnswer,
  submitScores,
  createFriendChallenge,
  joinFriendChallenge,
} from '../engine/online-game.js';
import { kiBewertung } from '../engine/scoring-engine.js';
import { calculateElo, getRankTitle } from '../engine/elo.js';
import eventBus from '../engine/event-bus.js';
import { SITUATIONEN } from '../data/situationen.js';
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

  // Result
  const [playerResult, setPlayerResult] = useState(null);
  const [opponentScore, setOpponentScore] = useState(null);
  const [playerScore, setPlayerScore] = useState(null);
  const [eloChange, setEloChange] = useState(0);
  const [winner, setWinner] = useState(null);

  // Friend challenge
  const [friendCode, setFriendCode] = useState('');
  const [friendCodeInput, setFriendCodeInput] = useState('');
  const [friendWaiting, setFriendWaiting] = useState(false);
  const [showCodeInput, setShowCodeInput] = useState(false);

  // Scoring
  const [scoringText, setScoringText] = useState('');

  const myElo = profile?.elo_rating || 1200;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (leaveQueueRef.current) leaveQueueRef.current();
      if (unsubMatchRef.current) unsubMatchRef.current();
    };
  }, []);

  // Search timer
  useEffect(() => {
    if (phase !== 'searching') return;
    const start = Date.now();
    const iv = setInterval(() => {
      const sec = Math.floor((Date.now() - start) / 1000);
      setSearchElapsed(sec);
      if (sec >= 30) setEloRange(400);
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
      // Fetch opponent profile
      const opponentId = m.player1_id === user?.id ? m.player2_id : m.player1_id;
      if (supabase && opponentId) {
        const { data } = await supabase
          .from('profiles')
          .select('username, avatar_url, elo_rating')
          .eq('id', opponentId)
          .single();
        setOpponent(data);
      }
      setSituation(getRandomSituation());
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
      const m = event.match;
      const isP1 = m.player1_id === user?.id;
      setPlayerScore(isP1 ? m.player1_score : m.player2_score);
      setOpponentScore(isP1 ? m.player2_score : m.player1_score);
      setWinner(m.winner_id === user?.id ? 'player' : m.winner_id ? 'opponent' : 'draw');
      setPhase('result');
    }
    if (event.type === 'opponent_disconnected') {
      setWinner('player');
      setPhase('result');
    }
  }, [user]);

  const handleWritingSubmit = async (text) => {
    if (!match || !user) return;
    setScoringText(text);
    await submitAnswer(match.id, user.id, text);

    // Check if opponent already submitted
    if (opponentStatus === 'submitted') {
      setPhase('scoring');
      await performScoring(text);
    } else {
      setPhase('waiting');
    }
  };

  const performScoring = async (text) => {
    setPhase('scoring');
    try {
      // Score the player's text with KI (or heuristic fallback)
      const result = await kiBewertung(situation, text || scoringText);
      setPlayerResult(result);
      const pScore = Object.values(result.kategorien || {}).reduce((s, v) => s + (v.p || 0), 0);
      setPlayerScore(pScore);

      // Try to get opponent's text from DB and score it too
      let oScore;
      if (match?.id) {
        const { data: matchData } = await supabase
          .from('matches')
          .select('player1_id, player1_text, player2_text')
          .eq('id', match.id)
          .single();
        const opponentText = matchData?.player1_id === user?.id
          ? matchData?.player2_text
          : matchData?.player1_text;
        if (opponentText) {
          const opResult = await kiBewertung(situation, opponentText);
          oScore = Object.values(opResult.kategorien || {}).reduce((s, v) => s + (v.p || 0), 0);
        }
      }
      // Fallback if opponent text unavailable
      if (oScore == null) {
        oScore = Math.round(pScore * (0.7 + Math.random() * 0.6));
        oScore = Math.min(oScore, 100);
      }
      setOpponentScore(oScore);

      // Calculate Elo
      const opElo = opponent?.elo_rating || 1200;
      const { change } = calculateElo(myElo, opElo, pScore, oScore, profile?.total_games || 0);
      setEloChange(change);

      // Determine winner
      if (pScore > oScore) setWinner('player');
      else if (oScore > pScore) setWinner('opponent');
      else setWinner('draw');

      // Update profile
      const isWin = pScore > oScore;
      await updateProfile({
        elo_rating: myElo + change,
        wins: (profile?.wins || 0) + (isWin ? 1 : 0),
        losses: (profile?.losses || 0) + (!isWin && pScore !== oScore ? 1 : 0),
        total_games: (profile?.total_games || 0) + 1,
      });

      setPhase('result');
    } catch (e) {
      console.error('Scoring failed:', e);
      setPhase('result');
    }
  };

  // When waiting and opponent submits, trigger scoring
  useEffect(() => {
    if (phase === 'waiting' && opponentStatus === 'submitted') {
      performScoring(scoringText);
    }
  }, [phase, opponentStatus]);

  // Friend challenge
  const handleCreateChallenge = async () => {
    if (!user) return;
    const result = await createFriendChallenge(user.id);
    if (result) {
      setFriendCode(result.code);
      setMatch({ id: result.matchId });
      setFriendWaiting(true);
      setSituation(getRandomSituation());

      // Subscribe to match for when friend joins
      const unsub = subscribeToMatch(result.matchId, async (event) => {
        if (event.type === 'friend_joined') {
          const m = event.match;
          const opponentId = m.player1_id === user?.id ? m.player2_id : m.player1_id;
          if (supabase && opponentId) {
            const { data } = await supabase
              .from('profiles')
              .select('username, avatar_url, elo_rating')
              .eq('id', opponentId)
              .single();
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

  const handleJoinChallenge = async () => {
    if (!user || !friendCodeInput.trim()) return;
    setJoinError('');
    const m = await joinFriendChallenge(friendCodeInput.trim().toUpperCase(), user.id);
    if (m) {
      setMatch(m);
      setSituation(getRandomSituation());
      const opponentId = m.player1_id === user.id ? m.player2_id : m.player1_id;
      if (supabase && opponentId) {
        const { data } = await supabase
          .from('profiles')
          .select('username, avatar_url, elo_rating')
          .eq('id', opponentId)
          .single();
        setOpponent(data);
      }
      setPhase('matched');
    } else {
      setJoinError('Code ungültig oder Spiel nicht mehr verfügbar.');
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

  const handleRematch = () => {
    setPhase('searching');
    setSearchElapsed(0);
    setEloRange(200);
    setPlayerResult(null);
    setOpponentScore(null);
    setPlayerScore(null);
    setEloChange(0);
    setWinner(null);
    setOpponentStatus('writing');
    setMatch(null);
    setOpponent(null);
    handleQuickMatch();
  };

  const handleNewMatch = () => {
    setPhase('menu');
    setPlayerResult(null);
    setOpponentScore(null);
    setPlayerScore(null);
    setEloChange(0);
    setWinner(null);
    setOpponentStatus('writing');
    setMatch(null);
    setOpponent(null);
    setFriendCode('');
    setFriendCodeInput('');
    setFriendWaiting(false);
    setShowCodeInput(false);
  };

  // Not online
  if (!isOnline()) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={`${styles.stateWrap} animate-in`}>
            <OrnamentIcon name="tintenfass" size="xl" className={styles.stateIcon} />
            <h2 className={styles.stateTitle}>Online-Modus nicht verfügbar</h2>
            <p className={styles.stateText}>
              Die Verbindung zum Server konnte nicht hergestellt werden.
              Prüfe deine Internetverbindung oder versuche es später erneut.
            </p>
            <Button variant="secondary" onClick={() => onNavigate('home')}>
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

  return (
    <div className={styles.page}>
      <div className={styles.container}>

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
                    className={styles.codeInput}
                  />
                  <Button
                    variant="primary"
                    size="md"
                    onClick={handleJoinChallenge}
                    disabled={friendCodeInput.length < 6}
                    className={styles.fullWidth}
                  >
                    Beitreten
                  </Button>
                  {joinError && <p className={styles.joinError}>{joinError}</p>}
                </div>
              )}
            </Card>

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
                  <Button variant="secondary" onClick={() => { setFriendWaiting(false); setFriendCode(''); }}>
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
                <span className={styles.searchRange}>Elo: {myElo - eloRange} – {myElo + eloRange}</span>
              </div>
              {searchElapsed >= 30 && (
                <p className={styles.searchExpanded}>Suchbereich erweitert</p>
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
    </div>
  );
}
