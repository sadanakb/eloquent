# ELOQUENT Wortduell — Komplettes Design-Overhaul
**Datum:** 2026-03-22
**Status:** Approved
**Scope:** Alle 10 Seiten + Design-System-Foundation

---

## 1. Ziel

Vollständige visuelle Überarbeitung des ELOQUENT Wortduell Frontends nach einer redaktionell-literarischen Designphilosophie. Die 4 Bug-Fixes aus der letzten Session (HeroPage-Icons, StoryPage-Handler, OnlineDuell-ErrorHandling, EinstellungenModal-API) sind bereits in Commit `b3aa15a` abgeschlossen — **nicht nochmals anfassen**.

**Leitprinzip:** „Gedruckte Eloquenz, digital erlebbar."

---

## 2. Technische Rahmenbedingungen

| Entscheidung | Gewählt | Begründung |
|---|---|---|
| Framework | React 18 + Vite + JSX (kein TypeScript) | Bestehende Codebasis |
| Styling | CSS Modules + CSS Custom Properties | Bestehende Architektur |
| Animationen | CSS Keyframes (existing `animations.css` erweitern) | Kein Framer Motion |
| Icons | `src/components/icons/Icons.jsx` (neue SVG-Komponenten) + Lucide React (Fallback) | Line-Art-Stil |
| Fonts | Cormorant Garamond, Inter, JetBrains Mono | Bereits in `src/styles/fonts.css` geladen |
| Backend/Auth/Engine | Supabase + Groq + alle 18 Engine-Dateien — **unverändert** | Nur visuelle Schicht |

---

## 3. Implementierungsansatz

**Phase 1 — Design-System** (Blockt Phase 2)
`theme.css` + `animations.css` + geteilte Komponenten: Button, Card, Input, Badge, Navbar, BottomNav, Ornament + Icons.

**Phase 2 — Parallele Seiten** (sobald Phase 1 committed)
Alle 10 Seiten gleichzeitig von parallelen Agenten.

---

## 4. Dark Mode — Vollständige Implementierung

**Aktivierung:** Zwei Wege gleichzeitig
1. System-Präferenz via `@media (prefers-color-scheme: dark)` → setzt automatisch `[data-theme="dark"]` auf `<html>`
2. Manueller Toggle in `EinstellungenModal.jsx` — **neues UI-Element hinzufügen**: Zeile mit SunIcon/MoonIcon, beim Klick:
   ```js
   const newTheme = current === 'dark' ? 'light' : 'dark';
   document.documentElement.dataset.theme = newTheme;
   localStorage.setItem('theme', newTheme);
   ```
   Der Toggle ist eine neue funktionale Ergänzung, nicht nur ein Styling-Change.

**Initialisierung** (in `main.jsx`, vor React-Render):
```js
const saved = localStorage.getItem('theme');
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
if (saved === 'dark' || (!saved && prefersDark)) {
  document.documentElement.dataset.theme = 'dark';
}
```

**CSS-Selektor:** Alle Dark-Mode-Token unter `[data-theme="dark"]` in `theme.css`:
```css
[data-theme="dark"] {
  --bg-parchment:       #141210;
  --bg-parchment-light: #1E1B17;
  --bg-parchment-dark:  #282420;
  /* ... etc */
}
```

---

## 5. Farbsystem — Token-Migration

### 5.1 Neue Token-Namen (in `theme.css`)

```css
:root {
  /* Hintergründe */
  --bg-parchment:       #F5F0E8;
  --bg-parchment-light: #FAF7F2;
  --bg-parchment-dark:  #EDE7DB;

  /* Gold */
  --gold-50:   #FDF8ED;
  --gold-100:  #F9EDCC;
  --gold-300:  #E5C458;
  --gold-500:  #C5960C;
  --gold-600:  #A67C0B;
  --gold-700:  #8A6609;
  --gold-800:  #6B4F07;

  /* Tinte */
  --ink-900:   #1A1612;
  --ink-800:   #2D2822;
  --ink-600:   #5C554B;
  --ink-400:   #8C8478;
  --ink-200:   #C7C0B5;

  /* Semantik */
  --accent-success: #4A7C59;
  --accent-error:   #9C4040;
  --accent-info:    #4A6B8A;
}

[data-theme="dark"] {
  --bg-parchment:       #141210;
  --bg-parchment-light: #1E1B17;
  --bg-parchment-dark:  #282420;
  --gold-300:  #D4A844;
  --gold-500:  #E5BC4A;
  --ink-900:   #F0EBE2;
  --ink-800:   #D4CFC8;
  --ink-600:   #B5AFA5;
  --ink-400:   #8C8478;
  --ink-200:   #3A3530;
}
```

