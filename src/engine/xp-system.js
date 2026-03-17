import storage from './storage.js';
import eventBus from './event-bus.js';

const STORAGE_KEY = 'xp_data';

const LEVEL_THRESHOLDS = [0, 100, 250, 500, 800, 1200, 1700, 2300, 3000, 3800, 5000];

const LEVEL_NAMES = [
  'Novize',
  'Lehrling',
  'Geselle',
  'Adept',
  'Meister',
  'Großmeister',
  'Virtuose',
  'Legende',
  'Koryphäe',
  'Unsterblich',
  'Eloquent',
];

const LEVEL_BONUSES = {
  2: { extraTime: 10 },
  4: { wordHints: 2 },
  6: { extraTime: 20 },
  8: { bonusXP: 0.1 },
};

function loadData() {
  return storage.get(STORAGE_KEY, { totalXP: 0, history: [] });
}

function saveData(data) {
  storage.set(STORAGE_KEY, data);
}

export function getLevelForXP(xp) {
  let level = 0;
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) {
      level = i;
      break;
    }
  }
  return level;
}

export function addXP(amount, source) {
  const data = loadData();
  const oldLevel = getLevelForXP(data.totalXP);

  data.totalXP += amount;
  data.history.push({
    amount,
    source: source || 'unknown',
    date: new Date().toISOString(),
  });

  saveData(data);

  eventBus.emit('score:gained', { amount, source, totalXP: data.totalXP });

  const newLevel = getLevelForXP(data.totalXP);
  if (newLevel > oldLevel) {
    eventBus.emit('level:up', {
      level: newLevel,
      levelName: LEVEL_NAMES[newLevel] || LEVEL_NAMES[LEVEL_NAMES.length - 1],
      totalXP: data.totalXP,
    });
  }

  return data.totalXP;
}

export function getXP() {
  const data = loadData();
  const level = getLevelForXP(data.totalXP);
  const currentThreshold = LEVEL_THRESHOLDS[level] || 0;
  const nextThreshold = LEVEL_THRESHOLDS[level + 1] || LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
  const xpIntoLevel = data.totalXP - currentThreshold;
  const xpNeeded = nextThreshold - currentThreshold;

  return {
    totalXP: data.totalXP,
    level,
    levelName: LEVEL_NAMES[level] || LEVEL_NAMES[LEVEL_NAMES.length - 1],
    xpForNextLevel: nextThreshold - data.totalXP,
    xpProgress: xpNeeded > 0 ? Math.min(xpIntoLevel / xpNeeded, 1) : 1,
  };
}

export function getLevelBonuses(level) {
  const bonuses = {};
  for (const [lvl, bonus] of Object.entries(LEVEL_BONUSES)) {
    if (level >= Number(lvl)) {
      Object.assign(bonuses, bonus);
    }
  }
  return bonuses;
}

export function resetXP() {
  storage.remove(STORAGE_KEY);
}
