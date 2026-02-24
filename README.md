# ELOQUENT — Das Wortduell

**Die Kunst der Sprache als Wettkampf.**

ELOQUENT entstand aus einer einfachen Frage: Wie trainiert man Eloquenz, ohne einen Rhetorik-Kurs zu besuchen? Als jemand, der Deutsch, Persisch, Englisch und Französisch spricht, fasziniert mich Sprache — und ich wollte ein Spiel bauen, das Wortgewandtheit zum Wettkampf macht.

ELOQUENT ist ein deutschsprachiges Wortduell-Spiel, bei dem Spieler ihre Eloquenz und rhetorische Qualität unter Beweis stellen. Tretet in spannenden Situationen gegeneinander an, lasst eure Texte von KI bewerten und erweitert euren Wortschatz — ob im Duell, im Training oder im Story-Modus.

## Spielmodi

### Duell-Modus
Zwei Spieler, drei Runden, ein Gewinner. Gleiche Situation, wer formuliert besser? Mit Timer und steigender Schwierigkeit (Leicht → Mittel → Schwer).

### Übungs-Modus
Alleine trainieren, KI-Feedback erhalten und den eigenen Stil verbessern. Wähle deine Schwierigkeit und arbeite an deiner Eloquenz.

### Story-Modus
*Die Akademie der verlorenen Worte* — ein interaktives Abenteuer, bei dem du durch Wortschatz-Challenges eine mysteriöse Akademie erkundest. Weniger Schreiben, mehr Entdecken. Perfekt zum Wortschatz-Aufbau!

### Wörterbücherei
Durchsuche gehobene deutsche Wörter mit Definitionen, Beispielsätzen und Synonymen.

## Features

- **Timer pro Spieler**: Keine unendliche Zeit — Leicht: 3 Min, Mittel: 2:30, Schwer: 2 Min
- **Wort-Inspiration**: Aufklappbares Panel mit zufälligen gehobenen Wörtern + Definitionen während des Schreibens
- **KI-Bewertung mit Ollama**: Lokale, kostenlose Bewertung durch ein LLM mit detailliertem Feedback
- **7 Bewertungskategorien**: Situationsbezug, Wortvielfalt, Rhetorik, Wortschatz, Argumentation, Kreativität, Textstruktur (100 Punkte gesamt)
- **45+ Spielsituationen**: 15 leichte, 15 mittlere, 15 schwere — von Alltagsthemen bis Parlamentsreden
- **Anti-Gaming**: Erkennt Keyword-Stuffing, Spam und Wortsalat
- **Heuristik-Fallback**: Funktioniert auch komplett offline ohne KI (aber im Moment mit Vorsicht zu genießen, wird aber immer besser)
- **Rangliste**: Lokale Bestenliste für Duell-Ergebnisse

## Schnellstart

### 1. Repository klonen

```bash
git clone https://github.com/sadanakb/eloquent.git
cd eloquent
```

### 2. Dependencies installieren

```bash
npm install
```

### 3. Ollama einrichten (empfohlen)

Ollama ist der empfohlene Weg, ELOQUENT zu nutzen. Es läuft lokal auf deinem Rechner, ist kostenlos und liefert die besten Bewertungen.

```bash
# 1. Ollama installieren (https://ollama.com)
# 2. Ein Sprachmodell herunterladen:
ollama pull llama3.2

# 3. Ollama läuft automatisch im Hintergrund
```

> **Warum Ollama?** Die KI-Bewertung mit Ollama versteht den semantischen Kontext deiner Antworten, erkennt rhetorische Mittel und gibt konkretes, hilfreiches Feedback. Die Heuristik-Engine (ohne KI) funktioniert auch, aber Ollama macht das Spiel deutlich besser.