### 5.2 Migrations-Tabelle (alte → neue Token-Namen)

**Scope:** Nur Farb-Tokens werden umbenannt. Alle anderen Tokens (Spacing, Radius, Shadow, Transition, Font) bleiben exakt wie sie sind — `theme.css` wird um neue Tokens erweitert, nicht ersetzt.

**Strategie:** Globales Find-Replace in **allen** CSS-Dateien und `.module.css`-Dateien im Projekt (inkl. `base.css`, `textures.css`, `styles/index.css`, und sämtliche `src/components/**/*.module.css` sowie `src/pages/**/*.module.css`).

| Alter Token | Neuer Token |
|---|---|
| `--bg-page` | `--bg-parchment` |
| `--bg-card` | `--bg-parchment-light` |
| `--bg-inset` | `--bg-parchment-dark` |
| `--bg-elevated` | `--bg-parchment-light` |
| `--bg-card-hover` | `--gold-50` |
| `--bg-hover` | `--gold-50` |
| `--bg-deep` | `--bg-parchment-dark` |
| `--accent-gold` | `--gold-500` |
| `--accent-gold-light` | `--gold-300` |
| `--accent-copper` | `--gold-300` |
| `--accent-warm` | `--gold-100` |
| `--accent-blue` | `--accent-info` |
| `--gold` | `--gold-500` |
| `--gold-bright` | `--gold-300` |
| `--gold-dark` | `--gold-700` |
| `--gold-dim` | `--gold-100` |
| `--text-primary` | `--ink-900` |
| `--text-secondary` | `--ink-600` |
| `--text-muted` | `--ink-400` |
| `--text-dim` | `--ink-400` |
| `--text` | `--ink-900` |
| `--border` | `--ink-200` |
| `--border-light` | `--ink-200` |
| `--border-gold` | `--gold-300` |
| `--success` | `--accent-success` |
| `--error` | `--accent-error` |
| `--red` | `--accent-error` |
| `--red-dim` | `var(--accent-error), opacity 0.3` → Inline-Lösung |
| `--green` | `--accent-success` |
| `--green-dim` | `var(--accent-success), opacity 0.3` → Inline-Lösung |
| `--warning` | `--gold-500` |

**Unverändert bleiben (nicht anfassen):**
`--radius-sm/md/lg`, `--shadow-card/elevated/inset`, `--transition-fast/base/slow`, `--space-xs/sm/md/lg/xl/2xl/3xl`, `--font-display/body/mono/logo`

`ornaments.css`: Inhalt in `Ornament.module.css` überführen, `ornaments.css` danach löschen. Import in `src/styles.css` und `src/styles/index.css` entfernen.

**Syntax-Hinweis:** Immer `var(--gold-500)` schreiben, niemals nackte `--gold-500`-Referenz ohne `var()`.

---

## 6. Typografie

```css
--font-display: 'Cormorant Garamond', Georgia, serif;
--font-body:    'Inter', system-ui, sans-serif;
--font-mono:    'JetBrains Mono', monospace;

--text-hero:     clamp(3.5rem, 8vw, 6rem);
--text-h1:       clamp(2rem, 4vw, 3rem);
--text-h2:       clamp(1.5rem, 2.5vw, 2rem);
--text-h3:       clamp(1.125rem, 1.5vw, 1.5rem);
--text-body:     1rem;
--text-small:    0.875rem;
--text-caption:  0.75rem;
--text-overline: 0.6875rem;
```

