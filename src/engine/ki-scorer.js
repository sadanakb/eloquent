// ──────────────────────────────────────────────────────
// ELOQUENT — KI-Bewertung (2-Agenten-System)
// Schritt 1: Research-Agent (Textanalyse)
// Schritt 2: Bewertungs-Agent (Scoring auf Basis der Analyse)
// Provider: Groq (Cloud)
// ──────────────────────────────────────────────────────

const GROQ_PROXY = '/api/groq'; // Vite proxy → api.groq.com

// ──────────────────────────────────────────────────────
// Schritt 1: Research-Agent — Reine Textanalyse
// ──────────────────────────────────────────────────────

const RESEARCH_PROMPT = `Analysiere diesen deutschen Text. Vergib KEINE Punkte. Sammle nur Fakten.

SITUATION: {titel} — {kontext}. {beschreibung}

TEXT: "{antwort}"

Aufgaben:

1. STILMITTEL suchen. Kopiere das EXAKTE Zitat aus dem Text.
Beispiel: Text ist "Die Zeit fliegt davon" → name: "Personifikation", zitat: "Die Zeit fliegt davon"
Beispiel: Text ist "nicht um zu klagen, sondern um zu handeln" → name: "Antithese", zitat: "nicht um zu klagen, sondern um zu handeln"
Mögliche Stilmittel: Metapher, Vergleich, Personifikation, Antithese, Trikolon, Chiasmus, Klimax, Anapher, rhetorische Frage, Alliteration, Hyperbel.
REGEL: Wenn du kein exaktes Zitat hast, liste das Mittel NICHT auf.

2. GEHOBENE WÖRTER finden. Nur Wörter die WÖRTLICH im Text stehen.
Gehobene Wörter sind z.B.: erachten, Privileg, renommiert, außerordentlich, mannigfaltig, Resilienz, nichtsdestotrotz, gleichwohl, eloquent, prädestiniert, erörtern, sublim, indes, vermögen (im Sinne von "können"), gewahr, obliegen, anmuten.
Auch gehobene Adjektive und Substantive zählen: "bemerkenswert", "Wertschätzung", "Gegenüber" etc.

3. SATZSTRUKTUR: Wie viele Sätze? Gibt es Nebensätze? Gibt es Konnektoren (weil, da, deshalb, jedoch)?

4. SITUATIONSBEZUG: Passt der Text zur beschriebenen Situation? Was genau bezieht sich darauf?

5. ARGUMENTATION: Gibt es Begründungen (weil, da, denn)? Gibt es eine These und Schlussfolgerung? Wenn der Text eine Begrüßung/Rede ohne Argument ist, schreibe "keine Argumentation nötig".

6. KREATIVITÄT: Gibt es originelle Formulierungen? Bildsprache?

7. SPAM-CHECK: Ist der Text sinnvoll oder Keyword-Stuffing? Grammatisch korrekt?

Antworte NUR mit JSON:
{
  "mittel": [{"name": "Antithese", "zitat": "nicht um zu klagen, sondern um zu handeln"}],
  "gehobene_woerter": ["erachten", "Privileg"],
  "saetze": 3,
  "nebensaetze": true,
  "konnektoren": ["weil", "deshalb"],
  "aufbau": "Einleitung und Argumentation",
  "situationsbezug": "Ja, der Text geht direkt auf die Situation ein durch...",
  "tonfall_passt": true,
  "argumentation": "These X wird mit Y begründet",
  "kreativ": "Die Formulierung X ist originell",
  "ist_spam": false,
  "grammatisch_ok": true
}`;

// ──────────────────────────────────────────────────────
// Schritt 2: Bewertungs-Agent — Scoring auf Basis der Analyse
// ──────────────────────────────────────────────────────

