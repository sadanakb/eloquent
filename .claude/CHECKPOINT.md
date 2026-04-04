# Checkpoint — 2026-04-04

## Ziel
Mobile-Fix (Bottom-Nav), Performance-Optimierung, und komplettes Freundesystem mit Online-Matches

## Erledigt
- [x] Bottom-Nav Fix: dvh viewport, translateZ(0) GPU-Layer, touch-action, Drawer-Position (Dateien: src/styles/base.css, src/components/BottomNav.module.css)
- [x] Performance: GoldParticles infinite→1, Avatar lazy loading, Timer 250→1000ms (Dateien: src/components/GoldParticles.module.css, src/pages/RanglistePage.jsx, src/pages/ProfilePage.jsx, src/components/AntwortEingabe.jsx)
- [x] scrollTo(0,0) entfernt aus onNavigate (Datei: src/App.jsx)
- [x] Duell-Tab → Online-Match, lokales Duell in Mehr-Drawer (Dateien: src/App.jsx, src/components/BottomNav.jsx)
- [x] DB-Migration: friendships table, friend_code, last_seen_at, RLS, DB-Functions (Datei: supabase/migrations/005_friend_system.sql)
- [x] Friends Engine: getFriends, sendRequest, search, subscribe, heartbeat (Datei: src/engine/friends.js)
- [x] Friend UI: FriendListSection, AddFriendModal, FriendRequestsSection (Dateien: src/components/FriendListSection.jsx, AddFriendModal.jsx, FriendRequestsSection.jsx + CSS)
- [x] OnlineDuellPage Integration: Freunde-Sektion, Challenge-Button, Realtime (Datei: src/pages/OnlineDuellPage.jsx)
- [x] Globaler Match-Einladungs-Listener mit Toast-Notification (Datei: src/App.jsx)
- [x] Rangliste Freunde-Tab mit echten Daten (Datei: src/pages/RanglistePage.jsx)
- [x] Profil: Friend-Code Anzeige (Datei: src/pages/ProfilePage.jsx)
- [x] AuthContext: friend_code Auto-Generierung für bestehende User (Datei: src/contexts/AuthContext.jsx)

## Offen
- [ ] Migration 005 auf Supabase-DB ausführen (manuell)
- [ ] E2E Testing mit 2 Browsern

## Entscheidungen
- Freundesliste in OnlineDuellPage integriert (nicht separate Seite)
- Push-Notification via Supabase Realtime für Match-Einladungen
- Duell-Tab führt direkt zu Online-Match
- Online-Status via last_seen_at Heartbeat (60s Intervall, 2min Timeout)

## Build/Test-Status
- Build: OK (✓ built in 965ms)
- Tests: N/A

## Nächster Schritt
Migration 005 auf Supabase-DB ausführen, dann E2E testen
