import storage from './storage.js';
import eventBus from './event-bus.js';
import { SITUATIONEN } from '../data/situationen.js';
import { WOERTERBUCH } from '../data/woerterbuch.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function todayString() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function getDailyChallenge() {
  const date = todayString();
  const seed = hashString(date);
  const pool = SITUATIONEN.mittel;
  const index = seed % pool.length;
  return { situation: pool[index], date };
}

export function getWortDesTages() {
  const date = todayString();
  const seed = hashString(date) + 7;
  const index = seed % WOERTERBUCH.length;
  return WOERTERBUCH[index];
}

export function completeDailyChallenge(score) {
  const date = todayString();

  // Persist to daily history
  const history = storage.get('daily_history', {});
  history[date] = { score, completedAt: new Date().toISOString() };
  storage.set('daily_history', history);

  // Calculate streak
  const lastDate = storage.get('daily_last_date', null);
  let streak = 1;

  if (lastDate) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yyyymmdd = yesterday.toISOString().slice(0, 10);
    if (lastDate === yyyymmdd) {
      streak = storage.get('daily_streak', 0) + 1;
    }
  }

  storage.set('daily_streak', streak);
  storage.set('daily_last_date', date);

  // Track best streak
  const best = storage.get('daily_best_streak', 0);
  if (streak > best) {
    storage.set('daily_best_streak', streak);
  }

  eventBus.emit('daily:completed', { score, streak });
}

export function getDailyStatus() {
  const date = todayString();
  const history = storage.get('daily_history', {});
  const entry = history[date];
  return {
    completed: !!entry,
    score: entry ? entry.score : null,
    streak: storage.get('daily_streak', 0),
    bestStreak: storage.get('daily_best_streak', 0),
  };
}

export function getDailyStreak() {
  return storage.get('daily_streak', 0);
}
