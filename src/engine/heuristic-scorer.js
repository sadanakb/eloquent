import { GEHOBENE_WOERTER, WOERTERBUCH } from '../data/woerterbuch.js';
import { SEMANTISCHE_FELDER, DEUTSCHE_VERBEN_STEMS, FUNKTIONS_WOERTER, NATUERLICHE_BIGRAMME, HAEUFIGE_WOERTER } from '../data/deutsche-nlp-data.js';

// ──────────────────────────────────────────────────────
// Tokenizer
// ──────────────────────────────────────────────────────

export function tokenize(text) {
  return text.toLowerCase().replace(/[„""»«]/g, '"').replace(/[—–\-]/g, ' ')
    .split(/\s+/).map(w => w.replace(/^[^a-zäöüß]+|[^a-zäöüß]+$/gi, '')).filter(w => w.length > 0);
}

// ──────────────────────────────────────────────────────
// Verb Detection
// ──────────────────────────────────────────────────────

export function hatVerb(satzInput) {
  const woerter = typeof satzInput === 'string' ? tokenize(satzInput) : satzInput;
  const nichtVerb = /(schaft|heit|keit|ung|nis|tät|mus|ion|enz|anz|tum|ling|chen|lein)$/;
  for (const w of woerter) {
    if (DEUTSCHE_VERBEN_STEMS.includes(w)) return true;
    if (nichtVerb.test(w)) continue;
    if (/^ge.+[t]$/.test(w) && w.length > 4) return true;
    if (/iert$/.test(w) && w.length > 5) return true;
    if (/ieren$/.test(w) && w.length > 6) return true;
    if (/[^s]te$/.test(w) && w.length > 4) return true;
    if (/[^s]ten$/.test(w) && w.length > 5) return true;
    if (w.endsWith("en") && w.length > 5 && !FUNKTIONS_WOERTER.has(w)) return true;
  }
  return false;
}

// ──────────────────────────────────────────────────────
// Sentence Sense Score
// ──────────────────────────────────────────────────────

