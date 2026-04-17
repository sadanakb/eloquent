// supabase/functions/score-match/index.ts
// Server-side scoring for online matches.
// Ports the 2-agent Groq scoring system from src/engine/ki-scorer.js

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'
import { corsHeaders } from '../_shared/cors.ts'

// ─── Configuration ───
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const GROQ_MODEL = 'llama-3.3-70b-versatile'
const MAX_RETRIES = 2

// ─── Scoring Prompts (ported from ki-scorer.js) ───

const RESEARCH_PROMPT = `Analysiere diesen deutschen Text. Vergib KEINE Punkte. Sammle nur Fakten.

SITUATION: {titel} — {kontext}. {beschreibung}

TEXT: "{antwort}"

Aufgaben:

1. STILMITTEL suchen. Kopiere das EXAKTE Zitat aus dem Text.
Mögliche Stilmittel: Metapher, Vergleich, Personifikation, Antithese, Trikolon, Chiasmus, Klimax, Anapher, rhetorische Frage, Alliteration, Hyperbel.
REGEL: Wenn du kein exaktes Zitat hast, liste das Mittel NICHT auf.

2. GEHOBENE WÖRTER finden. Nur Wörter die WÖRTLICH im Text stehen.

3. SATZSTRUKTUR: Wie viele Sätze? Gibt es Nebensätze? Konnektoren?

4. SITUATIONSBEZUG: Passt der Text zur Situation?

5. ARGUMENTATION: Gibt es Begründungen? These und Schlussfolgerung?

6. KREATIVITÄT: Originelle Formulierungen? Bildsprache?

7. SPAM-CHECK: Ist der Text sinnvoll oder Keyword-Stuffing?

Antworte NUR mit JSON:
{
  "mittel": [{"name": "Antithese", "zitat": "exaktes Zitat"}],
  "gehobene_woerter": ["wort1", "wort2"],
  "saetze": 3,
  "nebensaetze": true,
  "konnektoren": ["weil", "deshalb"],
  "aufbau": "Einleitung und Argumentation",
  "situationsbezug": "Beschreibung...",
  "tonfall_passt": true,
  "argumentation": "These X wird mit Y begründet",
  "kreativ": "Die Formulierung X ist originell",
  "ist_spam": false,
  "grammatisch_ok": true
}`

const BEWERTUNG_PROMPT = `Bewerte diesen Text für das Eloquenz-Spiel. Die Analyse wurde bereits gemacht — du musst NUR Punkte vergeben.

SITUATION: {titel} — {kontext}. {beschreibung}
TEXT: "{antwort}"

ANALYSE-ERGEBNISSE:
{research}

PUNKTE VERGEBEN (100 Punkte gesamt):
1. situationsbezug (0-15)
2. wortvielfalt (0-15)
3. rhetorik (0-25): 0 Mittel=0-5, 1-2=6-12, 3+=13-18, 5+=19-25
4. wortschatz (0-15): 0 gehobene=0-3, 1-2=4-7, 3-4=8-11, 5+=12-15
5. argumentation (0-15)
6. kreativitaet (0-10)
7. textstruktur (0-5)

ANTI-GAMING: Wenn ist_spam=true → 0 Punkte. Wenn grammatisch_ok=false → stark reduzieren.

Antworte NUR mit JSON:
{
  "kategorien": {
    "situationsbezug": {"p": 10, "f": "Feedback"},
    "wortvielfalt": {"p": 8, "f": "Feedback"},
    "rhetorik": {"p": 12, "f": "Feedback"},
    "wortschatz": {"p": 8, "f": "Feedback"},
    "argumentation": {"p": 6, "f": "Feedback"},
    "kreativitaet": {"p": 4, "f": "Feedback"},
    "textstruktur": {"p": 3, "f": "Feedback"}
  },
  "mittel": [{"name": "Antithese", "beispiel": "exaktes Zitat"}],
  "gehobene": ["wort1"],
  "feedback": "2 Sätze Feedback",
  "tipps": ["Tipp 1", "Tipp 2", "Tipp 3"]
}`

// ─── Key Decryption (ported from key-encryption.js) ───

