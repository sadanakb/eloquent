# Checkpoint — 2026-04-17 09:48

## Ziel
Online-Duell systematisch reparieren: 5 Arbeitspakete aus
`/Users/sadanakb/.claude/plans/sehr-viele-bugs-beim-snoopy-eagle.md`
voll implementieren — Submit-Flow, Realtime, Presence 30s + DB-Guards,
Subscription-Hygiene, UX-Polish. Edge Function wird NICHT angefasst
(v8 ist korrekt). User macht Commit & Push.

## Erledigt
- [x] WP1 Submit hart: `handleWritingSubmit` useCallback; `onSubmit` gibt
      `{ success: boolean }` zurück; Fehler setzen `submitError` und
      gehen in `result`-Phase mit persistenter Error-Card statt silent
      `menu`-Reset
      (Dateien: src/pages/OnlineDuellPage.jsx, src/components/AntwortEingabe.jsx)
- [x] AntwortEingabe: submittedRef nach success=true gesetzt,
      Timer-Interval per `timerIntervalRef` stoppbar, neuer `disabled`-Prop
      + `internalDisabled`-State, Text-Reset nach erfolgreichem Submit
      (Dateien: src/components/AntwortEingabe.jsx)
- [x] WP2 Realtime: Migration 011 mit `REPLICA IDENTITY FULL` auf
      matches und matchmaking_queue; `subscribeToMatch` nutzt
      client-seitige `lastSeenMatchState`-Map für zuverlässige
      Transition-Detection; `requestServerScoring` erkennt 202 /
      `scoring_in_progress` und gibt `{ status: 'in_progress' }`
      zurück — KEIN Client-Fallback mehr in dem Fall
      (Dateien: supabase/migrations/011_realtime_cleanup_guards.sql,
       src/engine/online-game.js)
- [x] WP3 Presence 30s + Guards: presence.js Default-Timeout 30s,
      `onOpponentTimeout` mit 3 strikten Guards
      (eigener Submit-Status, Gegner-Submit-Status, Live-DB-Recheck);
      Migration 011 ersetzt `cleanup_stale_matches` mit Text-Guard
      (beide Texte → scoring statt forfeited) und `forfeit_match` mit
      `FOR UPDATE`-Locks auf beide profile-Rows in konsistenter Sortierung
      (Dateien: src/engine/presence.js, src/pages/OnlineDuellPage.jsx,
       supabase/migrations/011_realtime_cleanup_guards.sql)
- [x] 2 historische stuck Matches gelöscht (211d4e41, 809d2f9f) via
      `npx supabase db query` — defensive Query auf alle künftigen
      „beide Texte, forfeited, null scores"-Fälle
- [x] WP4 Reconnect + Subs: `subscribeToMatchIfNeeded`-Helper;
      `startWriting`, `handleCreateChallenge`, `handleChallengeFriend`,
      `handleResumeMatch` alle auf Helper umgestellt (Resume inkl.
      auto_submit Pfad); `matchmaking:found`-Listener mit `phaseRef`-
      basiertem Phase-Guard (`phase !== 'searching'` → return);
      `scoringTimeoutRef` komplett entfernt; `matchmaking.js`
      `tearDownActive()` ausgelagert und am Anfang jedes `joinQueue`
      aufgerufen, plus channel-Name mit Timestamp gegen HMR-Konflikte
      (Dateien: src/pages/OnlineDuellPage.jsx, src/engine/matchmaking.js)
- [x] WP5 UX-Polish: persistente Error-Card in `result`-Phase bei
      submitError (kind: match_ended/network/unknown); Info-Hint
      „Gegner schreibt noch…" nach 15s waiting; Info-Hint + Retry-Button
      nach 30s scoring (ruft performScoring erneut)
      (Dateien: src/pages/OnlineDuellPage.jsx)
- [x] Migration 011 deployed via `npx supabase db push`
- [x] Build verifiziert: `npx vite build` läuft clean (✓ built in 915ms)

## Offen
- [ ] User macht `git add` + `git commit` + `git push` (bewusst NICHT
      durch den Agent — auf User-Anweisung)
- [ ] End-to-end Browser-Test (2 Browser, alle 7 Test-Matrix-Szenarien)
- [ ] `matchmaking.js`: vollständiger Refactor von modul-globalen
      Singletons zu per-call-Objekt wurde bewusst pragmatisch
      abgeschwächt (nur cleanup-safer + eindeutiger Channel-Name).
      Falls HMR-Leaks unter realen Bedingungen weiterhin auftreten,
      reicht das nicht.

## Entscheidungen
- AntwortEingabe `doSubmit` wird async und awaitet `onSubmit`. Erfolg
  sperrt UI + stoppt Timer + leert text; Fehler öffnet UI wieder. So
  bleibt der Button stummgeschaltet nur, wenn wirklich erfolgreich.
- `performScoringRef` wird verwendet damit `handleMatchEvent` und
  `handleWritingSubmit` performScoring aufrufen können ohne zirkuläre
  useCallback-Deps. `performScoringRef.current` wird via useEffect
  synchronisiert, sobald eine neue Version von performScoring existiert.
- Error-Card rendert als zweiter `phase === 'result'`-Zweig wenn
  `submitError` gesetzt — die Normal-Ergebnisansicht bleibt für echten
  Sieg/Niederlage/Draw ungestört.
- Disconnect-Banner und Countdown auf 30s (Policy-Entscheidung lt. Plan).

## Build/Test-Status
- Build: OK (`npx vite build` → ✓ built in 915ms)
- DB-Migration: OK (`npx supabase db push` → applied)
- DB-Cleanup: OK (2 stuck Matches gelöscht, IDs geloggt)
- Tests: keine automatisierten Tests vorhanden; 2-Browser E2E offen
- Letzter Commit: 41ba131 (vor dieser Session, ungetoucht)

## Nächster Schritt
User: Commit & Push. Danach 2-Browser-Test gemäss Test-Matrix in Plan
(Szenario 1-7). Speziell 3 und 6 beobachten (Disconnect mit Submit;
Server-Error → Error-Card).
