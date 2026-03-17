# Checkpoint — 2026-03-14

## Ziel
ELOQUENT in 3 Phasen upgraden: Polish → Story RPG → Online Multiplayer

## ALLE 3 PHASEN KOMPLETT

### Phase 1: Polish & Game Feel ✓
- Storage-Abstraktion + Event Bus (engine/storage.js, engine/event-bus.js)
- Sound Manager mit howler.js (engine/sound-manager.js)
- Sound-Trigger in Button, AntwortEingabe, BewertungDisplay, StoryPage, DuellPage
- Sound-Einstellungen in EinstellungenModal
- Page Transitions (PageTransition.jsx)
- Neue Keyframes (animations.css: confetti, countUp, particleFloat, page transitions)
- Gold-Partikel + Confetti (GoldParticles.jsx, Confetti.jsx)
- Typewriter-Hook + CountUp-Hook (hooks/)
- 30 Achievements + Engine + Toast-System + Vitrine
- Tages-Challenge (daily.js, DailyChallenge.jsx)
- Mobile Bottom Navigation (BottomNav.jsx)
- NavBar hidden unter 768px
- PWA Install Prompt + Service Worker

### Phase 2: Story RPG ✓
- Story-Engine State Machine (engine/story-engine.js)
- XP-System mit 11 Leveln (engine/xp-system.js)
- 3 Charakter-Archetypen (Dichter, Redner, Gelehrter)
- 10 Kapitel Story-Content mit 4 Challenge-Typen
- 7 Story-Komponenten (MultipleChoice, FreeText, WordOrder, FillBlank, BossFight, StoryDecision, CharacterSelect)
- 3 Boss-Kämpfe (Kap. 3/6/10)
- 3 Entscheidungspunkte → 7 verschiedene Enden
- StoryPage komplett neu geschrieben

### Phase 3: Online Multiplayer ✓
- Supabase Client + Auth Context (Google OAuth)
- React Router Migration (BrowserRouter + Routes)
- DB Schema: profiles, matches, matchmaking_queue, user_achievements, weekly_leaderboard
- Elo-System (engine/elo.js)
- Matchmaking (engine/matchmaking.js)
- Online-Game Session Manager (engine/online-game.js)
- Daten-Migration localStorage → Supabase (engine/data-migration.js)
- Auth Modal + Profil-Seite + Online-Duell-Seite
- Rangliste mit Lokal/Global Tabs
- Freunde herausfordern (6-Zeichen Code + Web Share API)
- Supabase Edge Function für Server-seitiges Scoring
- Vercel SPA Routing

## Build/Test-Status
- Build: OK (179 Module, 710ms)
- Bundle: 502KB JS (gzip: 162KB) + 83KB CSS + 37KB howler
- 56 neue Dateien, 15 modifizierte Dateien
- Abhängigkeiten: +howler, +@supabase/supabase-js, +react-router-dom

## Offene Punkte
- Sound-Dateien (.mp3) in public/sounds/ fehlen noch (Manager handled gracefully)
- Supabase-Projekt muss erstellt und Env-Vars gesetzt werden
- Chunk-Splitting empfohlen für Performance (502KB Warnung)