async function deriveKey(userId: string): Promise<CryptoKey> {
  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(userId + '_eloquent_key_v1'),
    'PBKDF2',
    false,
    ['deriveKey']
  )
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: encoder.encode('eloquent_salt'), iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

async function decryptGroqKey(encryptedBase64: string, userId: string): Promise<string | null> {
  try {
    const key = await deriveKey(userId)
    const combined = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0))
    const iv = combined.slice(0, 12)
    const ciphertext = combined.slice(12)
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv }, key, ciphertext
    )
    return new TextDecoder().decode(decrypted)
  } catch {
    return null
  }
}

// Prefer keys owned by one of the two match players so players contribute
// to their own match scoring. Same key is used for BOTH texts → fair.
async function getMatchPlayerGroqKey(
  admin: any,
  playerIds: string[]
): Promise<{ key: string; ownerId: string } | null> {
  const { data: rows } = await admin
    .from('user_progress')
    .select('user_id, settings')
    .in('user_id', playerIds)
    .not('settings->>groq_key_encrypted', 'is', null)

  if (!rows || rows.length === 0) return null

  // Randomize which player's key we use when both have one — prevents bias
  const shuffled = rows.sort(() => Math.random() - 0.5)
  for (const row of shuffled) {
    const encrypted = row.settings?.groq_key_encrypted
    if (!encrypted) continue
    const key = await decryptGroqKey(encrypted, row.user_id)
    if (key && key.startsWith('gsk_')) return { key, ownerId: row.user_id }
  }
  return null
}

async function getRandomUserGroqKey(admin: any): Promise<string | null> {
  // Fetch all users who have an encrypted Groq key
  const { data: rows } = await admin
    .from('user_progress')
    .select('user_id, settings')
    .not('settings->>groq_key_encrypted', 'is', null)

  if (!rows || rows.length === 0) return null

  // Shuffle and try to decrypt until we find a working key
  const shuffled = rows.sort(() => Math.random() - 0.5)
  for (const row of shuffled) {
    const encrypted = row.settings?.groq_key_encrypted
    if (!encrypted) continue
    const key = await decryptGroqKey(encrypted, row.user_id)
    if (key && key.startsWith('gsk_')) return key
  }
  return null
}

// ─── Helpers ───

