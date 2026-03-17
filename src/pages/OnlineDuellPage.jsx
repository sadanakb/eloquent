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
import styles from './OnlineDuellPage.module.css';

function getRandomSituation() {
  const pool = SITUATIONEN.mittel || SITUATIONEN.leicht || [];
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
          .select('username, avatar, elo_rating')
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
      const unsub = subscribeToMatch(result.matchId, (event) => {
        if (event.type === 'opponent_submitted' || event.match?.player2_id) {
          setPhase('matched');
        }
        handleMatchEvent(event);
      });
      unsubMatchRef.current = unsub;
    }
  };

  const handleJoinChallenge = async () => {
    if (!user || !friendCodeInput.trim()) return;
    const m = await joinFriendChallenge(friendCodeInput.trim().toUpperCase(), user.id);
    if (m) {
      setMatch(m);
      setSituation(getRandomSituation());
      const opponentId = m.player1_id === user.id ? m.player2_id : m.player1_id;
      if (supabase && opponentId) {
        const { data } = await supabase
          .from('profiles')
          .select('username, avatar, elo_rating')
          .eq('id', opponentId)
          .single();
        setOpponent(data);
      }
      setPhase('matched');
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
      <div className={styles.wrapper}>
        <div className={`${styles.offlineMsg} animate-in`}>
          <OrnamentIcon name="tintenfass" size="xl" className={styles.offlineIcon} />
          <h2 className={styles.offlineTitle}>Online-Modus nicht verfügbar</h2>
          <p className={styles.offlineText}>
            Die Verbindung zum Server konnte nicht hergestellt werden.
            Prüfe deine Internetverbindung oder versuche es später erneut.
          </p>
          <Button variant="ghost" onClick={() => onNavigate('home')}>
            Zurück zum Menü
          </Button>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!isLoading && !isAuthenticated) {
    return (
      <div className={styles.wrapper}>
        <div className={`${styles.offlineMsg} animate-in`}>
          <OrnamentIcon name="federn" size="xl" className={styles.offlineIcon} />
          <h2 className={styles.offlineTitle}>Anmeldung erforderlich</h2>
          <p className={styles.offlineText}>
            Um Online-Duelle zu spielen, musst du dich zuerst anmelden.
          </p>
          <Button variant="gold" onClick={() => setShowAuth(true)}>
            Anmelden
          </Button>
        </div>
        {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      {/* ── MENU ── */}
      {phase === 'menu' && (
        <div className="animate-in">
          <div className={styles.header}>
            <h1 className={styles.title}>
              <OrnamentIcon name="federn" size="md" style={{ marginRight: 8, verticalAlign: 'text-bottom' }} />
              Online-Duell
            </h1>
            <p className={styles.subtitle}>Miss dich mit Eloquenz-Meistern aus aller Welt</p>
          </div>

          <div className={styles.menuOptions}>
            <Card className={styles.menuCard}>
              <div className={styles.menuCardInner}>
                <OrnamentIcon name="lorbeer" size="lg" />
                <h3 className={styles.menuCardTitle}>Quick Match</h3>
                <p className={styles.menuCardDesc}>
                  Tritt gegen einen Gegner in deiner Elo-Klasse an
                </p>
                <Button variant="gold" onClick={handleQuickMatch}>
                  Gegner suchen
                </Button>
              </div>
            </Card>

            <Card className={styles.menuCard}>
              <div className={styles.menuCardInner}>
                <OrnamentIcon name="buchOffen" size="lg" />
                <h3 className={styles.menuCardTitle}>Freund herausfordern</h3>
                <p className={styles.menuCardDesc}>
                  Erstelle einen Code und teile ihn mit einem Freund
                </p>
                <Button variant="accent" onClick={handleCreateChallenge}>
                  Code erstellen
                </Button>
              </div>
            </Card>

            {!showCodeInput ? (
              <button className={styles.codeToggle} onClick={() => setShowCodeInput(true)}>
                Code eingeben
              </button>
            ) : (
              <Card>
                <div className={styles.codeInputWrap}>
                  <input
                    type="text"
                    value={friendCodeInput}
                    onChange={e => setFriendCodeInput(e.target.value.toUpperCase())}
                    placeholder="ABC123"
                    className={styles.codeInput}
                    maxLength={6}
                  />
                  <Button variant="gold" onClick={handleJoinChallenge} disabled={friendCodeInput.length < 6}>
                    Beitreten
                  </Button>
                </div>
              </Card>
            )}
          </div>

          {/* Friend waiting state */}
          {friendWaiting && (
            <Card glow style={{ marginTop: 16, textAlign: 'center' }}>
              <h3 className={styles.friendCodeTitle}>Dein Einladungs-Code</h3>
              <div className={styles.friendCodeDisplay}>{friendCode}</div>
              <p className={styles.friendCodeHint}>Teile diesen Code mit deinem Mitspieler</p>
              <div className={styles.friendCodeActions}>
                <Button variant="gold" onClick={handleShare}>
                  Teilen
                </Button>
                <Button variant="ghost" onClick={() => { setFriendWaiting(false); setFriendCode(''); }}>
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
          <div className={styles.searchingPulse}>
            <OrnamentIcon name="ziel" size="xl" />
          </div>
          <h2 className={styles.searchingTitle}>Suche Gegner...</h2>
          <p className={styles.searchingTime}>{searchElapsed}s</p>
          <div className={styles.searchingRange}>
            Elo-Bereich: {myElo - eloRange} – {myElo + eloRange}
          </div>
          {searchElapsed >= 30 && (
            <p className={styles.searchingExpanded}>Suchbereich erweitert</p>
          )}
          <Button variant="ghost" onClick={handleCancelSearch} style={{ marginTop: 24 }}>
            Abbrechen
          </Button>
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
          <Button variant="gold" onClick={startWriting}>
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
        <div className={`${styles.waitingWrap} animate-in`}>
          <OrnamentIcon name="tintenfass" size="xl" />
          <h2 className={styles.waitingTitle}>Warte auf Gegner...</h2>
          <p className={styles.waitingText}>
            Du hast deine Antwort abgegeben. Warte, bis dein Gegner fertig ist.
          </p>
        </div>
      )}

      {/* ── SCORING ── */}
      {phase === 'scoring' && (
        <div className={`${styles.scoringWrap} animate-in`}>
          <div className={styles.scoringPulse}>
            <OrnamentIcon name="tintenfass" size="xl" />
          </div>
          <h2 className={styles.scoringTitle}>KI bewertet beide Antworten...</h2>
          <p className={styles.scoringText}>Die Eloquenz wird analysiert</p>
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
            <Button variant="gold" onClick={handleRematch}>
              Rematch
            </Button>
            <Button variant="ghost" onClick={handleNewMatch}>
              Neues Match
            </Button>
            <Button variant="ghost" onClick={() => onNavigate('home')}>
              Zum Menü
            </Button>
          </div>
        </div>
      )}

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </div>
  );
}