const BEWERTUNG_PROMPT = `Bewerte diesen Text für das Eloquenz-Spiel. Die Analyse wurde bereits gemacht — du musst NUR Punkte vergeben und Feedback schreiben.

SITUATION: {titel} — {kontext}. {beschreibung}
TEXT: "{antwort}"

ANALYSE-ERGEBNISSE:
{research}

PUNKTE VERGEBEN (100 Punkte gesamt):

1. situationsbezug (0-15): Passt der Text zur Situation? Nutze "situationsbezug" aus der Analyse.
2. wortvielfalt (0-15): Wie abwechslungsreich sind die Wörter? Wenig Wiederholungen = gut.
3. rhetorik (0-25): Wie viele Stilmittel hat die Analyse gefunden? 0 Mittel=0-5, 1-2 Mittel=6-12, 3+ Mittel=13-18, 5+ Mittel=19-25.
4. wortschatz (0-15): Wie viele gehobene Wörter hat die Analyse gefunden? 0=0-3, 1-2=4-7, 3-4=8-11, 5+=12-15.
5. argumentation (0-15): Gibt es logische Begründungen? WICHTIG: Wenn der Text eine Begrüßung, Rede oder Ansprache ist und keine Argumentation braucht, vergib trotzdem 4-8 Punkte für die implizite Überzeugungskraft.
6. kreativitaet (0-10): Originelle Formulierungen? Bildsprache?
7. textstruktur (0-5): Guter Aufbau? Nebensätze? Konnektoren?

KONSISTENZ:
- Einfache Alltagssprache ohne Stilmittel → max 40 Punkte
- 1-2 Stilmittel + einige gehobene Wörter → 40-55 Punkte
- 2-3 Stilmittel + guter Wortschatz → 50-65 Punkte
- 4+ Stilmittel + gehobener Wortschatz → 60-80 Punkte

ANTI-GAMING: Wenn ist_spam=true → 0 Punkte. Wenn grammatisch_ok=false → Punkte stark reduzieren.

Übernimm die Stilmittel und gehobenen Wörter DIREKT aus der Analyse in dein JSON. Kopiere die Zitate und Wörter.

Bei "empfehlungen": Schlage 3 gehobene deutsche Wörter vor, die der Spieler NICHT verwendet hat, die aber zum Thema passen.
Beispiel: {"wort": "erörtern", "bedeutung": "Ein Thema ausführlich besprechen. Beispiel: Lassen Sie uns diese Frage erörtern."}

Antworte NUR mit JSON:
{
  "kategorien": {
    "situationsbezug": {"p": 10, "f": "Guter Bezug zur Situation, der Text geht auf X ein."},
    "wortvielfalt": {"p": 8, "f": "Abwechslungsreiche Wortwahl mit X und Y."},
    "rhetorik": {"p": 12, "f": "2 Stilmittel erkannt: Antithese und Metapher."},
    "wortschatz": {"p": 8, "f": "Gehobene Wörter wie X und Y verwendet."},
    "argumentation": {"p": 6, "f": "Grundlegende Struktur mit Begründung."},
    "kreativitaet": {"p": 4, "f": "Originelle Formulierung bei X."},
    "textstruktur": {"p": 3, "f": "Guter Aufbau mit Einleitung und Hauptteil."}
  },
  "mittel": [{"name": "Antithese", "beispiel": "exaktes Zitat aus dem Text"}],
  "gehobene": ["wort1", "wort2"],
  "feedback": "2 Sätze: Was war gut? Was kann besser werden?",
  "tipps": ["Konkreter Tipp 1", "Konkreter Tipp 2", "Konkreter Tipp 3"],
  "empfehlungen": [
    {"wort": "erörtern", "bedeutung": "Ein Thema ausführlich besprechen. Beispiel: Lassen Sie uns diese Frage erörtern."},
    {"wort": "indes", "bedeutung": "Jedoch, währenddessen. Beispiel: Indes bleibt die Frage offen."},
    {"wort": "mannigfaltig", "bedeutung": "Vielfältig, reichhaltig. Beispiel: Die mannigfaltigen Aspekte dieses Themas."}
  ]
}`;