export function satzSinnScore(satz) {
  const woerter = tokenize(satz);
  if (woerter.length < 2) return 0;
  if (woerter.length > 80) return 0.7;
  let score = 0;
  const n = woerter.length;

  if (!hatVerb(woerter)) return 0.15;
  score += 0.35;

  const fwRatio = woerter.filter(w => FUNKTIONS_WOERTER.has(w)).length / n;
  if (fwRatio >= 0.15 && fwRatio <= 0.7) score += 0.25;
  else if (fwRatio >= 0.08 && fwRatio <= 0.8) score += 0.12;
  else score -= 0.1;

  let bigramHits = 0;
  for (let i = 0; i < woerter.length - 1; i++) {
    if (NATUERLICHE_BIGRAMME.has(woerter[i] + " " + woerter[i + 1])) bigramHits++;
  }
  if (n > 2) score += Math.min(bigramHits / (n - 1) * 2, 0.15);
  if (n >= 10 && bigramHits === 0) score -= 0.05;

  // Bonus for subordinate clauses (complex sentence structure)
  const nebensatzKonj = ["weil", "da", "obwohl", "dass", "damit", "sodass", "ob", "wenn", "als", "nachdem", "bevor", "während", "worauf", "wobei", "sofern", "indem"];
  const hatNebensatz = woerter.some(w => nebensatzKonj.includes(w));
  if (hatNebensatz && n >= 6) score += 0.1;

  const avgLen = woerter.reduce((s, w) => s + w.length, 0) / n;
  if (avgLen >= 3 && avgLen <= 9) score += 0.1;

  const lenVielfalt = new Set(woerter.map(w => w.length)).size;
  if (lenVielfalt >= Math.min(n * 0.3, 4)) score += 0.05;

  const inhalt = woerter.filter(w => !FUNKTIONS_WOERTER.has(w));
  const inhaltRatio = inhalt.length / n;
  if (inhaltRatio >= 0.25 && inhaltRatio <= 0.85) score += 0.05;

  if (inhalt.length > 0) {
    const uRatio = new Set(inhalt).size / inhalt.length;
    if (uRatio >= 0.7) score += 0.05;
    else if (uRatio < 0.25) score -= 0.15;
  }

  let maxRun = 0, currentRun = 0;
  for (const w of woerter) {
    if (!FUNKTIONS_WOERTER.has(w) && !DEUTSCHE_VERBEN_STEMS.includes(w)) {
      currentRun++;
      if (currentRun > maxRun) maxRun = currentRun;
    } else {
      currentRun = 0;
    }
  }
  if (maxRun >= 6) score -= 0.2;
  else if (maxRun >= 5) score -= 0.1;

  let hatPhrase = false;
  const artikel = new Set(["der", "die", "das", "den", "dem", "des", "ein", "eine", "einen", "einem", "einer"]);
  const praep = new Set(["in", "an", "auf", "für", "mit", "von", "zu", "bei", "nach", "aus", "um", "über", "vor", "durch", "gegen", "unter", "zwischen"]);
  const kontraktionen = new Set(["im", "am", "zum", "zur", "vom", "beim", "ins", "ans", "aufs"]);
  for (let i = 0; i < woerter.length - 1; i++) {
    const w1 = woerter[i], w2 = woerter[i + 1];
    if (artikel.has(w1) && !FUNKTIONS_WOERTER.has(w2)) { hatPhrase = true; break; }
    if (praep.has(w1) && artikel.has(w2)) { hatPhrase = true; break; }
    if (kontraktionen.has(w1) && !FUNKTIONS_WOERTER.has(w2)) { hatPhrase = true; break; }
    if (w1 === "zu" && hatVerb([w2])) { hatPhrase = true; break; }
    if (["ich", "du", "er", "sie", "es", "wir", "ihr", "man", "wer"].includes(w1) && (DEUTSCHE_VERBEN_STEMS.includes(w2) || hatVerb([w2]))) { hatPhrase = true; break; }
  }
  if (n >= 8 && !hatPhrase) score -= 0.15;

  return Math.max(0.1, Math.min(score, 1));
}

// ──────────────────────────────────────────────────────
// Text Coherence
// ──────────────────────────────────────────────────────

