// Vercel Serverless Function — Groq API Catch-All Proxy
// Handles /api/groq/chat/completions, /api/groq/models, etc.

export default async function handler(req, res) {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(204).end();
  }

  // Build Groq URL from path segments: ['chat', 'completions'] → /chat/completions
  const pathSegments = req.query.path || [];
  const groqPath = '/' + (Array.isArray(pathSegments) ? pathSegments.join('/') : pathSegments);
  const groqUrl = `https://api.groq.com/openai/v1${groqPath}`;

  const headers = {};
  if (req.headers.authorization) headers['Authorization'] = req.headers.authorization;
  if (req.headers['content-type']) headers['Content-Type'] = req.headers['content-type'];

  try {
    const groqRes = await fetch(groqUrl, {
      method: req.method,
      headers,
      body: req.method !== 'GET' && req.method !== 'HEAD'
        ? JSON.stringify(req.body)
        : undefined,
    });

    const data = await groqRes.text();
    res
      .status(groqRes.status)
      .setHeader('Content-Type', groqRes.headers.get('content-type') || 'application/json')
      .send(data);
  } catch (err) {
    res.status(502).json({ error: { message: `Groq proxy error: ${err.message}` } });
  }
}