function sanitizeForPrompt(text) {
  return String(text).replace(/[{}"`]/g, ' ').slice(0, 2000);
}

function buildResearchPrompt(situation, antwort) {
  return RESEARCH_PROMPT
    .replace('{titel}', sanitizeForPrompt(situation.titel || ''))
    .replace('{kontext}', sanitizeForPrompt(situation.kontext || ''))
    .replace('{beschreibung}', sanitizeForPrompt(situation.beschreibung || ''))
    .replace('{antwort}', sanitizeForPrompt(antwort));
}

function buildBewertungPrompt(situation, antwort, researchJson) {
  return BEWERTUNG_PROMPT
    .replace('{titel}', sanitizeForPrompt(situation.titel || ''))
    .replace('{kontext}', sanitizeForPrompt(situation.kontext || ''))
    .replace('{beschreibung}', sanitizeForPrompt(situation.beschreibung || ''))
    .replace('{antwort}', sanitizeForPrompt(antwort))
    .replace('{research}', JSON.stringify(researchJson, null, 2));
}

// ──────────────────────────────────────────────────────
// JSON Parsing Helper
// ──────────────────────────────────────────────────────

function parseJson(text, label) {
  try {
    return JSON.parse(text);
  } catch {
    const jsonMatch = text.match(/\{[\s\S]*?\}(?=[^}]*$)/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    // Fallback: try to find any JSON block
    const blockMatch = text.match(/\{[\s\S]*\}/);
    if (blockMatch) {
      return JSON.parse(blockMatch[0]);
    }
    throw new Error(`${label}: JSON-Parsing fehlgeschlagen`);
  }
}

// ──────────────────────────────────────────────────────
// Low-Level API Calls
// ──────────────────────────────────────────────────────

async function callGroq(apiKey, messages) {
  const res = await fetch(`${GROQ_PROXY}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages,
      temperature: 0.15,
      response_format: { type: 'json_object' },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Groq Fehler (${res.status}): ${err.slice(0, 150)}`);
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error('Groq: Keine Antwort');
  return text;
}

// ──────────────────────────────────────────────────────
// Groq (cloud, free tier) — 2-Schritt
// ──────────────────────────────────────────────────────

async function groqScore(apiKey, situation, antwort) {
  // Schritt 1: Research-Agent
  console.log('[Research-Agent] Groq → llama-3.3-70b-versatile — Textanalyse...');
  const researchPrompt = buildResearchPrompt(situation, antwort);
  const researchText = await callGroq(apiKey, [
    { role: 'system', content: 'Du bist ein Textanalyst. Antworte NUR mit JSON.' },
    { role: 'user', content: researchPrompt },
  ]);

  const researchResult = parseJson(researchText, 'Research-Agent');
  console.log(`[Research-Agent] Analyse abgeschlossen:`, {
    mittel: researchResult.mittel?.length || 0,
    gehobene: researchResult.gehobene_woerter?.length || 0,
  });

  // Schritt 2: Bewertungs-Agent
  console.log('[Bewertungs-Agent] Groq → llama-3.3-70b-versatile — Scoring...');
  const bewertungPrompt = buildBewertungPrompt(situation, antwort, researchResult);
  const bewertungText = await callGroq(apiKey, [
    { role: 'system', content: 'Du bist ein Bewertungs-Professor. Antworte NUR mit JSON.' },
    { role: 'user', content: bewertungPrompt },
  ]);

  console.log('[Bewertungs-Agent] Scoring abgeschlossen');
  return { text: bewertungText, provider: 'groq', model: 'llama-3.3-70b-versatile' };
}

// ──────────────────────────────────────────────────────
// Unified AI Scoring
// ──────────────────────────────────────────────────────

function parseAiResult(rawText) {
  let result;
  try {
    result = JSON.parse(rawText);
  } catch {
    const jsonMatch = rawText.match(/```json\s*([\s\S]*?)```/) || rawText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      result = JSON.parse(jsonMatch[1] || jsonMatch[0]);
    } else {
      throw new Error('JSON-Parsing fehlgeschlagen');
    }
  }

  if (!result.kategorien) throw new Error('Antwort hat keine "kategorien"');

  const maxMap = {
    situationsbezug: 15, wortvielfalt: 15, rhetorik: 25,
    wortschatz: 15, argumentation: 15, kreativitaet: 10, textstruktur: 5,
  };

  for (const [key, max] of Object.entries(maxMap)) {
    const val = result.kategorien[key];
    if (val && typeof val === 'object' && val !== null) {
      result.kategorien[key].p = Math.max(0, Math.min(Number(val.p) || 0, max));
      result.kategorien[key].f = String(val.f || '');
    } else {
      result.kategorien[key] = { p: 0, f: '' };
    }
  }

  result.mittel = result.mittel || [];
  result.gehobene = result.gehobene || [];
  result.feedback = result.feedback || '';
  result.tipps = (result.tipps || []).slice(0, 3);
  result.empfehlungen = (result.empfehlungen || []).slice(0, 3);
  result.gaming = false;

  return result;
}

const MAX_RETRIES = 2; // Pro Provider: 1 Erstversuch + 2 Retries = 3 Versuche

async function mitRetry(fn, providerName) {
  let lastError;
  for (let versuch = 1; versuch <= MAX_RETRIES + 1; versuch++) {
    try {
      const rawResult = await fn();
      const result = parseAiResult(rawResult.text);
      result._provider = rawResult.provider;
      result._model = rawResult.model;
      result._versuch = versuch;
      return result;
    } catch (e) {
      lastError = e;
      if (versuch <= MAX_RETRIES) {
        const wartezeit = versuch * 2000; // 2s, 4s
        console.warn(`[ELOQUENT KI] ${providerName} Versuch ${versuch} fehlgeschlagen: ${e.message} — Retry in ${wartezeit / 1000}s...`);
        await new Promise(r => setTimeout(r, wartezeit));
      }
    }
  }
  throw lastError;
}

export async function aiBewertung(situation, antwort) {
  const situObj = typeof situation === 'string'
    ? { titel: '', kontext: '', beschreibung: situation }
    : situation;

  const groqKey = getGroqKey();
  if (!groqKey) {
    throw new Error('Kein Groq API-Key konfiguriert');
  }

  return await mitRetry(() => groqScore(groqKey, situObj, antwort), 'Groq');
}

// ──────────────────────────────────────────────────────
// Provider Management
// ──────────────────────────────────────────────────────

export function getGroqKey() {
  // Migration: alten localStorage-Key nach sessionStorage übernehmen
  const oldKey = localStorage.getItem('eloquent_groq_key');
  if (oldKey) {
    try { sessionStorage.setItem('eloquent_groq_key', btoa(oldKey)); } catch {}
    localStorage.removeItem('eloquent_groq_key');
  }
  const encoded = sessionStorage.getItem('eloquent_groq_key') || '';
  if (!encoded) return '';
  try { return atob(encoded); } catch { return ''; }
}

export function setGroqKey(key) {
  // Alten localStorage-Eintrag entfernen (Migration)
  localStorage.removeItem('eloquent_groq_key');
  if (key) {
    try { sessionStorage.setItem('eloquent_groq_key', btoa(key.trim())); } catch { /* non-ASCII key */ }
  } else {
    sessionStorage.removeItem('eloquent_groq_key');
  }
}

export function hasAiProvider() {
  return !!getGroqKey();
}

export function getAiStatus() {
  return {
    groq: !!getGroqKey(),
  };
}

// Remove old Gemini key if exists
export function migrateFromGemini() {
  const oldKey = localStorage.getItem('eloquent_gemini_key');
  if (oldKey) {
    localStorage.removeItem('eloquent_gemini_key');
  }
}