---

## 7. Komponentensystem

### 7.1 Button — 4 Varianten (Props: `variant`, `disabled`, `size`)

```
primary:   background var(--gold-500), color white, border-radius 8px,
           hover: var(--gold-600) + translateY(-1px) + box-shadow
secondary: transparent, border 1.5px solid var(--ink-200),
           hover: border-color var(--gold-300), color var(--gold-700), bg var(--gold-50)
tertiary:  no border/bg, color var(--gold-700), hover: underline
disabled:  background rgba(--ink-200, 30%), color var(--ink-400), cursor not-allowed
```

### 7.2 Card — 2 Varianten (Prop: `featured`)

```
standard:  bg var(--bg-parchment-light), border 1px solid rgba(0,0,0,0.06),
           border-radius 12px
           hover (wenn clickable): translateY(-2px), stärkerer Schatten
featured:  bg linear-gradient(135deg, var(--gold-50), var(--gold-100)),
           border-left 3px solid var(--gold-500)
```

### 7.3 Input — Neue Komponente (Props: `label`, `placeholder`, `value`, `onChange`)

```
background: white (light) / var(--bg-parchment-dark) (dark)
border: 1.5px solid var(--ink-200)
border-radius: 8px
padding: 12px 16px
font: Inter Regular 15px
placeholder: var(--ink-400), italic
focus: border-color var(--gold-500), box-shadow 0 0 0 3px rgba(197,150,12,0.15)
label (über Input): var(--gold-700), Inter SemiBold 12px, uppercase, letter-spacing 0.08em
```

### 7.4 Badge — 3 Varianten (Prop: `type`: `rank` | `category` | `wordtype`)

```
rank:      border 1.5px solid var(--gold-300), color var(--gold-700), bg transparent
category:  border 1px solid var(--ink-200), color var(--ink-600), bg transparent
           aktiv: bg var(--gold-500), color white
wordtype:  bg var(--bg-parchment-dark), color var(--ink-600), border-radius 4px
```

### 7.5 Ornament — Divider-Komponente

Zwei parallele horizontale Linien (2px + 1px, 3px Abstand) in Gold.
`src/ornaments.css` wird hierin überführt und dann gelöscht.

### 7.6 Navbar

```
sticky, top 0, height 64px
backdrop-filter blur(12px), background var(--bg-parchment) 90% opacity
border-bottom 1px solid rgba(0,0,0,0.06)
Logo: "ELOQUENT" Cormorant SemiBold 18px letter-spacing 0.2em + "Wortduell" Inter italic 13px
Nav-Items aktiv: Pill, bg var(--gold-50), color var(--gold-700)
```

### 7.7 BottomNav (Mobile ≤ 768px)

5 Items: Duell, Übung, Wörterbuch, Rangliste, Profil
Aktives Icon in var(--gold-500), Label var(--gold-700)

---

## 8. Animationen (alle in `animations.css`)

| Name | Einsatz | Details |
|---|---|---|
| `fadeInUp` | Seiten-Einstieg, Karten-Stagger | `opacity 0→1 + translateY(12px→0)`, 350ms ease-out |
| `scaleXIn` | Ornament-Linien | `scaleX(0→1)`, 400ms, nach Letter-Reveal |
| `progressFill` | XP-Balken | `width 0→Zielwert`, 1000ms ease-out, via CSS `animation` auf `.fill`-Element |
| `goldPulse` | Wort des Tages, Achievement-Unlock | `box-shadow golden glow → keine`, 600ms 1x |
| `shimmer` | Skeleton-Loading | Shimmer-Gradient links → rechts, 1500ms infinite |
| `searchPulse` | Matchmaking-Border | `box-shadow pulsiert`, 1200ms infinite |

**`letterReveal` — Implementierung:**
Der ELOQUENT-Schriftzug wird in JSX per JS in einzelne `<span>`-Elemente aufgeteilt:
```jsx
// HeroPage.jsx
"ELOQUENT".split("").map((char, i) => (
  <span key={i} className={styles.letter} style={{ animationDelay: `${i * 0.06}s` }}>
    {char}
  </span>
))
```
CSS in `HeroPage.module.css`:
```css
.letter {
  display: inline-block;
  opacity: 0;
  animation: fadeInUp 0.4s ease-out forwards;
}
```