function sanitize(text: string): string {
  return String(text).replace(/[{}"`]/g, ' ').slice(0, 2000)
}

function buildPrompt(template: string, situation: any, text: string, research?: any): string {
  let result = template
    .replace('{titel}', sanitize(situation.titel || ''))
    .replace('{kontext}', sanitize(situation.kontext || ''))
    .replace('{beschreibung}', sanitize(situation.beschreibung || ''))
    .replace('{antwort}', sanitize(text))
  if (research) {
    result = result.replace('{research}', JSON.stringify(research, null, 2))
  }
  return result
}

function parseJson(text: string): any {
  try {
    return JSON.parse(text)
  } catch {
    const match = text.match(/\{[\s\S]*\}/)
    if (match) return JSON.parse(match[0])
    throw new Error('JSON parsing failed')
  }
}

// ─── Groq API Call ───

async function callGroq(apiKey: string, messages: any[], retryCount = 0): Promise<string> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15000)

  try {
    const res = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages,
        temperature: 0.15,
        response_format: { type: 'json_object' },
      }),
      signal: controller.signal,
    })

    if (res.status === 429 && retryCount < MAX_RETRIES) {
      const waitMs = (retryCount + 1) * 2000
      await new Promise(r => setTimeout(r, waitMs))
      return callGroq(apiKey, messages, retryCount + 1)
    }

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Groq error (${res.status}): ${err.slice(0, 150)}`)
    }

    const data = await res.json()
    return data.choices?.[0]?.message?.content || ''
  } finally {
    clearTimeout(timeout)
  }
}

// ─── Score a single text ───

async function scoreText(apiKey: string, situation: any, text: string): Promise<any> {
  // Step 1: Research Agent
  const researchPrompt = buildPrompt(RESEARCH_PROMPT, situation, text)
  const researchRaw = await callGroq(apiKey, [
    { role: 'system', content: 'Du bist ein Textanalyst. Antworte NUR mit JSON.' },
    { role: 'user', content: researchPrompt },
  ])
  const research = parseJson(researchRaw)

  // Step 2: Scoring Agent
  const scoringPrompt = buildPrompt(BEWERTUNG_PROMPT, situation, text, research)
  const scoringRaw = await callGroq(apiKey, [
    { role: 'system', content: 'Du bist ein Bewertungs-Professor. Antworte NUR mit JSON.' },
    { role: 'user', content: scoringPrompt },
  ])
  const scoring = parseJson(scoringRaw)

  // Validate and clamp scores
  const maxMap: Record<string, number> = {
    situationsbezug: 15, wortvielfalt: 15, rhetorik: 25,
    wortschatz: 15, argumentation: 15, kreativitaet: 10, textstruktur: 5,
  }

  if (!scoring.kategorien) throw new Error('Missing kategorien in scoring result')

  let total = 0
  for (const [key, max] of Object.entries(maxMap)) {
    const val = scoring.kategorien[key]
    if (val && typeof val === 'object') {
      val.p = Math.max(0, Math.min(Number(val.p) || 0, max))
      total += val.p
    } else {
      scoring.kategorien[key] = { p: 0, f: '' }
    }
  }

  return { ...scoring, total, _method: 'ki' }
}

// ─── Heuristic Fallback (simplified) ───

function heuristicScore(text: string): number {
  const words = text.toLowerCase().split(/\s+/).filter(w => w.length > 0)
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 5)
  const uniqueRatio = words.length > 0 ? new Set(words).size / words.length : 0
  const longWords = words.filter(w => w.length > 8).length

  let score = 0
  // Word count contribution (max 20)
  score += Math.min(words.length / 5, 20)
  // Sentence structure (max 15)
  score += Math.min(sentences.length * 3, 15)
  // Vocabulary diversity (max 15)
  score += uniqueRatio * 15
  // Long words bonus (max 10)
  score += Math.min(longWords * 2, 10)
  // Comma complexity (max 5)
  score += Math.min((text.match(/,/g) || []).length, 5)

  return Math.min(Math.round(score), 100)
}

// ─── ELO Calculation (ported from elo.js) ───

function calculateElo(
  playerRating: number, opponentRating: number,
  playerScore: number, opponentScore: number,
  playerGames: number, opponentGames: number
) {
  const kPlayer = playerGames < 30 ? 32 : 16
  const kOpponent = opponentGames < 30 ? 32 : 16
  const expectedPlayer = 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400))
  const expectedOpponent = 1 / (1 + Math.pow(10, (playerRating - opponentRating) / 400))

  let actualPlayer: number, actualOpponent: number
  if (playerScore > opponentScore) {
    actualPlayer = 1; actualOpponent = 0
  } else if (playerScore < opponentScore) {
    actualPlayer = 0; actualOpponent = 1
  } else {
    actualPlayer = 0.5; actualOpponent = 0.5
  }

  const newPlayerRating = Math.max(0, Math.min(10000, Math.round(playerRating + kPlayer * (actualPlayer - expectedPlayer))))
  const newOpponentRating = Math.max(0, Math.min(10000, Math.round(opponentRating + kOpponent * (actualOpponent - expectedOpponent))))

  return {
    newPlayerRating, newOpponentRating,
    playerChange: newPlayerRating - playerRating,
    opponentChange: newOpponentRating - opponentRating,
  }
}

// ─── Main Handler ───

Deno.serve(async (req) => {
  // CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { matchId } = await req.json()
    if (!matchId) {
      return new Response(JSON.stringify({ error: 'matchId required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Auth
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Supabase clients
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const groqKey = Deno.env.get('GROQ_API_KEY')

    // Auth client to verify JWT
    const authClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    })
    const { data: { user }, error: authError } = await authClient.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Service role client for DB writes
    const admin = createClient(supabaseUrl, serviceRoleKey)

    // Load match first for auth check
    const { data: matchCheck, error: matchCheckError } = await admin
      .from('matches')
      .select('player1_id, player2_id, player1_score, player2_score, winner_id, status, scoring_method, situation_data')
      .eq('id', matchId)
      .single()

    if (matchCheckError || !matchCheck) {
      return new Response(JSON.stringify({ error: 'Match not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Verify caller is a player
    if (matchCheck.player1_id !== user.id && matchCheck.player2_id !== user.id) {
      return new Response(JSON.stringify({ error: 'Not a player in this match' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Idempotency: already completed
    if (matchCheck.status === 'completed' && matchCheck.player1_score !== null) {
      return new Response(JSON.stringify({
        player1_score: matchCheck.player1_score,
        player2_score: matchCheck.player2_score,
        winner_id: matchCheck.winner_id,
        scoring_method: matchCheck.scoring_method,
        already_completed: true,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Atomic scoring lock — only ONE invocation wins this UPDATE
    // Accept ANY non-completed status as claimable so a stray forfeit does
    // NOT lock us out (we must finish scoring if both texts are present).
    // Use player1_score IS NULL as the real "not yet scored" guard.
    const { data: claimed, error: claimError } = await admin
      .from('matches')
      .update({ status: 'scoring' })
      .eq('id', matchId)
      .in('status', ['active', 'waiting', 'scoring', 'forfeited'])
      .is('player1_score', null)
      .select()
      .maybeSingle()

    if (claimError || !claimed) {
      // Check if match was already scored by another invocation
      const { data: recheckMatch } = await admin
        .from('matches')
        .select('status, player1_score, player2_score, winner_id, scoring_method')
        .eq('id', matchId)
        .maybeSingle()

      if (recheckMatch?.player1_score !== null && recheckMatch?.player1_score !== undefined) {
        return new Response(JSON.stringify({
          player1_score: recheckMatch.player1_score,
          player2_score: recheckMatch.player2_score,
          winner_id: recheckMatch.winner_id,
          scoring_method: recheckMatch.scoring_method,
          already_completed: true,
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      // Still in progress by another invocation
      return new Response(JSON.stringify({ status: 'scoring_in_progress' }), {
        status: 202, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const match = claimed

    // Validate both texts exist
    if (!match.player1_text || !match.player2_text) {
      await admin.from('matches').update({ status: 'active' }).eq('id', matchId)
      return new Response(JSON.stringify({ error: 'Both players must submit text first' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Build situation object from match data (situation_data stored at match creation)
    const sitData = typeof match.situation_data === 'object' && match.situation_data ? match.situation_data : {}
    const situation = {
      titel: sitData.titel || '',
      kontext: sitData.kontext || '',
      beschreibung: sitData.beschreibung || `Situation ${match.situation_id || 'unbekannt'}`,
    }

    // Score both texts — ALWAYS completes the match (heuristic fallback if Groq fails)
    let p1Score: number
    let p2Score: number
    let scoringMethod = 'ki'

    // Priority: (1) server secret → (2) one of the two match players'
    // own keys → (3) any user's key → (4) heuristic.
    // IMPORTANT: whichever key we pick, BOTH texts are scored with the SAME
    // key in one batch so judgement is fair and comparable.
    let activeGroqKey = groqKey || null
    let keySource = activeGroqKey ? 'server' : null
    if (!activeGroqKey) {
      try {
        const playerKey = await getMatchPlayerGroqKey(admin, [
          match.player1_id, match.player2_id,
        ])
        if (playerKey) {
          activeGroqKey = playerKey.key
          keySource = playerKey.ownerId === match.player1_id ? 'player1' : 'player2'
          console.log(`Using ${keySource}'s Groq key for fair scoring`)
        }
      } catch (e) {
        console.error('Failed to get match-player Groq key:', e)
      }
    }
    if (!activeGroqKey) {
      try {
        activeGroqKey = await getRandomUserGroqKey(admin)
        if (activeGroqKey) {
          keySource = 'random_user'
          console.log('Using random user Groq key as last resort')
        }
      } catch (e) {
        console.error('Failed to get user Groq key:', e)
      }
    }

    if (activeGroqKey) {
      try {
        const [result1, result2] = await Promise.all([
          scoreText(activeGroqKey, situation, match.player1_text),
          scoreText(activeGroqKey, situation, match.player2_text),
        ])
        p1Score = result1.total
        p2Score = result2.total
      } catch (e) {
        console.error('Groq scoring failed, using heuristic:', e)
        p1Score = heuristicScore(match.player1_text)
        p2Score = heuristicScore(match.player2_text)
        scoringMethod = 'heuristic'
      }
    } else {
      console.log('No Groq key available, using heuristic scoring')
      p1Score = heuristicScore(match.player1_text)
      p2Score = heuristicScore(match.player2_text)
      scoringMethod = 'heuristic'
    }

    // Determine winner
    let winnerId: string | null = null
    if (p1Score > p2Score) winnerId = match.player1_id
    else if (p2Score > p1Score) winnerId = match.player2_id

    // Load both profiles for ELO
    const { data: profiles } = await admin
      .from('profiles')
      .select('id, elo_rating, total_games, wins, losses, draws')
      .in('id', [match.player1_id, match.player2_id])

    const p1Profile = profiles?.find((p: any) => p.id === match.player1_id)
    const p2Profile = profiles?.find((p: any) => p.id === match.player2_id)
    const p1Elo = p1Profile?.elo_rating ?? 400
    const p2Elo = p2Profile?.elo_rating ?? 400
    const p1Games = p1Profile?.total_games ?? 0
    const p2Games = p2Profile?.total_games ?? 0

    const elo = calculateElo(p1Elo, p2Elo, p1Score, p2Score, p1Games, p2Games)

    // Update match — MUST succeed, otherwise match is stuck
    // Use player1_score IS NULL guard to prevent overwriting another invocation's results
    const { data: updateResult, error: matchUpdateError } = await admin.from('matches').update({
      player1_score: p1Score,
      player2_score: p2Score,
      winner_id: winnerId,
      status: 'completed',
      completed_at: new Date().toISOString(),
      scoring_method: scoringMethod,
    }).eq('id', matchId).is('player1_score', null).select().single()

    if (matchUpdateError || !updateResult) {
      // Another invocation scored first — return their results
      const { data: existing } = await admin.from('matches')
        .select('player1_score, player2_score, winner_id, scoring_method')
        .eq('id', matchId).single()
      if (existing?.player1_score !== null) {
        return new Response(JSON.stringify({
          ...existing, already_completed: true,
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
      console.error('CRITICAL: Match update failed:', matchUpdateError)
      await admin.from('matches').update({ status: 'active' }).eq('id', matchId).catch(() => {})
      return new Response(JSON.stringify({ error: 'Match update failed' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Update player profiles (best-effort, don't fail the match)
    const p1Won = winnerId === match.player1_id
    const p1Lost = winnerId === match.player2_id
    const isDraw = winnerId === null

    await admin.from('profiles').update({
      elo_rating: elo.newPlayerRating,
      wins: (p1Profile?.wins || 0) + (p1Won ? 1 : 0),
      losses: (p1Profile?.losses || 0) + (p1Lost ? 1 : 0),
      draws: ((p1Profile as any)?.draws || 0) + (isDraw ? 1 : 0),
      total_games: p1Games + 1,
    }).eq('id', match.player1_id).catch(e => console.error('P1 profile update failed:', e))

    await admin.from('profiles').update({
      elo_rating: elo.newOpponentRating,
      wins: (p2Profile?.wins || 0) + (p2Won ? 1 : 0),
      losses: (p2Profile?.losses || 0) + (p2Lost ? 1 : 0),
      draws: ((p2Profile as any)?.draws || 0) + (isDraw ? 1 : 0),
      total_games: p2Games + 1,
    }).eq('id', match.player2_id).catch(e => console.error('P2 profile update failed:', e))

    const p2Won = winnerId === match.player2_id
    const p2Lost = winnerId === match.player1_id

    return new Response(JSON.stringify({
      player1_score: p1Score,
      player2_score: p2Score,
      winner_id: winnerId,
      scoring_method: scoringMethod,
      key_source: keySource,
      elo_changes: {
        player1: elo.playerChange,
        player2: elo.opponentChange,
      },
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (e) {
    console.error('Score-match error:', e)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