export function textKohaerenz(saetze) {
  if (saetze.length < 2) return 0.7;
  let total = 0, count = 0;

  const alleInhalt = new Set();
  for (const s of saetze) {
    for (const w of tokenize(s)) {
      if (!FUNKTIONS_WOERTER.has(w) && w.length > 2) alleInhalt.add(w);
    }
  }

  const konnektoren = new Set(["daher", "deshalb", "folglich", "denn", "weil", "somit", "also",
    "dennoch", "allerdings", "jedoch", "dabei", "zudem", "ferner", "zugleich",
    "darüber", "außerdem", "überdies", "indes", "hierbei", "demnach",
    "einerseits", "andererseits", "nichtsdestotrotz", "gleichwohl",
    "schließlich", "letztlich", "doch", "trotzdem", "hingegen",
    "denn", "dafür", "dagegen", "vielmehr", "insofern", "nämlich",
    "nicht", "nur", "sondern", "auch", "zwar", "obwohl", "während"]);

  for (let i = 1; i < saetze.length; i++) {
    const prev = new Set(tokenize(saetze[i - 1]).filter(w => !FUNKTIONS_WOERTER.has(w) && w.length > 2));
    const curr = tokenize(saetze[i]).filter(w => !FUNKTIONS_WOERTER.has(w) && w.length > 2);
    const currSet = new Set(curr);
    let pairScore = 0;

    let directOverlap = 0;
    for (const w of currSet) if (prev.has(w)) directOverlap++;
    pairScore += Math.min(directOverlap * 0.25, 0.4);

    let stemOverlap = 0;
    for (const w1 of currSet) {
      for (const w2 of prev) {
        if (w1.length > 3 && w2.length > 3) {
          const minLen = Math.min(w1.length, w2.length);
          const compareLen = Math.max(3, Math.floor(minLen * 0.55));
          if (w1.slice(0, compareLen) === w2.slice(0, compareLen) && w1 !== w2) { stemOverlap++; break; }
        }
      }
    }
    pairScore += Math.min(stemOverlap * 0.15, 0.25);

    const ersteW = tokenize(saetze[i]).slice(0, 3);
    if (ersteW.some(w => konnektoren.has(w))) pairScore += 0.25;

    const themaHits = curr.filter(w => alleInhalt.has(w)).length;
    pairScore += Math.min(themaHits / Math.max(curr.length, 1) * 0.3, 0.15);

    total += Math.min(pairScore, 1);
    count++;
  }

  let themaConsistency = 0;
  for (const s of saetze) {
    const sw = new Set(tokenize(s).filter(w => !FUNKTIONS_WOERTER.has(w) && w.length > 3));
    let hatThema = false;
    for (const other of saetze) {
      if (other === s) continue;
      const ow = tokenize(other).filter(w => !FUNKTIONS_WOERTER.has(w) && w.length > 3);
      if (ow.some(w => {
        if (sw.has(w)) return true;
        for (const s2 of sw) {
          if (w.length > 3 && s2.length > 3) {
            const minL = Math.min(w.length, s2.length);
            if (w.slice(0, Math.max(3, Math.floor(minL * 0.55))) === s2.slice(0, Math.max(3, Math.floor(minL * 0.55)))) return true;
          }
        }
        return false;
      })) { hatThema = true; break; }
    }
    if (hatThema) themaConsistency++;
  }
  const consistencyBonus = themaConsistency / saetze.length * 0.3;

  const referenzWoerter = new Set(["es", "dies", "diese", "dieser", "dieses", "das", "jene", "solch", "solche", "dabei", "daraus", "darin", "dazu", "daher", "deshalb"]);
  let referenzCount = 0;
  for (let i = 1; i < saetze.length; i++) {
    const ersteW = tokenize(saetze[i]).slice(0, 3);
    if (ersteW.some(w => referenzWoerter.has(w))) referenzCount++;
  }
  const referenzBonus = saetze.length > 1 ? referenzCount / (saetze.length - 1) * 0.15 : 0;

  let feldBonus = 0;
  for (const [feld, woerter] of Object.entries(SEMANTISCHE_FELDER)) {
    let saetzeMitFeld = 0;
    for (const s of saetze) {
      const sw = tokenize(s);
      if (woerter.some(w => sw.some(t => t.includes(w) || w.includes(t)))) saetzeMitFeld++;
    }
    if (saetzeMitFeld >= 2) {
      feldBonus = Math.max(feldBonus, saetzeMitFeld / saetze.length * 0.2);
    }
  }

  const rawScore = count > 0 ? total / count : 0.5;
  return Math.min(rawScore + consistencyBonus + referenzBonus + feldBonus, 1);
}

// ──────────────────────────────────────────────────────
// Semantic Situation Match
// ──────────────────────────────────────────────────────