---

## 9. Icon-Inventar (`src/components/icons/Icons.jsx`)

Alle Icons: SVG, `stroke-width: 1.5`, rounded line-caps, Props: `size` (default 24) + `color` (default `currentColor`).

| Komponente | Einsatz | Seite(n) |
|---|---|---|
| `CrossedFeathers` | Duell starten, Rang-Abzeichen | Hero, Duell, Profil |
| `GlobeNetwork` | Online Match | Hero, Online |
| `Bullseye` | Übungsmodus | Hero, Übung |
| `OpenBook` | Story-Modus, Wörterbuch | Hero, Story, Wörterbuch |
| `StarIcon` | Tages-Challenge, Favorit, Profil-Avatar | Hero, Profil |
| `BoltIcon` | Quick Match, VS-Symbol | Hero, Online, Duell |
| `ScrollIcon` | Challenge-Aufgabe, Regeln | Hero, Regeln |
| `ShieldIcon` | Profil, Rang-Anzeige | Profil, Rangliste |
| `TrophyIcon` | Errungenschaften, Rangliste-Podium | Achievements, Rangliste |
| `BookmarkBook` | Wörterbücherei Nav | Navbar, Wörterbuch |
| `SwordIcon` | Rang: Krieger | Rangliste, Profil |
| `CrownIcon` | Rang: Meister, Podium #1 | Rangliste |
| `FeatherIcon` | Rang: Schreiber | Rangliste, Profil |
| `SearchIcon` | Suchleiste | Wörterbuch |
| `LockIcon` | Gesperrte Errungenschaft | Achievements |
| `SunIcon` | Dark-Mode-Toggle (Light) | EinstellungenModal |
| `MoonIcon` | Dark-Mode-Toggle (Dark) | EinstellungenModal |

---

## 10. Seitenspezifische Designs

### 10.1 Startseite (`/`) — HeroPage
- Hero: ELOQUENT Letter-Reveal + Ornament-Linien (scaleX nach Buchstaben)
- 2 Hauptkarten: „Duell starten" (CrossedFeathers) + „Online Match" (GlobeNetwork)
- 3 Sekundär-Modi: Übung (Bullseye), Story (OpenBook), Tages-Challenge (StarIcon)
- Tages-Challenge: Featured-Karte, Wort-des-Tages darin, goldPulse-Animation
- Footer Quick-Links: Wörterbuch, Rangliste, Achievements, Regeln

### 10.2 Duell-Modus (`/duell`)
- 2 Input-Felder nebeneinander + ⚡ BoltIcon dazwischen
- „Weiter"-Button: disabled bis beide Namen ausgefüllt (JS: beide nicht leer)
- Mobile: Inputs vertikal gestapelt, VS-Icon dazwischen

### 10.3 Online-Duell (`/online`)
- Quick Match: Primär-Button → bei Klick: Text = „Suche läuft..." + searchPulse-Border
- Freund-Karte: Sekundär-Button „Code erstellen" + Tertiär-Link „Code eingeben" in einer Karte

### 10.4 Wörterbücherei (`/woerterbuch`)
- Wort des Tages: Featured-Karte + goldPulse beim Laden
- Kategorie-Chips: horizontal scrollbar (`overflow-x: auto`, `white-space: nowrap`), kein Umbruch
- Wort-Einträge: Stagger-fadeInUp, Hover → linker 3px Gold-Border via `border-left`

### 10.5 Profil (`/profil`)
- 4 Stat-Boxen Desktop: `grid-template-columns: repeat(4, 1fr)`
- 4 Stat-Boxen Mobile: `repeat(2, 1fr)` (2×2)
- XP-Balken: progressFill-Animation beim Laden
- Match-Verlauf: `border-left: 3px solid var(--accent-success/error)`

