import storage from './storage.js';
import eventBus from './event-bus.js';

const STORAGE_KEY = 'story_progress';

const STATES = {
  IDLE: 'idle',
  CHAPTER_INTRO: 'chapter_intro',
  CHALLENGE: 'challenge',
  BOSS_FIGHT: 'boss_fight',
  DECISION: 'decision',
  CHAPTER_OUTRO: 'chapter_outro',
  GAME_OVER: 'game_over',
};

const ARCHETYPE_BONUSES = {
  dichter: { kreativitaet: 0.2, wortvielfalt: 0.1 },
  redner: { rhetorik: 0.15, argumentation: 0.1 },
  gelehrter: { wortschatz: 0.2, situationsbezug: 0.1 },
};

let state = {
  currentState: STATES.IDLE,
  currentChapter: 0,
  currentChallenge: 0,
  playerChoices: [],
  chapterScores: [],
  totalXP: 0,
  characterArchetype: null,
  currentHP: { player: 0, boss: 0 },
};

function createFreshState(archetype) {
  return {
    currentState: STATES.IDLE,
    currentChapter: 0,
    currentChallenge: 0,
    playerChoices: [],
    chapterScores: [],
    totalXP: 0,
    characterArchetype: archetype || null,
    currentHP: { player: 100, boss: 100 },
  };
}

export function initStory(archetype) {
  state = createFreshState(archetype);
  saveProgress();
  return state;
}

export function resumeStory() {
  const saved = storage.get(STORAGE_KEY, null);
  if (!saved) return null;
  state = saved;
  return state;
}

export function getStoryState() {
  return { ...state };
}

export function advanceState(action, data = {}) {
  switch (action) {
    case 'start_chapter':
      state.currentState = STATES.CHAPTER_INTRO;
      state.currentChallenge = 0;
      break;

    case 'start_challenge':
      state.currentState = STATES.CHALLENGE;
      break;

    case 'complete_challenge': {
      const score = data.score || 0;
      if (!state.chapterScores[state.currentChapter]) {
        state.chapterScores[state.currentChapter] = 0;
      }
      state.chapterScores[state.currentChapter] += score;
      state.totalXP += data.xp || 0;
      state.currentChallenge += 1;

      const maxChallenges = data.maxChallenges || 3;
      if (state.currentChallenge >= maxChallenges) {
        state.currentState = data.hasBoss !== false ? STATES.BOSS_FIGHT : STATES.CHAPTER_OUTRO;
      } else {
        state.currentState = STATES.CHALLENGE;
      }
      break;
    }

    case 'start_boss':
      state.currentState = STATES.BOSS_FIGHT;
      state.currentHP = { player: data.playerHP || 100, boss: data.bossHP || 100 };
      break;

    case 'complete_boss': {
      state.totalXP += data.xp || 0;
      if (data.score != null && state.chapterScores[state.currentChapter] != null) {
        state.chapterScores[state.currentChapter] += data.score;
      }
      state.currentState = data.hasDecision ? STATES.DECISION : STATES.CHAPTER_OUTRO;
      break;
    }

    case 'make_decision':
      if (data.choiceId != null) {
        state.playerChoices.push(data.choiceId);
      }
      if (data.isLastChapter) {
        state.currentState = STATES.GAME_OVER;
      } else {
        state.currentState = STATES.CHAPTER_OUTRO;
      }
      break;

    case 'next_chapter':
      state.currentChapter += 1;
      state.currentChallenge = 0;
      state.currentState = STATES.CHAPTER_INTRO;
      break;

    default:
      console.warn(`[story-engine] Unknown action: ${action}`);
      return state;
  }

  saveProgress();
  return { ...state };
}

export function saveProgress() {
  storage.set(STORAGE_KEY, state);
}

export function resetStory() {
  storage.remove(STORAGE_KEY);
  state = createFreshState(null);
}

export function getArchetypeBonus(archetype, category) {
  const bonuses = ARCHETYPE_BONUSES[archetype];
  if (!bonuses) return 1;
  return 1 + (bonuses[category] || 0);
}