export function semantischerSituationsmatch(situation, text) {
  const inhalt = new Set(tokenize(text).filter(w => !FUNKTIONS_WOERTER.has(w) && w.length > 3));
  let best = { feld: null, score: 0, hits: [] };

  // 1. Semantic field matching (20% weight)
  for (const [name, woerter] of Object.entries(SEMANTISCHE_FELDER)) {
    const hits = [];
    for (const fw of woerter) {
      for (const iw of inhalt) {
        if (iw.includes(fw) || fw.includes(iw)) { hits.push(fw); break; }
      }
    }
    const sc = hits.length / Math.max(woerter.length * 0.3, 1);
    if (sc > best.score) best = { feld: name, score: sc, hits };
  }

  // 2. Direct title/description matching (30% weight)
  const titelT = tokenize(situation.titel || '').filter(w => w.length > 3 && !FUNKTIONS_WOERTER.has(w));
  const beschT = tokenize(situation.beschreibung || '').filter(w => w.length > 4 && !FUNKTIONS_WOERTER.has(w));
  let dh = 0;
  for (const kw of [...titelT, ...beschT]) for (const iw of inhalt) { if (iw.includes(kw) || kw.includes(iw)) { dh++; break; } }
  const ds = Math.min(dh / Math.max(titelT.length + beschT.length * 0.3, 1), 1);

  // 3. Schlüsselwort matching (50% weight) — uses per-situation keywords if available
  let kwScore = 0;
  let kwHits = 0;
  if (situation.schluesselwoerter && situation.schluesselwoerter.length > 0) {
    for (const kw of situation.schluesselwoerter) {
      const kwLow = kw.toLowerCase();
      for (const iw of inhalt) {
        if (iw.includes(kwLow) || kwLow.includes(iw)) { kwHits++; break; }
      }
    }
    kwScore = kwHits / situation.schluesselwoerter.length;
  }

  // Weighted combination: schluesselwoerter 50%, direct 30%, semantic 20%
  const combined = situation.schluesselwoerter?.length > 0
    ? kwScore * 0.5 + ds * 0.3 + best.score * 0.2
    : Math.max(best.score, ds * 0.8); // fallback for situations without keywords

  return {
    punkte: Math.min(Math.round(combined * 180) / 10, 15),
    feldMatch: best.feld,
    semantischeHits: best.hits.length,
    direkteHits: dh,
    kwHits,
  };
}

// ──────────────────────────────────────────────────────
// Find Elevated Words
// ──────────────────────────────────────────────────────

export function findeGehobeneWoerter(text) {
  const lower = text.toLowerCase();
  const tokens = tokenize(text);
  const gesehen = new Set();
  const gefunden = [];

  for (const [wort] of GEHOBENE_WOERTER) {
    const wLow = wort.toLowerCase();
    if (gesehen.has(wLow)) continue;
    if (lower.includes(wLow)) {
      gesehen.add(wLow);
      gefunden.push(wort);
    } else {
      const stamm = wLow.slice(0, Math.max(wLow.length - 2, 5));
      if (stamm.length >= 5 && tokens.some(t => {
        const tLow = t.toLowerCase();
        return tLow.startsWith(stamm) && tLow.length >= stamm.length && tLow.length <= wLow.length + 3;
      })) {
        gesehen.add(wLow);
        gefunden.push(wort);
      }
    }
  }

  for (const entry of WOERTERBUCH) {
    const wLow = entry.wort.toLowerCase();
    if (gesehen.has(wLow)) continue;
    if (lower.includes(wLow)) {
      gesehen.add(wLow);
      gefunden.push(entry.wort);
    }
  }

  return gefunden;
}

// ──────────────────────────────────────────────────────
// Vocabulary Analysis
// ──────────────────────────────────────────────────────