### 10.6 Übungsmodus (`/uebung`)
- Streak-Streifen oben (7 Tages-Punkte)
- Desktop: `grid-template-columns: 1fr 200px` (Task + Skill-Sidebar)
- Skill-Sidebar: 4 Skill-Balken + Fokus-Hinweis
- Mobile: Sidebar als ausklappbarer Strip unter Task (`<details>` oder State-Toggle)
- Task-Karte: Chips (Kategorie + Schwierigkeit) + **eine Frage** + Textarea + Button

### 10.7 Story-Modus (`/story`)
- Kapitel-Header mit atmosphärischem Gradient + Kapitel-Fortschritts-Dots
- Szenen-Karte: Schauplatz-Label + Blockquote-Dialog + Aufgaben-Box
- Choices: Buchstaben-Pills (A/B/C) + voller Satztext
- Ruf-Fortschrittsbalken
- Story-Subkomponenten (`src/components/story/`) werden mitgestylt (gleiches Design-System)

### 10.8 Rangliste (`/rangliste`)
- Podium: Top 3 mit Podest-Blöcken + `#1` mit CrownIcon + Gold-Glow
- Podium Mobile: verkleinertes Podium, Avatare kleiner (40px statt 64px/48px), Podest-Höhen halbiert
- Filter-Tabs: Global / Freunde / Diese Woche
- Eigener Platz: sticky am Ende mit „Noch X Plätze bis Rang Y →" CTA (dashed border)

### 10.9 Errungenschaften (`/achievements`)
- Hero: Zuletzt freigeschaltet (großes Badge + X/29 Zähler + Fortschrittsbalken)
- „Fast geschafft"-Banner: grüner Akzent + Balken + „Jetzt spielen"-Button
- Badge-Grid Desktop: `repeat(5, 1fr)`, Mobile: `repeat(3, 1fr)` bei ≤ 480px, `repeat(2, 1fr)` bei ≤ 360px
- Gesperrte: `filter: grayscale(1)` + `opacity: 0.5`, Hover zeigt `title`-Tooltip

### 10.10 Regeln (`/regeln`)
- Ornament-Header + „REGELN" + Cormorant Italic Subtitle
- Tab-Leiste oben (`overflow-x: auto`, kein Umbruch) — keine Sidebar
- Tab-Inhalte: Blockzitate + Score-Grid
- Score-Grid Desktop: `repeat(4, 1fr)`, Mobile: `repeat(2, 1fr)`

---

## 11. Responsive Design

| Breakpoint | Änderungen |
|---|---|
| `> 768px` | Navbar, alle Grid-Layouts, Sidebar sichtbar |
| `≤ 768px` | BottomNav, Duell-Inputs gestapelt, Skill-Sidebar ausklappbar, Podium verkleinert |
| `≤ 480px` | Achievement-Grid 3 Spalten, Score-Grid 2 Spalten |
| `≤ 375px` | Alle Layouts getestet, min-width auf Container: 320px |

**Touch-Targets:** Alle interaktiven Elemente `min-height: 44px; min-width: 44px`.

---

## 12. Zu ändernde Dateien