**Alternativ: Groq Cloud** (kostenlos, kein lokales Modell nötig)
1. Account erstellen auf [console.groq.com](https://console.groq.com) (keine Kreditkarte)
2. API-Key generieren
3. Im Setup-Wizard der App eingeben

### 4. Starten

```bash
npm run dev
```

Die App startet auf `http://localhost:5173`. Beim ersten Start führt ein Setup-Wizard durch die KI-Einrichtung.

## Bewertungssystem

### 7 Kategorien (100 Punkte gesamt)

| Kategorie | Max | Beschreibung |
|---|---|---|
| Situationsbezug | 15 | Wie gut bezieht sich die Antwort auf die Situation? |
| Wortvielfalt | 15 | Abwechslungsreiche Wortwahl, keine Wiederholungen |
| Rhetorik | 25 | Rhetorische Mittel (Metaphern, Antithesen, Trikolon...) |
| Wortschatz | 15 | Gehobene Ausdrücke, Fremdwörter, differenzierter Wortschatz |
| Argumentation | 15 | Logische Gedankenführung, Kausalketten |
| Kreativität | 10 | Originelle Formulierungen, bildhafte Sprache |
| Textstruktur | 5 | Kohärenz, Konnektoren, logischer Aufbau |

### Punkteverteilung (mit KI)

- **80-100**: Meisterhaft — nahezu perfekte Eloquenz
- **60-79**: Sehr gut — starke rhetorische Leistung
- **40-59**: Gut — solides Niveau mit Potenzial
- **20-39**: Ausbaufähig — Grundlagen vorhanden
- **0-19**: Schwach — mehr Substanz nötig

### KI vs. Heuristik

| | KI (Ollama/Groq) | Heuristik (Offline) |
|---|---|---|
| Sprachverständnis | Semantisch | Regelbasiert |
| Rhetorik-Erkennung | Kontextbasiert | Pattern-Matching |
| Feedback | Individuell & konkret | Template-basiert |
| Verfügbarkeit | Ollama/Internet nötig | Immer verfügbar |

## Projektstruktur

```
eloquent/
├── src/
│   ├── engine/                    # Bewertungs-Engine
│   │   ├── scoring-engine.js      # Hauptlogik: KI + Heuristik
│   │   ├── ki-scorer.js           # Ollama & Groq Integration
│   │   ├── heuristic-scorer.js    # Offline-Bewertung
│   │   ├── rhetorik-detector.js   # Rhetorische Mittel
│   │   └── anti-gaming.js         # Anti-Manipulation
│   ├── data/
│   │   ├── situationen.js         # 45+ Spielsituationen
│   │   ├── woerterbuch.js         # Gehobene Wörter + Definitionen
│   │   └── raenge.js              # Ränge & Noten
│   ├── components/                # React-Komponenten
│   │   ├── AntwortEingabe.jsx     # Texteingabe + Timer + Wort-Inspiration
│   │   ├── BewertungDisplay.jsx   # Ergebnis-Anzeige
│   │   └── ...
│   ├── pages/
│   │   ├── DuellPage.jsx          # Duell-Modus
│   │   ├── UebungPage.jsx         # Übungs-Modus
│   │   ├── StoryPage.jsx          # Story-Modus
│   │   ├── WoerterbuchPage.jsx    # Wörterbücherei
│   │   └── ...
│   ├── App.jsx
│   └── styles.css
├── main.jsx
├── index.html
├── vite.config.js
└── package.json
```

## Tech-Stack

- **Frontend**: React 18 + Vite 6
- **Styling**: CSS Custom Properties (Dark Theme)
- **Fonts**: Playfair Display, DM Sans, JetBrains Mono
- **KI**: Ollama (lokal) / Groq Cloud (Llama 3.3 70B)

## Autor

**Sadan Akbari** — Wirtschaftsinformatik-Student an der Frankfurt University of Applied Sciences

[Portfolio](https://sadanakb.github.io) · [LinkedIn](https://www.linkedin.com/in/sadan-akbari) · [GitHub](https://github.com/sadanakb)

## Lizenz

MIT — siehe [LICENSE](LICENSE).
