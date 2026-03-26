# Eloquent — Umfassende Projektdokumentation

> **Erstellt:** 2026-03-25 | **Status:** Vollständige Codebase-Analyse
> Legende: ✅ Gut gelöst | ⚠️ Problematisch | 🔴 Kritisch

---

## Inhaltsverzeichnis

1. [Projektstruktur](#1-projektstruktur)
2. [Authentifizierung & Datenpersistenz](#2-authentifizierung--datenpersistenz)
3. [Online Match System](#3-online-match-system)
4. [Spielmechanik & Logik](#4-spielmechanik--logik)
5. [Sicherheit](#5-sicherheit)
6. [Performance & Stabilität](#6-performance--stabilität)
7. [Bekannte Probleme & Schwachstellen](#7-bekannte-probleme--schwachstellen)
8. [Datenbank-Schema](#8-datenbank-schema)
9. [UI/UX & Responsiveness](#9-uiux--responsiveness)
10. [Deployment & Config](#10-deployment--config)
11. [Code-Qualität](#11-code-qualität)

---

## 1. Projektstruktur

### 1.1 Verzeichnisbaum

```
eloquent/
├── index.html                  # HTML-Einstiegspunkt (PWA-Meta, Service Worker Registration)
├── main.jsx                    # React-Root-Render
├── package.json                # Dependencies & Scripts
├── vite.config.js              # Vite Build-Config + Groq-Proxy (Dev)
├── vercel.json                 # Vercel-Rewrites (SPA + API)
├── server.js                   # Node.js Produktions-Server (Static + Groq-Proxy)
├── test_engine.mjs             # Scoring-Engine Testskript
├── .env                        # ⚠️ Supabase-Credentials (sollte NICHT in Git sein)
├── .env.example                # Vorlage für Umgebungsvariablen
│
├── public/                     # Statische Assets (nicht gebundelt)
│   ├── manifest.json           # PWA-Manifest (Name, Icons, Theme)
│   ├── sw.js                   # Service Worker v6 (Network-First, Force-Reload)
│   ├── favicon.svg             # Favicon
│   ├── apple-touch-icon.svg    # iOS-Icon
│   ├── icon-192.svg            # PWA-Icon 192px
│   ├── icon-512.svg            # PWA-Icon 512px
│   └── sounds/                 # Audio-Dateien (MP3)
│       ├── achievement-unlock.mp3
│       ├── ambient-library.mp3
│       ├── click.mp3
│       ├── error.mp3
│       ├── gold-gain.mp3
│       ├── page-flip.mp3
│       ├── success.mp3
│       └── timer-warning.mp3
│
├── src/                        # Haupt-Quellcode
│   ├── App.jsx                 # Router + globale Provider
│   ├── styles.css              # App-Level Styles
│   │
│   ├── components/             # React-Komponenten
│   │   ├── AntwortEingabe.jsx/.css    # Antwort-Eingabefeld mit Timer
│   │   ├── AuthModal.jsx/.css         # Login/Signup-Dialog (Google OAuth)
│   │   ├── Badge.jsx/.css             # Abzeichen-Anzeige
│   │   ├── BewertungDisplay.jsx/.css  # Scoring-Ergebnis (7 Kategorien)
│   │   ├── BottomNav.jsx/.css         # Mobile Bottom-Navigation
│   │   ├── Button.jsx/.css            # Wiederverwendbarer Button
│   │   ├── Card.jsx/.css              # Karten-Container
│   │   ├── Confetti.jsx/.css          # Gewinn-Animation (CSS-only)
│   │   ├── DailyChallenge.jsx/.css    # Tages-Challenge Widget
│   │   ├── EinstellungenModal.jsx/.css # Einstellungen (Groq-Key, Sound, Theme)
│   │   ├── ErrorBoundary.jsx          # React Error Boundary
│   │   ├── GoldBar.jsx/.css           # Gold/XP-Anzeige
│   │   ├── GoldParticles.jsx/.css     # Partikel-Animation
│   │   ├── Input.jsx/.css             # Wiederverwendbares Input-Feld
│   │   ├── InstallPrompt.jsx/.css     # PWA-Installations-Banner
│   │   ├── Logo.jsx/.css              # App-Logo
│   │   ├── NavBar.jsx/.css            # Desktop-Navigation
│   │   ├── Ornament.jsx/.css          # Dekorative Ornamente
│   │   ├── PageTransition.jsx         # Seitenübergang-Animation
│   │   ├── SetupWizard.jsx/.css       # Ersteinrichtungs-Assistent
│   │   ├── Toast.jsx/.css             # Toast-Benachrichtigungen
│   │   ├── icons/
│   │   │   └── Icons.jsx              # SVG-Icon-Sammlung
│   │   └── story/                     # Story-Modus Komponenten
│   │       ├── BossFight.jsx/.css            # Boss-Kampf
│   │       ├── CharacterSelect.jsx/.css      # Archetyp-Auswahl
│   │       ├── FillBlankChallenge.jsx/.css    # Lückentext
│   │       ├── FreeTextChallenge.jsx/.css     # Freitext-Aufgabe
│   │       ├── MultipleChoiceChallenge.jsx/.css # Multiple Choice
│   │       ├── StoryDecision.jsx/.css        # Story-Entscheidung
│   │       └── WordOrderChallenge.jsx/.css   # Wort-Reihenfolge
│   │
│   ├── pages/                  # Seiten (Top-Level Routes)
│   │   ├── HeroPage.jsx/.css          # Startseite
│   │   ├── DuellPage.jsx/.css         # Lokales Duell (1v1)
│   │   ├── UebungPage.jsx/.css        # Übungsmodus
│   │   ├── StoryPage.jsx/.css         # Story-Kampagne
│   │   ├── WoerterbuchPage.jsx/.css   # Wörterbuch
│   │   ├── RanglistePage.jsx/.css     # Rangliste/Leaderboard
│   │   ├── RegelnPage.jsx/.css        # Spielregeln
│   │   ├── AchievementPage.jsx/.css   # Erfolge
│   │   ├── ProfilePage.jsx/.css       # Profil & Statistiken
│   │   └── OnlineDuellPage.jsx/.css   # Online-Multiplayer
│   │
│   ├── engine/                 # Spiellogik & Business Logic
│   │   ├── scoring-engine.js          # Master-Scoring-Orchestrator (7 Kategorien)
│   │   ├── ki-scorer.js               # KI-Bewertung via Groq API
│   │   ├── heuristic-scorer.js        # Offline-Fallback-Scoring
│   │   ├── semantic-scorer.js         # Semantische Analyse
│   │   ├── rhetorik-detector.js       # Stilmittel-Erkennung
│   │   ├── anti-gaming.js             # Spam/Keyword-Stuffing-Erkennung
│   │   ├── elo.js                     # ELO-Rating-System
│   │   ├── matchmaking.js             # Spieler-Matching (Queue + Pairing)
│   │   ├── online-game.js             # Online-Multiplayer-Logik
│   │   ├── achievements.js            # Achievement-Tracking
│   │   ├── xp-system.js               # Erfahrungspunkte-System
│   │   ├── daily.js                   # Tages-Challenge-Logik
│   │   ├── story-engine.js            # Story-Modus-Logik
│   │   ├── sound-manager.js           # Audio-Wiedergabe (Howler.js)
│   │   ├── storage.js                 # localStorage-Abstraktion
│   │   ├── event-bus.js               # Event-Kommunikation
│   │   ├── data-migration.js          # Lokale→Supabase Migration
│   │   └── model-loader.js            # ML-Model-Loading (optional)
│   │
│   ├── data/                   # Statische Spieldaten
│   │   ├── situationen.js             # 108 Spielszenarien (12 Kategorien × 3 Schwierigkeiten × 3)
│   │   ├── woerterbuch.js             # Deutsches Vokabular (~500+ Wörter)
│   │   ├── story-data.js              # Story-Kapitel & Inhalte
│   │   ├── achievements.js            # Achievement-Definitionen
│   │   ├── raenge.js                  # Rang-Stufen (ELO → Titel)
│   │   └── deutsche-nlp-data.js       # NLP-Referenzdaten (Stoppwörter etc.)
│   │
│   ├── contexts/
│   │   └── AuthContext.jsx            # Supabase Auth Provider (Google OAuth)
│   │
│   ├── lib/
│   │   └── supabase.js               # Supabase-Client-Initialisierung
│   │
│   ├── hooks/
│   │   ├── useCountUp.js             # Zähler-Animation (requestAnimationFrame)
│   │   └── useTypewriter.js           # Schreibmaschinen-Effekt
│   │
│   └── styles/                 # Globale Stylesheets
│       ├── animations.css             # CSS-Animationen
│       ├── base.css                   # Reset & Basis-Styles
│       ├── fonts.css                  # Schriftarten
│       ├── index.css                  # Haupt-Stylesheet-Import
│       ├── textures.css               # Papier-Texturen
│       └── theme.css                  # Farbvariablen & Theme
│
├── api/                        # Vercel Serverless Functions
│   ├── groq.js                        # Groq-API-Proxy
│   └── groq/
│       └── [...path].js               # Catch-all Groq-Route
│
├── supabase/                   # Backend & Datenbank
│   ├── functions/
│   │   └── score-text/
│   │       └── index.ts               # Edge Function für Server-Scoring
│   └── migrations/
│       ├── 001_initial.sql            # DB-Schema + RLS + Trigger
│       └── 002_fix_rls.sql            # RLS-Security-Fix
│
└── docs/                       # Design-Dokumente
```

### 1.2 Tech-Stack

| Bereich | Technologie | Details |
|---------|-------------|---------|
| **Frontend** | React 18.3.1 | SPA mit JSX |
| **Build** | Vite 6.0.0 | Dev-Server + Production Build |
| **Routing** | React Router DOM 7.13.1 | Client-Side Routing (12 Routes) |
| **Sprache** | JavaScript (ES Modules) | Kein TypeScript |
| **Styling** | Custom CSS | Component-scoped + Global Stylesheets |
| **Backend** | Supabase | PostgreSQL + Auth + Realtime |
| **KI-Scoring** | Groq Cloud API | Llama 3.3 70B (Text-Bewertung) |
| **Hosting** | Vercel | Serverless Functions + Static Hosting |
| **Audio** | Howler.js 2.2.4 | Sound-Effekte |
| **PWA** | Service Worker v6 | Network-First, Offline-fähig |

### 1.3 Dependencies

**Produktion (5):**

| Package | Version | Zweck |
|---------|---------|-------|
| `react` | ^18.3.1 | UI-Framework |
| `react-dom` | ^18.3.1 | React DOM-Rendering |
| `react-router-dom` | ^7.13.1 | Client-Side Routing |
| `@supabase/supabase-js` | ^2.99.1 | Datenbank, Auth, Realtime |
| `howler` | ^2.2.4 | Audio-Wiedergabe |

**Entwicklung (2):**

| Package | Version | Zweck |
|---------|---------|-------|
| `vite` | ^6.0.0 | Build-Tool & Dev-Server |
| `@vitejs/plugin-react` | ^4.3.4 | React JSX-Transform |

✅ **Minimalistischer Stack — nur 7 Dependencies total**

### 1.4 Routing-Struktur

| Route | Komponente | Beschreibung |
|-------|-----------|--------------|
| `/` | HeroPage | Startseite mit Spielmodi-Übersicht |
| `/duell` | DuellPage | Lokales 1v1-Duell |
| `/uebung` | UebungPage | Solo-Übungsmodus |
| `/story` | StoryPage | Story-Kampagne "Akademie der verlorenen Worte" |
| `/woerterbuch` | WoerterbuchPage | Deutsches Wörterbuch |
| `/rangliste` | RanglistePage | Leaderboard (lokal + online) |
| `/regeln` | RegelnPage | Spielregeln & Scoring-Erklärung |
| `/achievements` | AchievementPage | Erfolge & Abzeichen |
| `/profil` | ProfilePage | Profil & Statistiken |
| `/online` | OnlineDuellPage | Online-Multiplayer-Lobby |
| `/duell/:code` | OnlineDuellPage | Freundes-Duell via Einladungscode |
| `*` | HeroPage | 404-Fallback |

---

## 2. Authentifizierung & Datenpersistenz

### 2.1 Google OAuth Login Flow

**Dateien:** `src/contexts/AuthContext.jsx`, `src/lib/supabase.js`

```
Nutzer klickt "Anmelden"
    → supabase.auth.signInWithOAuth({ provider: 'google' })
    → Redirect zu Google OAuth-Consent-Screen
    → Google authentifiziert Nutzer
    → Redirect zurück zu window.location.origin mit Auth-Code
    → Supabase SDK erkennt Code in URL (detectSessionInUrl: true)
    → JWT Access Token + Refresh Token erstellt
    → Session in localStorage gespeichert (durch Supabase SDK)
    → onAuthStateChange Event feuert
    → AuthContext setzt user State
    → fetchOrCreateProfile() lädt/erstellt Profil in profiles-Tabelle
```

**Supabase-Client-Konfiguration:**
```javascript
// src/lib/supabase.js
createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    detectSessionInUrl: true,    // OAuth-Redirect-Code automatisch verarbeiten
    persistSession: true,         // Session in localStorage speichern
    autoRefreshToken: true,       // Token vor Ablauf automatisch erneuern
  },
})
```

✅ **OAuth vollständig an Supabase delegiert** — App verarbeitet keine Google-Credentials direkt

### 2.2 API-Key Speicherung

**Groq API Key:**
- **Speicherort:** `localStorage` mit Key `eloquent_groq_key`
- **Encoding:** Base64 (`btoa()`/`atob()`) — ⚠️ **KEINE Verschlüsselung, nur Obfuskation**
- **Eingabe:** Setup-Wizard (`SetupWizard.jsx`) oder Einstellungen (`EinstellungenModal.jsx`)
- **Verwendung:** Authorization-Header bei `/api/groq`-Aufrufen

```javascript
// src/engine/ki-scorer.js
export function getGroqKey() {
  const encoded = localStorage.getItem('eloquent_groq_key') || '';
  try { return atob(encoded); } catch { return encoded; }
}
```

⚠️ **Key ist in DevTools sichtbar** und durch XSS-Angriffe extrahierbar

**Supabase Anon Key:**
- In `.env` als `VITE_SUPABASE_ANON_KEY`
- Wird zur Build-Zeit eingebettet (im JS-Bundle sichtbar)
- ✅ Korrekt — Anon Key ist öffentlich vorgesehen, RLS schützt die Daten

### 2.3 User-State Persistenz

**Drei Speicher-Ebenen:**

| Ebene | Was | Wo |
|-------|-----|-----|
| **localStorage** | Spielstand, XP, Achievements, Settings, Groq-Key | Browser-lokal, `eloquent_`-Prefix |
| **Supabase Auth** | Session-Tokens (JWT + Refresh) | localStorage (von Supabase SDK verwaltet) |
| **Supabase DB** | Profil, ELO, Online-Stats, Achievements | `profiles`, `user_achievements` Tabellen |

**localStorage Keys:**
- `eloquent_setup_done` — Setup-Wizard abgeschlossen
- `eloquent_groq_key` — Groq API Key (Base64)
- `eloquent_stats` — Spielstatistiken
- `eloquent_achievements_unlocked` — Freigeschaltete Achievements
- `eloquent_xp` — XP-Fortschritt
- `eloquent_favorite_category` — Lieblingskategorie
- `theme` — Dark/Light Mode
- `daily_streak` — Tages-Challenge Streak
- `daily_last_date` — Letztes Spieldatum
- `supabase_migrated` — Migration-Flag

### 2.4 Geräteübergreifender Spielfortschritt

✅ **Ja, über Supabase gespeichert:**
- Profil (ELO, Wins, Losses, Total Games) → `profiles` Tabelle
- Achievements → `user_achievements` Tabelle
- Online-Match-Historie → `matches` Tabelle

⚠️ **Teilweise — lokale Daten werden einmalig migriert:**
- Bei erstem Login: `data-migration.js` überträgt lokale Stats zu Supabase
- Konfliktstrategie: `Math.max()` (höherer Wert gewinnt)
- Nach Migration: `supabase_migrated` Flag gesetzt, keine weitere Sync

⚠️ **Nicht synchronisiert:**
- Tägliche Streak-Daten (nur localStorage)
- Story-Fortschritt (nur localStorage)
- Einstellungen (Theme, Sound)

### 2.5 Token-Refresh-Logik

✅ **Automatisch durch Supabase SDK:**
- `autoRefreshToken: true` → SDK erneuert Token bevor es abläuft
- Refresh Token wird im Background verwendet
- Bei Fehler: `onAuthStateChange` feuert mit `null` Session → User wird ausgeloggt

⚠️ **Keine manuelle Refresh-Logik im App-Code** — komplett an SDK delegiert

### 2.6 Logout-Handling

```javascript
// src/contexts/AuthContext.jsx
async function signOut() {
  if (!supabase) return;
  await supabase.auth.signOut();
}
```

- ✅ `signOut()` invalidiert Server-Session bei Supabase
- ✅ Lokale Tokens werden vom SDK gelöscht
- ⚠️ Nur aktuelle Session wird invalidiert (nicht alle Geräte)
- ⚠️ localStorage-Daten (Spielstand etc.) bleiben erhalten

---

## 3. Online Match System

### 3.1 Matchmaking ("Match suchen")

**Datei:** `src/engine/matchmaking.js`

**Warteschlange:**
1. Spieler wird in `matchmaking_queue` Tabelle eingefügt (userId + eloRating)
2. `upsert` verhindert Duplikate (unique constraint auf `user_id`)
3. Realtime-Subscription lauscht auf INSERT in `matches` Tabelle

**Pairing-Logik:**
```
Phase 1 (0-30 Sekunden):
  → Suche Gegner mit ELO ±200 des eigenen Ratings
  → Ältester Wartender wird bevorzugt (FIFO)

Phase 2 (30+ Sekunden):
  → ELO-Range erweitert sich auf ±400
  → UI zeigt "Erweitere Suche..."
```

**Match-Erstellung:**
```javascript
// Wenn Gegner gefunden:
1. Match-Eintrag in matches erstellt (status='active')
2. Beide Spieler aus matchmaking_queue gelöscht
3. player2 erhält Realtime-Event (INSERT auf matches)
4. player1 erhält Match-Daten direkt vom Insert-Return
```

✅ **Atomic Match Creation** — Queue-Einträge und Match-Erstellung sind konsistent

### 3.2 Realtime-Kommunikation

**Technologie:** Supabase Realtime (WebSocket über PostgreSQL CDC — Change Data Capture)

**Drei Channels im Einsatz:**

| Channel | Zweck | Trigger |
|---------|-------|---------|
| `matchmaking` | Gegner-Fund-Notification | INSERT auf `matches` (filter: player2_id=userId) |
| `match:{matchId}` | Spielverlauf-Updates | UPDATE auf `matches` (filter: id=matchId) |
| Keiner | Heartbeat/Presence | ⚠️ **Nicht implementiert** |

**Event-Typen im Match-Channel:**
- `opponent_submitted` — Gegner hat Text abgegeben
- `scores_ready` — Bewertung fertig (status='completed')
- `opponent_disconnected` — Gegner aufgegeben (status='forfeited')
- `friend_joined` — Freund tritt Einladung bei

### 3.3 Kompletter Spielablauf

```
PHASE 1: MENU
  Spieler wählt: Quick Match oder Freundes-Duell

PHASE 2: SEARCHING (nur Quick Match)
  → joinQueue() → matchmaking_queue INSERT
  → Realtime-Subscription aktiv
  → UI: "Suche Gegner..." mit Timer
  → Bei Fund: matchmaking:found Event

PHASE 3: MATCHED
  → 5-Sekunden-Countdown
  → Gegner-Profil anzeigen (Name, ELO, Rang)
  → Option: "Los geht's!" zum Überspringen

PHASE 4: WRITING
  → Situation + Kontext angezeigt
  → Timer läuft (leicht=180s, mittel=150s, schwer=120s)
  → subscribeToMatch() für Live-Updates
  → UI: "Gegner schreibt..." / "Gegner hat abgegeben"

PHASE 5: WAITING (wenn Spieler als Erster abgibt)
  → Warten auf Gegner-Abgabe
  → opponent_submitted Event → weiter zu Scoring
  → ODER: Timer des Gegners läuft ab → Auto-Submit

PHASE 6: SCORING
  → KI-Bewertung beider Texte (Groq API)
  → 20-Sekunden-Timeout als Fallback
  → ELO-Berechnung
  → Profil-Update (ELO, Wins/Losses)
  → submitScores() → Match status='completed'

PHASE 7: RESULT
  → Scores + ELO-Änderung anzeigen
  → Detaillierte 7-Kategorien-Aufschlüsselung
  → Confetti bei Sieg
  → Optionen: Revanche, Neues Match, Zurück
```

### 3.4 Verbindungsabbruch / Browser-Refresh / Tab-Wechsel

| Szenario | Verhalten | Problem |
|----------|-----------|---------|
| **Browser-Tab geschlossen** | WebSocket getrennt, kein Auto-Forfeit | ⚠️ Match bleibt in 'active' State hängen |
| **Browser-Refresh** | Session wiederhergestellt, aber Match-State verloren | ⚠️ Kein Reconnect zum laufenden Match |
| **Tab-Wechsel** | WebSocket bleibt aktiv (Browser hält Verbindung) | ✅ Funktioniert |
| **App im Hintergrund** | iOS kann WebSocket nach ~30s trennen | ⚠️ Kein Heartbeat zur Erkennung |
| **Handy-Bildschirm aus** | Wie Hintergrund — WebSocket kann getrennt werden | ⚠️ Gleiche Problematik |
| **Netzwerk-Verlust** | WebSocket stirbt, kein Auto-Forfeit | ⚠️ Gegner wartet endlos |

**Manueller Forfeit (einziger Disconnect-Mechanismus):**
```javascript
// src/engine/online-game.js
export async function forfeitMatch(matchId, playerId) {
  const winnerId = /* der andere Spieler */;
  await supabase.from('matches').update({
    status: 'forfeited',
    winner_id: winnerId,
    completed_at: new Date().toISOString(),
  }).eq('id', matchId);
}
```

⚠️ **Forfeit-Stats-Bug:** Winner erhält KEINEN +1 Win und KEINEN ELO-Gewinn bei Forfeit

### 3.5 Spielzustand-Synchronisierung

**Source of Truth:** Supabase `matches` Tabelle

**Sync-Mechanismus:**
1. Spieler schreibt Text → `submitAnswer()` → UPDATE auf `matches`
2. Gegner erhält UPDATE-Event via Realtime
3. React-State wird aus Event-Payload aktualisiert

**Race-Condition-Fix (Commit 6680349):**
```javascript
// Vertraue DB-Status statt React-State
const updatedMatch = await submitAnswer(match.id, user.id, text);
if (updatedMatch?.status === 'scoring') {
  // Beide haben bereits abgegeben → direkt Scoring starten
  setPhase('scoring');
} else {
  // Nur ich habe abgegeben → warten
  setPhase('waiting');
}
```

✅ **DB-Status hat Vorrang** vor lokalem React-State

### 3.6 Timeout & Disconnect-Erkennung

| Mechanismus | Implementiert? | Details |
|-------------|---------------|---------|
| **Heartbeat/Ping** | 🔴 Nein | Kein periodischer Lebenszeichen-Check |
| **Presence Channel** | 🔴 Nein | Keine Online/Offline-Anzeige |
| **Schreib-Timer** | ✅ Ja | 120-180s je Schwierigkeit, Auto-Submit |
| **Scoring-Timeout** | ✅ Ja | 20s, dann Fallback zu Ergebnis-Anzeige |
| **Match-Timeout** | 🔴 Nein | Stale Matches bleiben in DB |
| **Queue-Expansion** | ✅ Ja | ELO-Range erweitert sich nach 30s |

### 3.7 Freundes-Duell (Code-System)

**Code-Generierung:**
```javascript
// src/engine/online-game.js
const code = Math.random().toString(36).substring(2, 8).toUpperCase();
// Beispiel: "X7K2M9"
```

- **Format:** 6 Zeichen, alphanumerisch (Großbuchstaben)
- **Kollisions-Risiko:** 36^6 ≈ 2.2 Milliarden Kombinationen → vernachlässigbar
- **Unique Constraint:** In DB auf `friend_code` gesetzt

**Join-Ablauf:**
```
1. Spieler A erstellt Challenge → INSERT in matches (status='waiting', friend_code=code)
2. Spieler A teilt Code (Web Share API oder Clipboard)
3. Spieler B gibt Code ein / öffnet /duell/:code
4. joinFriendChallenge(code, userId) → UPDATE (player2_id, status='active')
5. Spieler A erhält friend_joined Event via Realtime
6. Beide in MATCHED Phase → Countdown → Schreiben
```

**Schutzmaßnahmen bei Join:**
```javascript
// Drei atomare Bedingungen:
.eq('friend_code', code)      // Code muss stimmen
.eq('status', 'waiting')      // Muss noch warten
.is('player2_id', null)       // Darf nicht besetzt sein
```
✅ **Verhindert Double-Join**

⚠️ **Code-Gültigkeit:** Codes **laufen nie ab** — alte Matches mit status='waiting' bleiben in der DB

### 3.8 Gleichzeitiges Antworten (Race Condition)

**Problem:** Beide Spieler senden gleichzeitig → `submitAnswer()` setzt `status='scoring'`

**Lösung (Multi-Layer):**

1. **DB-Status-Check nach Submit:**
   ```javascript
   if (updatedMatch?.status === 'scoring') {
     // Beide fertig → sofort Scoring
   }
   ```

2. **Realtime-Event als Fallback:**
   ```javascript
   useEffect(() => {
     if (phase === 'waiting' && opponentStatus === 'submitted') {
       performScoring(scoringText);
     }
   }, [phase, opponentStatus]);
   ```

3. **Scoring-Idempotenz:** Beide Clients scoren parallel, schreiben gleiche Werte → kein Konflikt

✅ **Gut gelöst** — DB-Truth + Event-Fallback + Idempotenz

### 3.9 Spielende-Handling

**Gewinner-Ermittlung:**
```javascript
const winnerId = player1Score > player2Score ? player1Id
               : player1Score < player2Score ? player2Id
               : null; // Unentschieden
```

**Statistik-Update:**
```javascript
await updateProfile({
  elo_rating: myElo + eloChange,
  wins: (profile?.wins || 0) + (isWin ? 1 : 0),
  losses: (profile?.losses || 0) + (isLoss ? 1 : 0),
  total_games: (profile?.total_games || 0) + 1,
});
```

**Match-Aufräumen:**
- Match-Status → `'completed'`
- `completed_at` Timestamp gesetzt
- Realtime-Channel wird unsubscribed
- ⚠️ Alte Matches werden NICHT gelöscht (keine Cleanup-Logik)

---

## 4. Spielmechanik & Logik

### 4.1 Wort-/Fragen-Auswahl

**Quelle:** 108 hardcoded Situationen in `src/data/situationen.js`

**Struktur:**
- 12 Kategorien: Bewerbung, Geschäft, Diplomatie, Gericht, Akademie, Salon, Politik, Philosophie, Alltag, Geschichte, Medizin, Medien
- 3 Schwierigkeitsgrade pro Kategorie
- 3 Situationen pro Kombination
- Jede Situation enthält: Titel, Kontext, Aufgabenstellung, Schlüsselwörter

**Auswahl-Logik:**
- **Übung/Duell:** Zufällig aus Kategorie + Schwierigkeit
- **Daily Challenge:** Deterministisch via Datums-Hash (`hashString(YYYY-MM-DD)`)
- **Online:** Zufällige Mittel-Situation

**Wörterbuch:** ~500+ Wörter in `src/data/woerterbuch.js` mit Definition, Kategorie, Beispielsatz

### 4.2 Schwierigkeitsstufen

| Stufe | Timer | Bestimmung |
|-------|-------|------------|
| **Leicht** | 180s (3 Min) | Runde 1 im Duell |
| **Mittel** | 150s (2:30 Min) | Runde 2 im Duell, Daily Challenge |
| **Schwer** | 120s (2 Min) | Runde 3+ im Duell |

- Im Übungsmodus: Spieler wählt selbst
- Im Online-Duell: Immer Mittel
- ⚠️ Keine dynamische Anpassung an Spieler-Performance

### 4.3 Scoring / Punktesystem

**7 Kategorien, max. 100 Punkte:**

| Kategorie | Max. Punkte | Gewicht | Was wird bewertet |
|-----------|-------------|---------|-------------------|
| Rhetorik | 25 | Höchstes | Stilmittel (Metapher, Personifikation, Oxymoron etc.) |
| Situationsbezug | 15 | — | Thematische Relevanz zur Situation |
| Wortvielfalt | 15 | — | Type-Token-Ratio, Wortlänge |
| Wortschatz | 15 | — | Gehobene Wörter (deutsche NLP-Daten) |
| Argumentation | 15 | — | Diskurskonnektoren, logische Struktur |
| Kreativität | 10 | — | Satzlängen-Variation, Stilmittel-Mix |
| Textstruktur | 5 | Niedrigstes | Satzanzahl, Einleitung/Schluss |

**Scoring-Pipeline:**
```
Text → Anti-Gaming-Check → KI-Bewertung (Groq) → Heuristik-Fallback
                ↓                    ↓                    ↓
         Gaming-Penalty      7-Kategorien-Score    Offline-Score
                ↓                    ↓                    ↓
         Multiplikator ────────→ Finaler Score (0-100)
```

**Zwei Scoring-Methoden:**
1. ✅ **KI-Scoring (Groq):** 2-Step-Evaluation mit Research Agent + Scoring Agent (Llama 3.3 70B)
2. ✅ **Heuristik-Scoring:** Offline-Fallback mit Pattern-Matching

**Note-Abstufungen:**

| Punkte | Note |
|--------|------|
| ≥95 | Meisterhaft ⚡ |
| ≥85 | Herausragend 🌟 |
| ≥75 | Ausgezeichnet 🏅 |
| ≥65 | Sehr gut ✨ |
| ≥55 | Gut 👍 |
| ≥45 | Ordentlich 📝 |
| ≥35 | Ausbaufähig 🔧 |
| <35 | Schwach 📉 |

### 4.4 Timer-Logik

**Wo:** Client-seitig in `src/components/AntwortEingabe.jsx`

```javascript
// Interval-basierter Countdown
useEffect(() => {
  const interval = setInterval(() => {
    setTimeLeft(prev => {
      if (prev <= 1) { clearInterval(interval); onAutoSubmit(); return 0; }
      return prev - 1;
    });
  }, 1000);
  return () => clearInterval(interval);
}, []);
```

- ✅ Interval wird bei Unmount bereinigt
- ✅ Audio-Warnung bei 15 Sekunden
- ✅ Auto-Submit bei 0
- ⚠️ **Kein Server-seitiger Timer** — Spieler könnte Client-Timer manipulieren
- ⚠️ **Kein Desync-Handling** — Beide Clients laufen unabhängig

### 4.5 Übungsmodus

**Datei:** `src/pages/UebungPage.jsx`

```
1. Kategorie wählen (12 Optionen oder Zufall)
2. Schwierigkeit wählen (leicht/mittel/schwer/zufall)
3. Situation wird angezeigt + Kontext
4. Schreiben mit Timer
5. KI/Heuristik-Bewertung
6. Ergebnis: 7-Kategorien-Aufschlüsselung + Tipps
```

**Features:**
- ✅ Wort-Hinweise (5 zufällige Vokabeln, ausklappbar)
- ✅ Streak-Tracking (letzte 7 Tage)
- ✅ Skill-Sidebar (4 Balken: Vokabular, Grammatik, Stilistik, Kreativität)
- ✅ Unbegrenzte Versuche
- ✅ Achievement-Integration

### 4.6 Story-Modus

**Datei:** `src/pages/StoryPage.jsx`, `src/engine/story-engine.js`, `src/data/story-data.js`

**Konzept:** "Akademie der verlorenen Worte" — interaktive Kampagne

**Struktur:**
- 3 Archetypen: Dichter, Redner, Gelehrter
- Mehrere Kapitel mit je 3+ Challenges
- Boss-Kämpfe am Kapitel-Ende
- Story-Entscheidungen beeinflussen Ausgang

**Archetyp-Boni:**

| Archetyp | Bonus 1 | Bonus 2 |
|----------|---------|---------|
| Dichter | +20% Kreativität | +10% Wortvielfalt |
| Redner | +15% Rhetorik | +10% Argumentation |
| Gelehrter | +20% Wortschatz | +10% Situationsbezug |

**Challenge-Typen:**
- Multiple Choice (Synonyme, Gegenteile, Stilmittel)
- Freitext (KI-bewertet)
- Wort-Reihenfolge (Satz zusammensetzen)
- Lückentext (Wort einsetzen)

**Boss-Kämpfe:**
- HP-Mechanik: Spieler-Score = Schaden
- Schwächen-System: Bestimmte Stilmittel → Bonus-Schaden
- Sieg-Schwelle: `playerScore >= boss.threshold`

**XP-System:**

| Aktion | XP |
|--------|-----|
| Challenge richtig | 15 |
| Challenge falsch | 4.5 (30%) |
| Boss besiegt | 40 |
| Boss verloren | 8 (20%) |

### 4.7 Tages-Challenge

**Datei:** `src/engine/daily.js`, `src/components/DailyChallenge.jsx`

**Deterministische Auswahl:**
```javascript
const date = todayString(); // "2026-03-25"
const seed = hashString(date);
const situation = SITUATIONEN.mittel[seed % pool.length];
const wort = WOERTERBUCH[(seed + 7) % WOERTERBUCH.length];
```

✅ **Gleiche Challenge für alle Spieler am selben Tag**

**Features:**
- Immer Schwierigkeit "mittel"
- Streak-System (aufeinanderfolgende Tage)
- Wort des Tages
- 1× pro Tag spielbar (Datum-Tracking in localStorage)
- Anzeige: Score + "Morgen kommt die nächste!"

### 4.8 Ranking / Leaderboard

**Datei:** `src/pages/RanglistePage.jsx`, `src/engine/elo.js`

**ELO-System:**
```javascript
K = gamesPlayed < 30 ? 32 : 16;  // Anfänger: volatile, Veteranen: stabil
Expected = 1 / (1 + 10^((opponent - player) / 400));
newRating = currentRating + K × (actual - expected);
```

**Rang-Stufen:**

| Rang | Min ELO | Titel |
|------|---------|-------|
| 1 | 0 | 🌱 Anfänger |
| 2 | 50 | 📝 Lehrling |
| 3 | 150 | 🎤 Redner |
| 4 | 300 | ✒️ Dichter |
| 5 | 500 | 📜 Rhetoriker |
| 6 | 800 | 🎨 Wortkünstler |
| 7 | 1200 | 👑 Meister |
| 8 | 2000 | 🏆 Großmeister |
| 9 | 3500 | 🌟 Legende |
| 10 | 5000 | ⚡ Eloquenz-Gott |

**Start-ELO:** 1200 (= Rang 7 "Meister")

**Leaderboard-Ansichten:**
- Global (Supabase `weekly_leaderboard` View, Top 100)
- Freunde (⚠️ Nicht implementiert)
- Diese Woche (⚠️ Demo-Daten)

**Level-System (XP-basiert):**

| Level | XP benötigt | Titel |
|-------|-------------|-------|
| 1 | 0 | Novize |
| 2 | 100 | Lehrling |
| 3 | 250 | Geselle |
| 4 | 500 | Adept |
| 5 | 800 | Meister |
| 6 | 1200 | Großmeister |
| 7 | 1700 | Virtuose |
| 8 | 2300 | Legende |
| 9 | 3000 | Koryphäe |
| 10 | 3800 | Unsterblich |
| 11 | 5000 | Eloquent |

**Level-Boni:**
- Level 2: +10s Timer
- Level 4: +2 Wort-Hinweise
- Level 6: +20s Timer
- Level 8: +10% Bonus-XP

---

## 5. Sicherheit

### 5.1 API-Keys im Frontend-Code

| Key | Exponiert? | Risiko | Bewertung |
|-----|-----------|--------|-----------|
| Supabase Anon Key | ✅ Ja (im JS-Bundle) | Niedrig | ✅ By Design — RLS schützt Daten |
| Supabase URL | ✅ Ja | Niedrig | ✅ Öffentlich vorgesehen |
| Groq API Key | ✅ Ja (localStorage) | Mittel | ⚠️ XSS-anfällig, Base64 ≠ Verschlüsselung |
| Supabase Service Role Key | ❌ Nein | — | ✅ Nur in Edge Function |
| Groq Server Key | ❌ Nein | — | ✅ Nur in server.js |

🔴 **KRITISCH: `.env` mit Live-Credentials ist in Git committed!**
- Supabase URL und Anon Key sind im Repository sichtbar
- `.gitignore` listet `.env`, aber Datei wurde VOR dem Eintrag committed

### 5.2 Rate-Limiting

🔴 **NICHT IMPLEMENTIERT**

- `/api/groq` Proxy: Kein Rate-Limiting
- `/api/groq/[...path]` Catch-all: Kein Rate-Limiting
- Supabase Edge Function: Kommentar "Rate limiting: max 20/h" aber **Code fehlt**
- Matchmaking Queue: Kein Limit auf Joins/Leaves

### 5.3 Row-Level Security (RLS)

**Alle Tabellen haben RLS aktiviert:** ✅

| Tabelle | SELECT | INSERT | UPDATE | DELETE |
|---------|--------|--------|--------|--------|
| `profiles` | Alle | Nur eigenes | Nur eigenes | — |
| `user_achievements` | Alle | Nur eigenes | — | — |
| `matches` | Eigene + offene Friend-Challenges | Auth Users | Eigene + wartende Matches | — |
| `matchmaking_queue` | Alle | Nur eigenes | — | Nur eigenes |
| `weekly_leaderboard` | Alle (View) | — | — | — |

**Bekannter Bug (gefixt in 002_fix_rls.sql):**
```sql
-- VORHER (Sicherheitslücke):
using (auth.uid() = player1_id or auth.uid() = player2_id or friend_code is not null)
-- Problem: JEDER konnte ALLE Friend-Challenge Matches sehen

-- NACHHER (gefixt):
using (auth.uid() = player1_id or auth.uid() = player2_id
       or (auth.uid() = player1_id and friend_code is not null))
```

### 5.4 Input-Validation / Sanitization

| Bereich | Validiert? | Details |
|---------|-----------|---------|
| Username | ✅ | `/^[a-zA-Z0-9_]{3,20}$/` (Regex) |
| KI-Prompt-Text | ✅ | `sanitizeForPrompt()` — entfernt `{}"\``, limitiert auf 2000 Zeichen |
| Match-Text | ⚠️ Teilweise | Keine explizite Längen-Prüfung vor DB-Insert |
| Friend-Code | ⚠️ Nein | Format wird beim Generieren gesichert, aber nicht beim Input validiert |
| ELO-Rating | ⚠️ Nein | Kein Range-Check (könnte negativ werden) |

✅ **Kein SQL-Injection-Risiko** — Supabase JS Client nutzt parametrisierte Queries

### 5.5 Environment Variables

**Korrekt getrennt:**
- `VITE_*` Variablen → Frontend (öffentlich, im Bundle)
- Nicht-`VITE_*` → Nur Server-seitig (Edge Function, server.js)

⚠️ `.env` sollte nicht im Repository sein

### 5.6 Verschlüsselung

- ✅ Supabase-Verbindung: HTTPS/WSS (TLS)
- ✅ Groq API: HTTPS
- ✅ Vercel Hosting: HTTPS
- ⚠️ localStorage: Unverschlüsselt (Browser-Standard)

### 5.7 Spielzustand-Manipulation

| Angriffsfläche | Möglich? | Details |
|----------------|----------|---------|
| **Score manipulieren** | ⚠️ Ja | Scoring läuft Client-seitig, Ergebnis wird direkt in DB geschrieben |
| **Timer manipulieren** | ⚠️ Ja | Timer ist reines Client-JavaScript |
| **Antwort aus DevTools** | ⚠️ Ja | Text wird client-seitig submitted |
| **ELO manipulieren** | ⚠️ Ja | ELO-Berechnung + Update auf Client |
| **Match-Status ändern** | ⚠️ Teilweise | RLS erlaubt Update auf eigene Matches |

🔴 **Kein Server-seitiger Scoring-Schutz im Online-Modus** — Beide Clients berechnen und schreiben Scores

### 5.8 CORS-Konfiguration

```javascript
// Alle Endpoints: Access-Control-Allow-Origin: '*'
```

⚠️ **Wildcard CORS** — akzeptabel für öffentliche API, aber erlaubt Cross-Origin-Zugriff von jeder Domain

### 5.9 Sensible Daten im Browser-Storage

| Datum | Speicher | Verschlüsselt? |
|-------|----------|----------------|
| Groq API Key | localStorage (Base64) | ⚠️ Nein (nur obfuskiert) |
| Supabase JWT Token | localStorage (vom SDK) | ⚠️ Nein (JWT ist per Design lesbar) |
| Spielstand | localStorage | N/A (nicht sensibel) |
| ELO/Stats | localStorage | N/A (nicht sensibel) |

---

## 6. Performance & Stabilität

### 6.1 Memory Leaks

| Stelle | Typ | Status | Details |
|--------|-----|--------|---------|
| Sound Manager Event Bus | Listener nie unsubscribed | ⚠️ Leak | `eventBus.on('sound:play')` auf Modul-Ebene, kein Cleanup |
| AuthContext Subscription | Supabase onAuthStateChange | ✅ OK | Cleanup in useEffect Return |
| Toast Event Bus | EventBus Listener | ✅ OK | `return unsub;` im Cleanup |
| Online Duell Subscriptions | Realtime Channels | ✅ OK | Refs gespeichert, Cleanup bei Unmount |
| Matchmaking | Module-Level Globals | ⚠️ Risiko | `activeSubscription` + `expandTimer` — verwundbar bei Fehler |

### 6.2 Supabase Realtime Channel Cleanup

- ✅ `online-game.js`: Returns `() => supabase.removeChannel(channel)`
- ✅ `matchmaking.js`: `supabase.removeChannel(activeSubscription)` in `leaveQueue()`
- ✅ `OnlineDuellPage`: Cleanup-Refs (`leaveQueueRef`, `unsubMatchRef`) korrekt verwaltet
- ✅ `AuthContext`: `subscription.unsubscribe()` im Cleanup

### 6.3 Offline/Instabile Verbindung

- ✅ `isOnline()` prüft ob Supabase initialisiert ist
- ✅ OnlineDuellPage: "Bitte neu laden" bei Offline
- ✅ RanglistePage: "Keine Verbindung" für Global-Leaderboard
- ✅ Service Worker: Network-First mit Cache-Fallback
- ⚠️ Kein Reconnect-Handling bei temporärem Verbindungsverlust
- ⚠️ Kein Offline-Queue für ausstehende Aktionen

### 6.4 Lazy Loading / Code Splitting

⚠️ **NICHT IMPLEMENTIERT**
- Alle Seiten werden statisch importiert in `App.jsx`
- Kein `React.lazy()` oder `Suspense`
- Gesamtes Bundle wird beim ersten Laden geladen
- Bei 108 Situationen + NLP-Daten potenziell großes Bundle

### 6.5 Asset-Optimierung

- ✅ SVG-Icons (skalierbar, klein)
- ✅ Sound-Dateien: Lazy-Loading via Howler.js
- ⚠️ Avatar-Bilder: Keine Optimierung/Lazy-Loading
- ✅ Vite: Automatische Bundle-Optimierung + Tree-Shaking

### 6.6 Error Boundaries

- ✅ `ErrorBoundary.jsx` existiert mit Fallback-UI
- 🔴 **NICHT in App.jsx eingebunden!** — Render-Fehler werden nicht gefangen
- ✅ Gutes Error-Handling in async Operationen (try/catch)
- ⚠️ `RanglistePage`: `.then()` ohne `.catch()` für Leaderboard-Fetch

---

## 7. Bekannte Probleme & Schwachstellen

### 7.1 Race Conditions

| Stelle | Beschreibung | Status |
|--------|-------------|--------|
| Gleichzeitige Antwort-Abgabe | Beide Spieler submiten gleichzeitig | ✅ Gefixt (DB-Status-Check) |
| Doppelter Queue-Beitritt | Spieler drückt mehrfach "Suchen" | ✅ Gesichert (upsert + unique) |
| Scoring-Doppelschreibung | Beide Clients schreiben Scores | ⚠️ Kein Konflikt (idempotent), aber unnötig |
| Match-Subscription nach Cancel | Altes Event-Handler feuert | ✅ Gefixt (Cleanup vor neuem Match) |
| ⚠️ Stale opponentStatus | React-State vs. tatsächlicher DB-State | ✅ Gefixt (DB-Truth) |

### 7.2 Fehlende Error-Handling-Stellen

| Stelle | Datei | Problem |
|--------|-------|---------|
| Leaderboard-Fetch | `RanglistePage.jsx:90-103` | `.then()` ohne `.catch()` |
| Avatar-Laden | `RanglistePage.jsx` | Keine Fehlerbehandlung für kaputte URLs |
| Sound-Laden | `sound-manager.js` | Fehler werden nur geloggt, kein Fallback |
| Friend-Code bei Netzwerk-Fehler | `OnlineDuellPage.jsx` | Kann UI in unklarem State lassen |

### 7.3 Memory Leaks

| Stelle | Datei | Impact |
|--------|-------|--------|
| Sound Manager Event Bus | `sound-manager.js:114` | Listener wird nie entfernt |
| Matchmaking Module Globals | `matchmaking.js:8-9` | Bei Fehler keine Cleanup-Garantie |

### 7.4 Ungesicherte Endpoints

| Endpoint | Problem |
|----------|---------|
| `/api/groq` | Kein Rate-Limiting, kein Auth-Check |
| `/api/groq/[...path]` | Catch-all ohne Einschränkung |
| Supabase Edge Function | Rate-Limiting nur als Kommentar |

### 7.5 Nicht abgedeckte Edge Cases (Online Match)

| Szenario | Problem |
|----------|---------|
| Spieler verliert Netzwerk während des Schreibens | Kein Auto-Forfeit, Match bleibt "active" |
| Beide Spieler verlieren Verbindung | Match bleibt ewig in DB |
| Spieler schließt Browser während Scoring | Gegner sieht nie Ergebnis |
| Friend-Code wird erstellt aber nie verwendet | Bleibt ewig als "waiting" in DB |
| Spieler erstellt Match und loggt aus | Match-Orphan in DB |
| Ein Spieler hat KI-Key, der andere nicht | Unterschiedliche Scoring-Methoden möglich |
| Groq API gibt 429 (Rate Limit) zurück | Nur Console-Warnung, Fallback auf Heuristik |

### 7.6 State-Inkonsistenzen

| Stelle | Beschreibung |
|--------|-------------|
| localStorage vs. Supabase | Nach Migration keine weitere Sync — Werte können divergieren |
| ELO nach Forfeit | Forfeit aktualisiert Match, aber NICHT die Profile beider Spieler |
| Story-Fortschritt | Nur in localStorage — geht bei Browser-Wechsel verloren |
| Daily Streak | Nur in localStorage — nicht geräteübergreifend |

### 7.7 Crash/Hänger-Risiken

| Szenario | Folge |
|----------|-------|
| Groq API antwortet nie | 20s Timeout verhindert Endlos-Laden ✅ |
| Supabase Realtime-Server down | Queue zeigt endlos "Suche..." |
| Sehr langer Text (>10.000 Zeichen) | Keine Längenbeschränkung in UI |
| Concurrent State Updates | React Batching verhindert die meisten ✅ |
| ErrorBoundary nicht eingebunden | Render-Fehler → weißer Bildschirm |

---

## 8. Datenbank-Schema

### 8.1 Tabellen

#### `profiles`
```sql
CREATE TABLE profiles (
  id          uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  username    text UNIQUE,
  avatar_url  text,
  elo_rating  integer DEFAULT 1200,
  wins        integer DEFAULT 0,
  losses      integer DEFAULT 0,
  total_games integer DEFAULT 0,
  total_xp    integer DEFAULT 0,
  favorite_category text,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);
```

#### `user_achievements`
```sql
CREATE TABLE user_achievements (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_id text NOT NULL,
  unlocked_at    timestamptz DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);
```

#### `matches`
```sql
CREATE TABLE matches (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player1_id    uuid REFERENCES profiles(id),
  player2_id    uuid REFERENCES profiles(id),
  situation_id  text,
  status        text CHECK (status IN ('waiting','active','scoring','completed','forfeited'))
                DEFAULT 'waiting',
  player1_text  text,
  player2_text  text,
  player1_score numeric,
  player2_score numeric,
  winner_id     uuid REFERENCES profiles(id),
  friend_code   text UNIQUE,
  created_at    timestamptz DEFAULT now(),
  completed_at  timestamptz
);
```

#### `matchmaking_queue`
```sql
CREATE TABLE matchmaking_queue (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id   uuid REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  elo_rating integer NOT NULL,
  joined_at  timestamptz DEFAULT now()
);
```

#### `weekly_leaderboard` (Materialized View)
```sql
CREATE MATERIALIZED VIEW weekly_leaderboard AS
  SELECT id, username, avatar_url, elo_rating, wins, losses, total_games,
         ROW_NUMBER() OVER (ORDER BY elo_rating DESC) AS rank
  FROM profiles
  WHERE total_games > 0
  ORDER BY elo_rating DESC
  LIMIT 100;
```

### 8.2 RLS-Policies (kompletter SQL-Code)

```sql
-- ==================== PROFILES ====================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Jeder kann Profile lesen
CREATE POLICY "Anyone can view profiles" ON profiles
  FOR SELECT USING (true);

-- Nur eigenes Profil erstellen
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Nur eigenes Profil aktualisieren
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- ==================== USER_ACHIEVEMENTS ====================
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- Jeder kann Achievements lesen
CREATE POLICY "Anyone can view achievements" ON user_achievements
  FOR SELECT USING (true);

-- Nur eigene Achievements einfügen
CREATE POLICY "Users can insert own achievements" ON user_achievements
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ==================== MATCHES ====================
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

-- Spieler können eigene Matches sehen (GEFIXT in 002)
CREATE POLICY "Players can view own matches" ON matches
  FOR SELECT USING (
    auth.uid() = player1_id
    OR auth.uid() = player2_id
    OR (auth.uid() = player1_id AND friend_code IS NOT NULL)
  );

-- Auth Users können Matches erstellen
CREATE POLICY "Auth users can create matches" ON matches
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Spieler können eigene Matches aktualisieren + wartende Matches joinen
CREATE POLICY "Players can update own matches" ON matches
  FOR UPDATE USING (
    auth.uid() = player1_id
    OR auth.uid() = player2_id
    OR (status = 'waiting' AND player2_id IS NULL)
  );

-- ==================== MATCHMAKING_QUEUE ====================
ALTER TABLE matchmaking_queue ENABLE ROW LEVEL SECURITY;

-- Jeder kann Queue lesen
CREATE POLICY "Anyone can view queue" ON matchmaking_queue
  FOR SELECT USING (true);

-- Nur eigenen Queue-Eintrag verwalten
CREATE POLICY "Users can manage own queue entry" ON matchmaking_queue
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own queue entry" ON matchmaking_queue
  FOR DELETE USING (auth.uid() = user_id);
```

### 8.3 Realtime-Subscriptions

| Subscription | Tabelle | Event | Filter |
|-------------|---------|-------|--------|
| Matchmaking | `matches` | INSERT | `player2_id=eq.{userId}` |
| Match-Updates | `matches` | UPDATE | `id=eq.{matchId}` |

⚠️ Keine Subscription auf `matchmaking_queue` Änderungen

### 8.4 Indexes

⚠️ **Keine expliziten Indexes definiert** (nur automatische PK + UNIQUE)

**Empfohlene Indexes:**
```sql
CREATE INDEX idx_matches_player1 ON matches(player1_id);
CREATE INDEX idx_matches_player2 ON matches(player2_id);
CREATE INDEX idx_matches_status ON matches(status);
CREATE INDEX idx_matches_friend_code ON matches(friend_code) WHERE friend_code IS NOT NULL;
CREATE INDEX idx_queue_elo ON matchmaking_queue(elo_rating);
CREATE INDEX idx_profiles_elo ON profiles(elo_rating DESC);
```

### 8.5 Database Functions & Triggers

```sql
-- Auto-Profil-Erstellung bei User-Signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, username)
  VALUES (new.id, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

✅ `SECURITY DEFINER` — Trigger läuft mit erhöhten Rechten, notwendig für auth.users-Zugriff

⚠️ **Fehlende Triggers:**
- Kein `updated_at` Auto-Update Trigger auf `profiles`
- Kein Cleanup-Trigger für alte `matchmaking_queue` Einträge
- Kein Cleanup-Trigger für abgelaufene `matches` (status='waiting')

---

## 9. UI/UX & Responsiveness

### 9.1 Bildschirmgrößen

- ✅ **Mobile-First Design** mit BottomNav für Mobilgeräte
- ✅ NavBar für Desktop, BottomNav für Mobile
- ✅ CSS verwendet relative Einheiten und Flexbox/Grid
- ✅ PWA-optimiert (standalone Display)
- ⚠️ Kein expliziter Breakpoint-Test dokumentiert

### 9.2 Accessibility

- ⚠️ Keine explizite ARIA-Landmark-Struktur
- ⚠️ Keine Screenreader-Tests dokumentiert
- ⚠️ Kontrast-Prüfung nicht durchgeführt (Papier-Textur als Hintergrund könnte problematisch sein)
- ⚠️ Keyboard-Navigation nicht explizit implementiert
- ⚠️ Keine `aria-live` Regions für dynamische Inhalte (Score-Updates, Timer)
- ✅ Buttons haben lesbare Labels
- ✅ SVG-Icons sind dekorativ (keine fehlenden alt-Texte)

### 9.3 Ladezustände & Fehlermeldungen

| Stelle | Loading-State | Error-State |
|--------|--------------|-------------|
| KI-Scoring | ✅ Ladeanzeige mit Elapsed-Time | ✅ Fallback auf Heuristik |
| Rangliste | ✅ "Lade Rangliste…" | ⚠️ Fehlt (`.then()` ohne `.catch()`) |
| Matchmaking | ✅ Timer + "Suche Gegner…" | ⚠️ Kein expliziter Error-State |
| Online-Duell | ✅ Phase-basierte UI | ✅ Toast-Benachrichtigungen |
| Boss-Kampf | ✅ Spinner während Scoring | ✅ try/catch mit Fallback |
| ⚠️ Kein Skeleton-Screen | — | — |

### 9.4 Animationen & Transitions

- ✅ `PageTransition.jsx`: Crossfade (300ms) zwischen Seiten
- ✅ `Confetti.jsx`: CSS-only Gewinn-Animation (25 Partikel, 3s)
- ✅ `useCountUp`: Smooth requestAnimationFrame Counter
- ✅ `useTypewriter`: Schreibmaschinen-Effekt (40ms/Zeichen)
- ✅ CSS Transitions für Hover/Focus-Effekte
- ✅ Alle Animationen werden bei Unmount bereinigt
- ✅ Performance: CSS-Animationen (GPU-beschleunigt) bevorzugt

---

## 10. Deployment & Config

### 10.1 Vercel-Konfiguration

**`vercel.json`:**
```json
{
  "rewrites": [
    {
      "source": "/api/groq/:path*",
      "destination": "/api/groq/[...path]"
    },
    {
      "source": "/((?!assets|sounds|icons|manifest|sw|favicon).*)",
      "destination": "/index.html"
    }
  ]
}
```

- API-Aufrufe → Serverless Functions
- Alles andere → SPA Fallback (`index.html`)
- Statische Assets werden direkt ausgeliefert

### 10.2 Environment Variables

| Variable | Benötigt für | Wo gesetzt |
|----------|-------------|------------|
| `VITE_SUPABASE_URL` | Supabase-Verbindung | `.env` (Build-Zeit) |
| `VITE_SUPABASE_ANON_KEY` | Supabase Public Access | `.env` (Build-Zeit) |
| `GROQ_API_KEY` | Server-seitiges Scoring | Vercel Environment / Edge Function |
| `SUPABASE_URL` | Edge Function | Supabase automatisch |
| `SUPABASE_SERVICE_ROLE_KEY` | Edge Function (Admin) | Supabase automatisch |

### 10.3 Build-Prozess

```bash
# Entwicklung
npm run dev          # Vite Dev-Server (localhost:5173)

# Produktion
npm run build        # Vite Build → /dist
npm run start        # Node.js Server (localhost:3000)
npm run preview      # Build + Serve
```

**Build-Output:** `/dist` Verzeichnis mit:
- Gebündeltes JS (Tree-Shaking, Minification)
- CSS (Optimiert)
- Statische Assets

### 10.4 CI/CD

⚠️ **Kein CI/CD konfiguriert**
- Keine GitHub Actions
- Keine Test-Pipeline
- Kein Linting im Build-Prozess
- Vercel deployiert automatisch bei Push (wenn verbunden)

### 10.5 Domain-Setup

- Vercel-Hosting mit automatischem HTTPS
- SPA-Routing via Rewrites
- PWA mit `scope: "/"`

---

## 11. Code-Qualität

### 11.1 Duplizierter Code

| Stelle | Beschreibung | Empfehlung |
|--------|-------------|------------|
| Avatar-Anzeige | RanglistePage hat eigene Avatar-Logik | Könnte `AvatarCircle` Komponente werden |
| Loading-States | Ähnliche Loading-Pattern in mehreren Pages | Könnte `useLoadingState` Hook werden |
| Situation-Selection | Ähnliche Filter-Logik in DuellPage + UebungPage | Könnte `useSituation` Hook werden |

✅ **Generell gut** — BewertungDisplay, Card, Button etc. sind als wiederverwendbare Komponenten extrahiert

### 11.2 TypeScript-Nutzung

🔴 **Kein TypeScript verwendet**
- Alle Dateien sind `.js`/`.jsx`
- Keine Type-Definitionen
- Keine PropTypes (React)
- Einzige TS-Datei: `supabase/functions/score-text/index.ts` (Edge Function)

### 11.3 TODO/FIXME-Kommentare

✅ **Keine TODO/FIXME/HACK Kommentare im Code**

Stattdessen: Gut dokumentierte Fix-Kommentare in OnlineDuellPage (FIX 1-6) die erklären welcher Bug behoben wurde und warum.

### 11.4 Fehlerbehandlung

**Gute Stellen:**
- ✅ `OnlineDuellPage.jsx`: try/catch in `performScoring()` mit Fallback
- ✅ `ki-scorer.js`: Retry-Logik (2 Versuche) + Heuristik-Fallback
- ✅ `BossFight.jsx`: try/catch mit graceful Fallback
- ✅ `EinstellungenModal.jsx`: try/catch für API-Tests
- ✅ `storage.js`: Graceful Fallback bei localStorage-Fehler

**Problematische Stellen:**
- ⚠️ `RanglistePage.jsx`: `.then()` ohne `.catch()`
- ⚠️ `ErrorBoundary.jsx`: Existiert, aber nicht in `App.jsx` eingebunden
- ⚠️ Matchmaking: Fehler bei `findMatch()` könnte Spieler in Queue lassen

---

## Zusammenfassung

### Top-Stärken ✅

1. **Minimalistischer Tech-Stack** — Nur 7 Dependencies, kein Over-Engineering
2. **Offline-First Design** — Spiel funktioniert komplett ohne Backend
3. **Dual-Scoring** — KI-Bewertung mit Heuristik-Fallback
4. **Anti-Gaming System** — 11 Checks gegen Manipulation
5. **PWA-optimiert** — Installierbar, Offline-fähig, Network-First
6. **Saubere Subscription-Cleanup** — useEffect Returns korrekt implementiert
7. **Race-Condition-Fixes** — DB-Truth-Ansatz im Online-Modus
8. **ELO-System** — Standard-Implementierung mit K-Faktor-Anpassung
9. **Code-Organisation** — Klare Trennung: pages / components / engine / data

### Top-Risiken 🔴

1. **`.env` mit Live-Keys in Git** — Credentials müssen rotiert werden
2. **Client-seitiges Scoring im Online-Modus** — Manipulation möglich
3. **Kein Heartbeat/Presence** — Disconnects werden nicht erkannt
4. **Kein Rate-Limiting** — API-Endpoints ungeschützt
5. **ErrorBoundary nicht eingebunden** — Render-Fehler → weißer Bildschirm
6. **Keine DB-Indexes** — Performance-Problem bei wachsender Nutzerbasis
7. **Kein Match-Cleanup** — Stale Matches akkumulieren in DB
8. **Kein TypeScript** — Keine Compile-Time Type-Safety
9. **Forfeit aktualisiert keine Spieler-Stats** — ELO/Wins/Losses inkonsistent
10. **Kein CI/CD** — Keine automatisierten Tests oder Linting