```
src/styles/
  theme.css             ← Vollständig ersetzen (neue Tokens + Dark-Mode-Selektor)
  base.css              ← Token-Namen aktualisieren (Migrations-Tabelle)
  animations.css        ← Erweitern: fadeInUp, scaleXIn, progressFill, goldPulse, shimmer, searchPulse
  ornaments.css         ← LÖSCHEN (Inhalt → Ornament.module.css)
  fonts.css             ← unverändert
  textures.css          ← Token-Namen aktualisieren

src/components/
  Button.jsx + Button.module.css        ← Neu: 4 Varianten
  Card.jsx + Card.module.css            ← Neu: standard + featured
  Input.jsx + Input.module.css          ← NEU ERSTELLEN
  Badge.jsx + Badge.module.css          ← Neu: 3 Varianten
  NavBar.jsx + NavBar.module.css        ← Überarbeiten
  BottomNav.jsx + BottomNav.module.css  ← Überarbeiten
  Ornament.jsx + Ornament.module.css    ← Neu (ornaments.css überführen)
  icons/Icons.jsx                       ← NEU ERSTELLEN (Verzeichnis anlegen)

src/components/story/
  BossFight.jsx + BossFight.module.css
  CharacterSelect.jsx + CharacterSelect.module.css
  FillBlankChallenge.jsx + FillBlankChallenge.module.css
  FreeTextChallenge.jsx + FreeTextChallenge.module.css
  MultipleChoiceChallenge.jsx + MultipleChoiceChallenge.module.css
  StoryDecision.jsx + StoryDecision.module.css
  WordOrderChallenge.jsx + WordOrderChallenge.module.css
  ← Alle: Token-Namen aktualisieren + Design-System anwenden

src/pages/
  HeroPage.jsx + HeroPage.module.css
  DuellPage.jsx + DuellPage.module.css
  OnlineDuellPage.jsx + OnlineDuellPage.module.css
  WoerterbuchPage.jsx + WoerterbuchPage.module.css
  ProfilePage.jsx + ProfilePage.module.css
  UebungPage.jsx + UebungPage.module.css
  StoryPage.jsx + StoryPage.module.css
  RanglistePage.jsx + RanglistePage.module.css
  AchievementPage.jsx + AchievementPage.module.css
  RegelnPage.jsx + RegelnPage.module.css
  ← Alle: Token-Namen + neues Design-System

src/main.jsx                          ← Dark-Mode-Initialisierung hinzufügen
src/styles.css                        ← ornaments.css-Import entfernen
src/styles/index.css                  ← ornaments.css-Import entfernen, Token-Namen prüfen
src/components/EinstellungenModal.jsx + EinstellungenModal.module.css
                                      ← NEU: Dark-Mode-Toggle (Sun/Moon) + localStorage-Logik
src/components/AntwortEingabe.jsx + AntwortEingabe.module.css   ← Token-Namen
src/components/AuthModal.jsx + AuthModal.module.css             ← Token-Namen
src/components/BewertungDisplay.jsx + BewertungDisplay.module.css ← Token-Namen
src/components/Confetti.jsx                                     ← Token-Namen (falls CSS)
src/components/DailyChallenge.jsx + DailyChallenge.module.css   ← Token-Namen
src/components/GoldBar.jsx + GoldBar.module.css                 ← Token-Namen
src/components/GoldParticles.jsx                                ← Token-Namen (falls CSS)
src/components/InstallPrompt.jsx + InstallPrompt.module.css     ← Token-Namen
src/components/Logo.jsx + Logo.module.css                       ← Token-Namen
src/components/PageTransition.jsx                               ← Token-Namen (falls CSS)
src/components/SetupWizard.jsx + SetupWizard.module.css         ← Token-Namen
src/components/Toast.jsx + Toast.module.css                     ← Token-Namen

App.jsx                 ← unverändert (Router bleibt)
src/engine/             ← unverändert
src/lib/                ← unverändert
src/contexts/           ← unverändert
src/data/               ← unverändert
```

---

## 13. Qualitätscheckliste

- [ ] Alle 10 Seiten implementiert und über Router erreichbar
- [ ] Dark Mode: System-Präferenz + Toggle in EinstellungenModal funktioniert
- [ ] WCAG AA Kontrast — Gold als Text immer `var(--gold-700)` oder dunkler
- [ ] Button-Hierarchie (Primär/Sekundär/Tertiär/Disabled) konsistent
- [ ] Alle Icons aus `Icons.jsx` — keine Platzhalter
- [ ] letterReveal-Animation auf HeroPage (Buchstabe für Buchstabe)
- [ ] Mobile-Layouts bei 375px getestet und lesbar
- [ ] Touch-Targets ≥ 44×44px
- [ ] Skeleton-Shimmer für asynchrone Bereiche
- [ ] Leere Zustände mit Motiv-Text + CTA
- [ ] Alle Farben via `var(--token)` — kein nackter Hex-Code in CSS Modules
- [ ] `ornaments.css` gelöscht, Import entfernt
- [ ] Token-Migration vollständig (kein `--bg-page`, `--text-primary` etc. mehr im Code)
