// Vercel Serverless Function — Groq API Proxy
// Leitet /api/groq/* Requests an api.groq.com weiter

import { getCorsHeaders, setCorsHeaders, handlePreflight, validateAuth } from './_lib/cors-auth.js';

export default async function handler(req, res) {
  // CORS preflight
  if (handlePreflight(req, res)) return;

  // Set CORS headers for all responses
  setCorsHeaders(req, res);

  // Auth check
  const authError = validateAuth(req);
  if (authError) {
    return res.status(401).json({ error: { message: authError } });
  }

  // Pfad nach /api/groq extrahieren → an Groq weiterleiten
  const groqPath = req.url.replace(/^\/api\/groq/, '') || '';
  const groqUrl = `https://api.groq.com/openai/v1${groqPath}`;

  const headers = {
    'Content-Type': req.headers['content-type'] || 'application/json',
  };
  if (req.headers.authorization) {
    headers['Authorization'] = req.headers.authorization;
  }

  try {
    const groqRes = await fetch(groqUrl, {
      method: req.method,
      headers,
      body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined,
    });

    const data = await groqRes.text();
    res.status(groqRes.status)
      .setHeader('Content-Type', groqRes.headers.get('content-type') || 'application/json')
      .send(data);
  } catch (err) {
    res.status(502).json({ error: { message: `Groq proxy error: ${err.message}` } });
  }
}