export function analysiereWortschatz(text, gehobene) {
  const tokens = tokenize(text);
  if (tokens.length < 3) return { score: 0, details: { ttr: 0, langWoerter: 0, komposita: 0, fremdwoerter: 0, avgLen: 0, rareWordRatio: 0, entropie: 0 } };

  const unique = new Set(tokens.map(t => t.toLowerCase()));
  const ttr = unique.size / tokens.length;

  const langWoerter = tokens.filter(t => t.length >= 8).length;
  const langAnteil = langWoerter / tokens.length;

  // Komposita: use original text for capitalized compound words
  const originalWords = text.split(/\s+/).map(w => w.replace(/^[^a-zA-ZäöüÄÖÜß]+|[^a-zA-ZäöüÄÖÜß]+$/g, '')).filter(w => w.length > 0);
  const komposita = originalWords.filter(t => t.length > 12 && /^[A-ZÄÖÜ]/.test(t));

  const fremdStaemme = ["tion", "ment", "ität", "ismus", "istisch", "phie", "logie", "thek", "tisch", "zial", "ziell", "iere", "ance", "enz", "ique", "eur"];
  const fremdwoerter = tokens.filter(t => fremdStaemme.some(s => t.toLowerCase().endsWith(s)));

  const avgLen = tokens.reduce((s, t) => s + t.length, 0) / tokens.length;

  const inhaltTokens = tokens.filter(t => !FUNKTIONS_WOERTER.has(t.toLowerCase()) && t.length > 3);
  const selteneWoerter = inhaltTokens.filter(t => {
    const tl = t.toLowerCase();
    return !HAEUFIGE_WOERTER.has(tl) && tl.length >= 5;
  });
  const rareWordRatio = inhaltTokens.length > 0 ? selteneWoerter.length / inhaltTokens.length : 0;

  const wordFreq = new Map();
  for (const t of tokens) {
    const tl = t.toLowerCase();
    wordFreq.set(tl, (wordFreq.get(tl) || 0) + 1);
  }
  let entropie = 0;
  for (const count of wordFreq.values()) {
    const p = count / tokens.length;
    if (p > 0) entropie -= p * Math.log2(p);
  }
  const maxEntropie = Math.log2(tokens.length);
  const normEntropie = maxEntropie > 0 ? entropie / maxEntropie : 0;

  let score = 0;
  score += Math.min(ttr * 8, 5);
  score += Math.min(langAnteil * 15, 3);
  score += Math.min(komposita.length * 0.5, 1);
  score += Math.min(fremdwoerter.length * 0.5, 1.5);
  score += Math.min((avgLen - 4) * 0.8, 2);
  // Gehobene scaling: 5+=5, 3+=3.5, 2+=2.5, 1+=1.5
  if (gehobene.length >= 5) score += 5;
  else if (gehobene.length >= 3) score += 3.5;
  else if (gehobene.length >= 2) score += 2.5;
  else if (gehobene.length >= 1) score += 1.5;
  if (rareWordRatio >= 0.7) score += 3;
  else if (rareWordRatio >= 0.5) score += 2;
  else if (rareWordRatio >= 0.3) score += 1;
  if (normEntropie >= 0.9) score += 1.5;
  else if (normEntropie >= 0.8) score += 1;
  else if (normEntropie >= 0.7) score += 0.5;

  // Category diversity bonus (scaled for 200+ words across 16 categories)
  const katSet = new Set();
  gehobene.forEach(gw => {
    const entry = WOERTERBUCH.find(w => w.wort.toLowerCase() === gw.toLowerCase());
    if (entry) katSet.add(entry.kategorie);
  });
  score += Math.min(katSet.size * 0.7, 2.5);

  return {
    score: Math.min(Math.round(score * 10) / 10, 15),
    details: { ttr: Math.round(ttr * 100), langWoerter, komposita: komposita.length, fremdwoerter: fremdwoerter.length, avgLen: Math.round(avgLen * 10) / 10, rareWordRatio: Math.round(rareWordRatio * 100), entropie: Math.round(normEntropie * 100) },
  };
}

// ──────────────────────────────────────────────────────
// Discourse Structure Analysis
// ──────────────────────────────────────────────────────

