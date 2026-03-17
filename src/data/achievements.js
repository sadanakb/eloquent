/**
 * ELOQUENT — Achievement-Definitionen
 * 30+ Erfolge in 8 Kategorien
 */

export const ACHIEVEMENT_CATEGORIES = [
  'Alle',
  'Erste Schritte',
  'Wortschatz',
  'Serien',
  'Meisterschaft',
  'Story',
  'Tägliche Herausforderung',
  'Rhetorik',
  'Vielseitigkeit',
  'Meilensteine',
];

export const ACHIEVEMENTS = [
  // ── Erste Schritte ──
  {
    id: 'first_duell',
    name: 'Erste Feder',
    description: 'Dein erstes Duell bestritten',
    icon: 'federn',
    category: 'Erste Schritte',
    condition: stats => stats.total_duells >= 1,
  },
  {
    id: 'first_uebung',
    name: 'Lehrling',
    description: 'Erste Übung abgeschlossen',
    icon: 'buch',
    category: 'Erste Schritte',
    condition: stats => stats.total_uebungen >= 1,
  },
  {
    id: 'first_story',
    name: 'Geschichtenerzähler',
    description: 'Story-Modus gestartet',
    icon: 'buchOffen',
    category: 'Erste Schritte',
    condition: stats => stats.story_chapters_completed >= 1,
  },

  // ── Wortschatz ──
  {
    id: 'words_10',
    name: 'Wortsammler',
    description: '10 gehobene Wörter verwendet',
    icon: 'tintenfass',
    category: 'Wortschatz',
    condition: stats => stats.gehobene_count >= 10,
  },
  {
    id: 'words_50',
    name: 'Wortschmied',
    description: '50 gehobene Wörter verwendet',
    icon: 'tintenfass',
    category: 'Wortschatz',
    condition: stats => stats.gehobene_count >= 50,
  },
  {
    id: 'words_100',
    name: 'Wortvirtuose',
    description: '100 gehobene Wörter verwendet',
    icon: 'tintenfass',
    category: 'Wortschatz',
    condition: stats => stats.gehobene_count >= 100,
  },

  // ── Serien ──
  {
    id: 'streak_3',
    name: 'Aufwärmphase',
    description: '3 Spiele in Folge',
    icon: 'ziel',
    category: 'Serien',
    condition: stats => stats.current_streak >= 3,
  },
  {
    id: 'streak_5',
    name: 'Unaufhaltsam',
    description: '5 Spiele in Folge',
    icon: 'ziel',
    category: 'Serien',
    condition: stats => stats.current_streak >= 5,
  },
  {
    id: 'streak_10',
    name: 'Marathonredner',
    description: '10 Spiele in Folge',
    icon: 'ziel',
    category: 'Serien',
    condition: stats => stats.current_streak >= 10,
  },

  // ── Meisterschaft ──
  {
    id: 'score_60',
    name: 'Vielversprechend',
    description: '60+ Punkte erreicht',
    icon: 'stern',
    category: 'Meisterschaft',
    condition: stats => stats.best_score >= 60,
  },
  {
    id: 'score_80',
    name: 'Eloquent',
    description: '80+ Punkte erreicht',
    icon: 'stern',
    category: 'Meisterschaft',
    condition: stats => stats.best_score >= 80,
  },
  {
    id: 'score_95',
    name: 'Meisterredner',
    description: '95+ Punkte erreicht',
    icon: 'lorbeer',
    category: 'Meisterschaft',
    condition: stats => stats.best_score >= 95,
  },
  {
    id: 'perfect_category',
    name: 'Perfektionist',
    description: 'Volle Punkte in einer Kategorie',
    icon: 'stern',
    category: 'Meisterschaft',
    condition: stats => stats.perfect_categories >= 1,
  },

  // ── Story ──
  {
    id: 'story_ch1',
    name: 'Kapitel I',
    description: 'Erstes Kapitel abgeschlossen',
    icon: 'buchOffen',
    category: 'Story',
    condition: stats => stats.story_chapters_completed >= 1,
  },
  {
    id: 'story_ch3',
    name: 'Kapitel III',
    description: 'Drei Kapitel abgeschlossen',
    icon: 'buchOffen',
    category: 'Story',
    condition: stats => stats.story_chapters_completed >= 3,
  },
  {
    id: 'story_complete',
    name: 'Geschichtenmeister',
    description: 'Alle Kapitel abgeschlossen',
    icon: 'lorbeer',
    category: 'Story',
    condition: stats => stats.story_complete === true,
  },

  // ── Tägliche Herausforderung ──
  {
    id: 'daily_first',
    name: 'Tagesredner',
    description: 'Erste Tages-Challenge gemeistert',
    icon: 'feder',
    category: 'Tägliche Herausforderung',
    condition: stats => stats.daily_completed >= 1,
  },
  {
    id: 'daily_7',
    name: 'Wochenroutine',
    description: '7-Tage-Streak',
    icon: 'feder',
    category: 'Tägliche Herausforderung',
    condition: stats => stats.daily_streak >= 7,
  },
  {
    id: 'daily_30',
    name: 'Monatsdisziplin',
    description: '30-Tage-Streak',
    icon: 'lorbeer',
    category: 'Tägliche Herausforderung',
    condition: stats => stats.daily_streak >= 30,
  },

  // ── Rhetorik ──
  {
    id: 'rhetorician_5',
    name: 'Stilist',
    description: '5 Stilmittel in einem Text',
    icon: 'federn',
    category: 'Rhetorik',
    condition: stats => stats.max_rhetorik_devices >= 5,
  },
  {
    id: 'rhetorician_8',
    name: 'Meisterstilist',
    description: '8 Stilmittel in einem Text',
    icon: 'federn',
    category: 'Rhetorik',
    condition: stats => stats.max_rhetorik_devices >= 8,
  },
  {
    id: 'metaphor_master',
    name: 'Metaphernmeister',
    description: '10 Metaphern insgesamt',
    icon: 'federn',
    category: 'Rhetorik',
    condition: stats => stats.total_metaphors >= 10,
  },

  // ── Vielseitigkeit ──
  {
    id: 'all_categories',
    name: 'Universalist',
    description: 'In allen 12 Kategorien gespielt',
    icon: 'stern',
    category: 'Vielseitigkeit',
    condition: stats => stats.categories_played >= 12,
  },
  {
    id: 'all_difficulties',
    name: 'Allrounder',
    description: 'Alle Schwierigkeiten gemeistert',
    icon: 'ziel',
    category: 'Vielseitigkeit',
    condition: stats => stats.difficulties_played >= 3,
  },
  {
    id: 'speed_demon',
    name: 'Blitzredner',
    description: 'Unter 60 Sekunden eingereicht',
    icon: 'ziel',
    category: 'Vielseitigkeit',
    condition: stats => stats.fastest_submit <= 60,
  },

  // ── Meilensteine ──
  {
    id: 'games_10',
    name: 'Regelmäßig',
    description: '10 Spiele gespielt',
    icon: 'buch',
    category: 'Meilensteine',
    condition: stats => stats.total_games >= 10,
  },
  {
    id: 'games_50',
    name: 'Veteran',
    description: '50 Spiele gespielt',
    icon: 'buch',
    category: 'Meilensteine',
    condition: stats => stats.total_games >= 50,
  },
  {
    id: 'games_100',
    name: 'Legende',
    description: '100 Spiele gespielt',
    icon: 'lorbeer',
    category: 'Meilensteine',
    condition: stats => stats.total_games >= 100,
  },
  {
    id: 'total_words_1000',
    name: 'Vielschreiber',
    description: '1000 Wörter geschrieben',
    icon: 'tintenfass',
    category: 'Meilensteine',
    condition: stats => stats.total_words >= 1000,
  },
];
