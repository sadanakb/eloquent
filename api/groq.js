// Vercel Serverless Function — Groq API Proxy
// Leitet /api/groq/* Requests an api.groq.com weiter

export default async function handler(req, res) {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(204).end();
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
