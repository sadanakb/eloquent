# Checkpoint — 2026-03-22

## Ziel
Komplettes Frontend-Redesign von ELOQUENT Wortduell — alle 10 Seiten + Design-System-Foundation.
Design-Philosophie: "Gedruckte Eloquenz, digital erlebbar" (Cormorant Garamond, Tinte & Gold).

## Erledigt
- [x] Task 1: Token Migration + theme.css + Dark Mode Init (Commit: 5311d54)
- [x] Task 2: animations.css — goldPulse, shimmer, scaleXIn, progressFill, searchPulse (Commit: f108f9e)
- [x] Task 3: Icons.jsx — 17 SVG-Komponenten (Commit: 17e2499)
- [x] Task 4: Button Redesign — primary/secondary/tertiary/ghost/danger Varianten (Commit: c3eeaa3)
- [x] Task 5+6: Card Redesign + Input neu erstellt (Commit: 13f8d0e)
- [x] Task 7+8: Badge Redesign + Ornament + ornaments.css gelöscht (Commit: bb0a100)
- [x] Task 9: NavBar + BottomNav Redesign (Commit: 18bfba2)
- [x] Task 10: EinstellungenModal + Dark Mode Toggle (Commit: aa15bb9)

## Laufend (Parallele Agenten)
- [ ] Task 11: HeroPage Redesign
- [ ] Task 12: DuellPage Redesign
- [ ] Task 13: OnlineDuellPage Redesign
- [ ] Task 14: WoerterbuchPage Redesign
- [ ] Task 15: ProfilePage Redesign
- [ ] Task 16: UebungPage Redesign
- [ ] Task 17: StoryPage + 7 Subkomponenten
- [ ] Task 18: RanglistePage Redesign
- [ ] Task 19: AchievementPage Redesign
- [ ] Task 20: RegelnPage Redesign

## Offen
- [ ] Task 21: Final Sweep + verbleibende Komponenten (nach Tasks 11-20)

## Entscheidungen
- Token-Aliase: alte Token-Namen bleiben als CSS-Variable-Referenzen erhalten (zero breakage)
- Stack: JSX + CSS Modules (kein TypeScript, kein Tailwind, kein Framer Motion)
- Parallele Agenten für unabhängige Seiten (verschiedene Dateien = keine Git-Konflikte)

## Build/Test-Status
- Build: OK (alle Phase-1-Commits erfolgreich)
- Letzter Commit: 18bfba2 feat: redesign Navbar + BottomNav styles

## Naechster Schritt
Warten auf Completion aller 10 Page-Agenten (Tasks 11-20).
Dann: Task 21 — Final Sweep (verbleibende Komponenten, Token-Bereinigung, finales Build-Check).
