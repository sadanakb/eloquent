// ──────────────────────────────────────────────────────
// ELOQUENT — Production Server (für Hetzner / VPS)
// Dient statische Dateien aus + Proxy für Groq API
// ──────────────────────────────────────────────────────
// Usage: npm run build && node server.js
// ──────────────────────────────────────────────────────

import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const DIST = join(__dirname, 'dist');
const PORT = process.env.PORT || 3000;

const ALLOWED_ORIGINS = [
  'https://eloquent-iota.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
];

function getAllowedOrigin(req) {
  const origin = req.headers?.origin || '';
  return ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
}

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
};

// ── Groq API Proxy ──────────────────────────────────
async function proxyGroq(req, res) {
  const groqPath = req.url.replace(/^\/api\/groq/, '');
  const groqUrl = `https://api.groq.com/openai/v1${groqPath}`;

  // Collect request body
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const body = Buffer.concat(chunks);

  // Forward headers (keep Authorization, Content-Type)
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
      body: req.method !== 'GET' ? body : undefined,
    });

    res.writeHead(groqRes.status, {
      'Content-Type': groqRes.headers.get('content-type') || 'application/json',
      'Access-Control-Allow-Origin': getAllowedOrigin(req),
    });
    const responseBody = await groqRes.arrayBuffer();
    res.end(Buffer.from(responseBody));
  } catch (err) {
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: { message: `Groq proxy error: ${err.message}` } }));
  }
}

// ── Static File Server ──────────────────────────────
async function serveStatic(req, res) {
  let filePath = join(DIST, req.url === '/' ? 'index.html' : req.url);

  try {
    const fileStat = await stat(filePath);
    if (fileStat.isDirectory()) {
      filePath = join(filePath, 'index.html');
    }
  } catch {
    // SPA fallback: serve index.html for all routes
    filePath = join(DIST, 'index.html');
  }

  try {
    const data = await readFile(filePath);
    const ext = extname(filePath);
    res.writeHead(200, {
      'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
      'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=31536000',
    });
    res.end(data);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
  }
}

// ── HTTP Server ─────────────────────────────────────
const server = createServer((req, res) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': getAllowedOrigin(req),
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    });
    return res.end();
  }

  // Proxy Groq API calls
  if (req.url.startsWith('/api/groq')) {
    return proxyGroq(req, res);
  }

  // Serve static files
  serveStatic(req, res);
});

server.listen(PORT, () => {
  console.log(`\n  ELOQUENT Server läuft auf http://localhost:${PORT}\n`);
});
