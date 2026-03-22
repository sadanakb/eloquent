import { useState, useEffect, useCallback } from 'react';
import { initStory, resumeStory, getStoryState, advanceState, resetStory, getArchetypeBonus } from '../engine/story-engine.js';
import { addXP, getXP } from '../engine/xp-system.js';
import { STORY_CHAPTERS, ARCHETYPES, STORY_ENDINGS } from '../data/story-data.js';
import eventBus from '../engine/event-bus.js';
import { checkAchievements } from '../engine/achievements.js';
import { MultipleChoiceChallenge } from '../components/story/MultipleChoiceChallenge.jsx';
import { FreeTextChallenge } from '../components/story/FreeTextChallenge.jsx';
import { WordOrderChallenge } from '../components/story/WordOrderChallenge.jsx';
import { FillBlankChallenge } from '../components/story/FillBlankChallenge.jsx';
import { BossFight } from '../components/story/BossFight.jsx';
import { StoryDecision } from '../components/story/StoryDecision.jsx';
import { CharacterSelect } from '../components/story/CharacterSelect.jsx';
import { Card } from '../components/Card.jsx';
import { Badge } from '../components/Badge.jsx';
import { Button } from '../components/Button.jsx';
import { OrnamentIcon, OrnamentDivider } from '../components/Ornament.jsx';
import { GoldBar } from '../components/GoldBar.jsx';
import { Confetti } from '../components/Confetti.jsx';
import { useTypewriter } from '../hooks/useTypewriter.js';
import styles from './StoryPage.module.css';

const ARCHETYPE_ICONS = { dichter: 'feder', redner: 'federn', gelehrter: 'buch' };
const XP_PER_CHALLENGE = 15;
const XP_PER_BOSS = 40;
const TOTAL_CHAPTERS = STORY_CHAPTERS.length;

function determineEnding(choices) {
  for (const ending of STORY_ENDINGS) {
    if (ending.requiredFlags.length === 0) continue;
    if (ending.requiredFlags.every(flag => choices.includes(flag))) return ending;
  }
  return STORY_ENDINGS.find(e => e.id === 'default') || STORY_ENDINGS[STORY_ENDINGS.length - 1];
}

