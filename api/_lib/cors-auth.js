/**
 * Shared CORS and authentication helpers for Vercel API routes.
 */

const ALLOWED_ORIGINS = [
  'https://eloquent-iota.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
];

/**
 * Get CORS headers based on request origin.
 * Falls back to the production origin if the request origin is not allowed.
 */
export function getCorsHeaders(req) {
  const origin = req.headers?.origin || '';
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}

/**
 * Set CORS headers on an Express-style response object.
 */
export function setCorsHeaders(req, res) {
  const headers = getCorsHeaders(req);
  for (const [key, value] of Object.entries(headers)) {
    res.setHeader(key, value);
  }
}

/**
 * Handle OPTIONS preflight for Express-style handlers.
 * Returns true if the request was handled (caller should return early).
 */
export function handlePreflight(req, res) {
  if (req.method === 'OPTIONS') {
    setCorsHeaders(req, res);
    res.status(204).end();
    return true;
  }
  return false;
}

/**
 * Validate that the request has authorization.
 * Returns an error message string if unauthorized, or null if OK.
 *
 * Accepts requests that either:
 * - Have an Authorization header (Supabase JWT from the client), OR
 * - The server has GROQ_API_KEY configured (server-side fallback)
 */
export function validateAuth(req) {
  const authHeader = req.headers?.authorization || '';
  if (!authHeader && !process.env.GROQ_API_KEY) {
    return 'Unauthorized';
  }
  return null;
}