export function analysiereDiskursstruktur(text) {
  const saetze = text.split(/[.!?]+/).filter(s => s.trim().length > 5);
  const lower = text.toLowerCase();

  const konnektorGruppen = {
    kausal: ["daher", "deshalb", "folglich", "denn", "weil", "da ", "somit", "also", "insofern", "demzufolge", "infolgedessen", "mithin", "aufgrund"],
    temporal: ["zunächst", "sodann", "schließlich", "erstens", "zweitens", "drittens", "anfangs", "danach", "abschließend", "zuletzt"],
    adversativ: ["jedoch", "dennoch", "allerdings", "nichtsdestotrotz", "gleichwohl", "hingegen", "im gegensatz", "andererseits", "trotzdem", "freilich"],
    additiv: ["zudem", "ferner", "überdies", "darüber hinaus", "des weiteren", "außerdem", "nicht zuletzt", "vor allem", "insbesondere", "namentlich"],
    konklusiv: ["zusammenfassend", "letztlich", "im kern", "im grunde", "kurzum", "dementsprechend", "im ergebnis", "abschließend betrachtet"],
  };

  let konnektorAnzahl = 0;
  let konnektorVielfalt = 0;
  for (const [gruppe, konnektoren] of Object.entries(konnektorGruppen)) {
    const hits = konnektoren.filter(k => lower.includes(k));
    if (hits.length > 0) konnektorVielfalt++;
    konnektorAnzahl += hits.length;
  }

  const hatEinleitung = /^(es\s+ist|man\s+kennt|stellen\s+wir|in\s+einer|wenn\s+man|betrachten\s+wir|in\s+zeiten|heutzutage|tagtäglich|angesichts)/i.test(text.trim());
  const hatSchluss = /(zusammenfassend|letztendlich|abschließend|im\s+kern|kurzum|in\s+summe|schließlich\s+lässt\s+sich|daraus\s+folgt|es\s+zeigt\s+sich)/i.test(lower);

  let varianz = 0;
  if (saetze.length >= 2) {
    const laengen = saetze.map(s => s.trim().split(/\s+/).length);
    const avg = laengen.reduce((a, b) => a + b, 0) / laengen.length;
    varianz = laengen.reduce((s, l) => s + Math.abs(l - avg), 0) / laengen.length;
  }

  const hatFrage = text.includes("?");
  const hatAusruf = text.includes("!");
  const hatAussage = text.includes(".");
  const satzartenVielfalt = [hatFrage, hatAusruf, hatAussage].filter(Boolean).length;

  const kohaesionsmarker = ["dabei", "zugleich", "indes", "hierbei", "demnach", "sodass", "woraufhin", "was bedeutet", "das heißt", "mit anderen worten"];
  const kohHits = kohaesionsmarker.filter(k => lower.includes(k)).length;

  const wendungen = ["stellen wir uns vor", "man denke", "was wäre wenn", "ich wage zu behaupten", "lassen sie mich", "erlauben sie mir", "betrachten wir", "hand aufs herz", "seien wir ehrlich", "man möge", "es sei gesagt", "wohlgemerkt"];
  const wendHits = wendungen.filter(w => lower.includes(w)).length;

  // Within-sentence subordination (gives credit for complex single sentences)
  const nebensatzKonj = ["weil", "da ", "obwohl", "dass", "damit", "sodass", "ob ", "wenn", "als ", "nachdem", "bevor", "während", "worauf", "wobei", "sofern", "indem"];
  let nebensatzCount = 0;
  for (const k of nebensatzKonj) { if (lower.includes(k)) nebensatzCount++; }

  // Relative clauses — including prepositional relatives like ", in der", ", auf dem", ", von der"
  const relativCount = (text.match(/,\s+(?:(?:in|auf|von|mit|an|aus|bei|für|über|durch|nach|vor|unter|zwischen)\s+)?(?:der|die|das|dem|den|des|welche[rsmn]?)\s+/g) || []).length;

  let score = 0;
  score += Math.min(konnektorAnzahl * 0.6, 2.5);
  score += konnektorVielfalt * 0.4;
  if (hatEinleitung) score += 1;
  if (hatSchluss) score += 1;
  score += Math.min(varianz / 2.5, 2);
  score += Math.min(satzartenVielfalt * 0.4, 1.2);
  score += Math.min(kohHits * 0.5, 1.5);
  score += Math.min(wendHits * 0.8, 1.5);
  if (saetze.length >= 3) score += 0.5;
  if (saetze.length >= 5) score += 0.5;
  if (saetze.length >= 7) score += 0.5;

  // Credit for within-sentence complexity (subordination + relative clauses)
  score += Math.min(nebensatzCount * 1.0, 3);
  score += Math.min(relativCount * 0.8, 2);

  // Comma count as complexity signal
  const kommaInText = (text.match(/,/g) || []).length;
  if (kommaInText >= 4) score += 1;
  else if (kommaInText >= 2) score += 0.5;

  return {
    score: Math.min(Math.round(score * 10) / 10, 15),
    konnektorAnzahl, konnektorVielfalt, hatEinleitung, hatSchluss,
    satzartenVielfalt, wendHits, nebensatzCount, relativCount,
  };
}