export function StoryPage({ onNavigate }) {
  const [gameState, setGameState] = useState(null);
  const [phase, setPhase] = useState('loading');
  const [chapterXP, setChapterXP] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);

  // Derived state
  const chapter = gameState ? STORY_CHAPTERS[gameState.currentChapter] : null;
  const challengeIdx = gameState ? gameState.currentChallenge : 0;
  const challenge = chapter?.challenges?.[challengeIdx] || null;
  const xpData = getXP();
  const xpProgress = xpData.level > 0 ? (xpData.xp / xpData.nextLevelXP) : 0;

  // Loading / resume
  useEffect(() => {
    const saved = resumeStory();
    if (saved && saved.characterArchetype) {
      setGameState(saved);
      const st = saved.currentState;
      if (st === 'chapter_intro') setPhase('chapter_intro');
      else if (st === 'challenge') setPhase('challenge');
      else if (st === 'boss_fight') setPhase('boss_fight');
      else if (st === 'decision') setPhase('decision');
      else if (st === 'chapter_outro') setPhase('chapter_outro');
      else if (st === 'game_over') setPhase('ending');
      else setPhase('story_intro');
    } else {
      setPhase('select_character');
    }
  }, []);

  // Character selection
  const handleCharacterSelect = useCallback((archetype) => {
    const state = initStory(archetype);
    setGameState(state);
    setPhase('story_intro');
  }, []);

  // Start first chapter
  const startAdventure = useCallback(() => {
    const state = advanceState('start_chapter');
    setGameState(state);
    setPhase('chapter_intro');
  }, []);

  // Begin challenges for current chapter
  const acceptChallenge = useCallback(() => {
    const state = advanceState('start_challenge');
    setGameState(state);
    setPhase('challenge');
  }, []);

  // Challenge complete handler
  // Components call onComplete(score, isCorrect) with 2 positional args
  const handleChallengeComplete = useCallback((score, correct) => {
    const finalScore = score || 0;
    const xp = correct ? XP_PER_CHALLENGE : Math.floor(XP_PER_CHALLENGE * 0.3);

    if (correct) {
      eventBus.emit('sound:play', { sound: 'success' });
    } else {
      eventBus.emit('sound:play', { sound: 'error' });
    }

    addXP(xp, 'story_challenge');
    setChapterXP(prev => prev + xp);

    const hasBoss = !!chapter?.boss;
    const state = advanceState('complete_challenge', {
      score: finalScore,
      xp,
      maxChallenges: chapter?.challenges?.length || 3,
      hasBoss,
    });
    setGameState(state);

    // Auto-advance after short delay
    setTimeout(() => {
      if (state.currentState === 'boss_fight' && chapter?.boss) {
        setPhase('boss_fight');
      } else if (state.currentState === 'chapter_outro') {
        if (chapter?.decision) {
          setPhase('decision');
        } else {
          setPhase('chapter_outro');
        }
      } else {
        setPhase('challenge');
      }
    }, 1800);
  }, [chapter]);

  // Boss fight complete
  // BossFight calls onComplete(won, playerScore) with 2 positional args
  const handleBossComplete = useCallback((won, bossScore) => {
    const xp = won ? XP_PER_BOSS : Math.floor(XP_PER_BOSS * 0.2);
    addXP(xp, 'story_boss');
    setChapterXP(prev => prev + xp);
    eventBus.emit('sound:play', { sound: won ? 'success' : 'error' });

    const hasDecision = !!chapter?.decision;
    const state = advanceState('complete_boss', { xp, score: bossScore || 0, hasDecision });
    setGameState(state);

    if (hasDecision) setPhase('decision');
    else setPhase('chapter_outro');
  }, [chapter]);

  // Decision made
  const handleDecision = useCallback((choice) => {
    const isLastChapter = gameState.currentChapter >= TOTAL_CHAPTERS - 1;
    const state = advanceState('make_decision', { choiceId: choice.storyFlag, isLastChapter });
    setGameState(state);
    if (isLastChapter) setPhase('ending');
    else setPhase('chapter_outro');
  }, [gameState]);

  // Next chapter
  const nextChapter = useCallback(() => {
    checkAchievements('story_chapter', {
      chapter: gameState.currentChapter + 1,
      totalChapters: TOTAL_CHAPTERS,
      punkte: gameState.chapterScores[gameState.currentChapter] || 0,
      storyComplete: gameState.currentChapter >= TOTAL_CHAPTERS - 1,
    });

    if (gameState.currentChapter >= TOTAL_CHAPTERS - 1) {
      setPhase('ending');
      return;
    }

    setChapterXP(0);
    const state = advanceState('next_chapter');
    setGameState(state);
    setPhase('chapter_intro');
  }, [gameState]);

  // Restart game
  const restartGame = useCallback(() => {
    resetStory();
    setGameState(null);
    setChapterXP(0);
    setShowConfetti(false);
    setPhase('select_character');
  }, []);

  // Show confetti for ending
  useEffect(() => {
    if (phase === 'ending') setShowConfetti(true);
  }, [phase]);

  // Render challenge component by type
  const renderChallenge = () => {
    if (!challenge) return null;
    const typ = challenge.typ;
    const props = { challenge, onComplete: handleChallengeComplete };

    if (typ === 'free_text') return <FreeTextChallenge {...props} />;
    if (typ === 'word_order') return <WordOrderChallenge {...props} />;
    if (typ === 'fill_blank') return <FillBlankChallenge {...props} />;
    // multiple_choice and all legacy types (wort_wahl, luecke, synonym, bedeutung, gegenteil, stilmittel, satz_bauen, klimax, meister)
    return <MultipleChoiceChallenge {...props} />;
  };

  // Determine ending
  const ending = gameState ? determineEnding(gameState.playerChoices) : null;

  // Typewriter for intro
  const { displayText: introText } = useTypewriter(
    phase === 'story_intro'
      ? 'In den nebelverhangenen Gassen einer vergessenen Stadt liegt die Akademie der Eloquenz verborgen. Einst der Hort der größten Redner, Dichter und Gelehrten, schweigt sie nun seit Jahrzehnten. Doch heute Nacht flackern die Laternen wieder auf — denn ein neuer Adept hat den Ruf vernommen…'
      : '',
    35
  );

  return (
    <div className={styles.wrapper}>
      <Confetti active={showConfetti} />

      {/* Top Bar — visible during play */}
      {gameState && phase !== 'select_character' && phase !== 'loading' && (
        <div className={styles.topBar}>
          <span className={styles.chapterProgress}>
            Kapitel {(gameState.currentChapter || 0) + 1}/{TOTAL_CHAPTERS}
          </span>
          <div className={styles.xpBar}>
            <GoldBar value={xpProgress} max={1} />
          </div>
          <div className={styles.characterPortrait}>
            <OrnamentIcon name={ARCHETYPE_ICONS[gameState.characterArchetype] || 'buchOffen'} size="sm" />
          </div>
          <span className={styles.points}>{gameState.totalXP || 0} XP</span>
        </div>
      )}

      {/* LOADING */}
      {phase === 'loading' && (
        <div className="animate-in" style={{ textAlign: 'center', padding: '64px 0' }}>
          <OrnamentIcon name="buchOffen" size="xl" />
          <p style={{ color: 'var(--text-muted)', marginTop: 16 }}>Lade Geschichte...</p>
        </div>
      )}

      {/* CHARACTER SELECT */}
      {phase === 'select_character' && (
        <div className="animate-in">
          <CharacterSelect archetypes={ARCHETYPES} onSelect={handleCharacterSelect} />
        </div>
      )}

      {/* STORY INTRO */}
      {phase === 'story_intro' && (
        <div className={`${styles.storyIntro} animate-in`}>
          <OrnamentIcon name="buchOffen" size="xl" style={{ marginBottom: 16 }} />
          <h1 className={styles.introTitle}>Die Akademie der Eloquenz</h1>
          <OrnamentDivider />
          <Card>
            <p className={`${styles.introText} drop-cap`}>{introText}</p>
          </Card>
          <div style={{ marginTop: 28 }}>
            <Button variant="gold" onClick={startAdventure}>Abenteuer beginnen →</Button>
          </div>
        </div>
      )}

      {/* CHAPTER INTRO */}
      {phase === 'chapter_intro' && chapter && (
        <div className="animate-in">
          <div className={styles.chapterHeader}>
            <div className={styles.chapterOverline}>Kapitel {chapter.id} von {TOTAL_CHAPTERS}</div>
            <h2 className={styles.kapitelTitle}>{chapter.titel}</h2>
            <div className={styles.progressDots}>
              {chapter.challenges && chapter.challenges.map((_, i) => (
                <span key={i} className={i < challengeIdx ? styles.dotFilled : styles.dotEmpty} />
              ))}
            </div>
          </div>
          <Card>
            {chapter.szene && <p className={styles.settingLabel}>{chapter.szene}</p>}
            <blockquote className={styles.dialog}>{chapter.dialog}</blockquote>
          </Card>
          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <Button variant="gold" onClick={acceptChallenge}>Prüfung annehmen →</Button>
          </div>
        </div>
      )}

      {/* CHALLENGE */}
      {phase === 'challenge' && challenge && (
        <div className="animate-in">
          <div className={styles.challengeBar}>
            <Badge>Prüfung {challengeIdx + 1}/{chapter.challenges.length}</Badge>
            <Badge>Kapitel {chapter.id}</Badge>
          </div>
          {renderChallenge()}
        </div>
      )}

      {/* BOSS FIGHT */}
      {phase === 'boss_fight' && chapter?.boss && (
        <div className="animate-in">
          <BossFight boss={chapter.boss} archetype={gameState.characterArchetype} onComplete={handleBossComplete} />
        </div>
      )}

      {/* DECISION */}
      {phase === 'decision' && chapter?.decision && (
        <div className="animate-in">
          <StoryDecision decision={chapter.decision} onChoose={handleDecision} />
        </div>
      )}

      {/* CHAPTER OUTRO */}
      {phase === 'chapter_outro' && chapter && (
        <div className="animate-in">
          <h2 className={styles.outroTitle}>{chapter.titel} — Abschluss</h2>
          <Card>
            <p className={styles.outroText}>{chapter.outro}</p>
          </Card>
          <Card style={{ maxWidth: 400, margin: '20px auto', textAlign: 'center' }}>
            <div className={styles.statGrid}>
              <div className={styles.statBox}>
                <div className={styles.statNumGold}>{gameState.chapterScores[gameState.currentChapter] || 0}</div>
                <div className={styles.statLabel}>Kapitel-Punkte</div>
              </div>
              <div className={styles.statBox}>
                <div className={styles.statNumGreen}>+{chapterXP}</div>
                <div className={styles.statLabel}>XP erhalten</div>
              </div>
            </div>
          </Card>
          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <Button variant="gold" onClick={nextChapter}>
              {gameState.currentChapter < TOTAL_CHAPTERS - 1
                ? `Nächstes Kapitel →`
                : 'Zum Abschluss →'}
            </Button>
          </div>
        </div>
      )}

      {/* ENDING */}
      {phase === 'ending' && ending && (
        <div className={`${styles.endingSection} animate-in`}>
          <OrnamentIcon name="lorbeer" size="xl" style={{ marginBottom: 16 }} />
          <h1 className={styles.endeTitle}>{ending.titel}</h1>
          <OrnamentDivider />
          <Card glow ornate style={{ maxWidth: 520, margin: '0 auto 24px' }}>
            <p className={styles.outroText}>{ending.text}</p>
          </Card>

          <Card glow style={{ maxWidth: 400, margin: '0 auto 24px' }}>
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div className={styles.endScore}>{gameState.totalXP}</div>
              <div className={styles.endScoreLabel}>Gesamt-XP</div>
              <div className={styles.statGrid}>
                <div className={styles.statBox}>
                  <div className={styles.statNumGold}>
                    {gameState.chapterScores.reduce((a, b) => a + b, 0)}
                  </div>
                  <div className={styles.statLabel}>Gesamtpunkte</div>
                </div>
                <div className={styles.statBox}>
                  <div className={styles.statNumGreen}>{TOTAL_CHAPTERS}</div>
                  <div className={styles.statLabel}>Kapitel gemeistert</div>
                </div>
              </div>
            </div>
          </Card>

          <div className={styles.finalActions}>
            <Button variant="gold" onClick={restartGame}>Nochmal spielen</Button>
            <Button variant="ghost" onClick={() => onNavigate('home')}>Zum Menü</Button>
          </div>
        </div>
      )}

      {/* GAME OVER (failure fallback) */}
      {phase === 'game_over' && (
        <div className="animate-in" style={{ textAlign: 'center' }}>
          <h2 className={styles.endeTitle}>Spiel beendet</h2>
          <div className={styles.finalActions}>
            <Button variant="gold" onClick={restartGame}>Nochmal spielen</Button>
            <Button variant="ghost" onClick={() => onNavigate('home')}>Zum Menü</Button>
          </div>
        </div>
      )}
    </div>
  );
}
