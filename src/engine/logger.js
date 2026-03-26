/**
 * Structured logger for Eloquent.
 * Suppresses debug/info in production, always shows warn/error.
 */

const isDev = import.meta.env.DEV;

export const logger = {
  debug: (...args) => isDev && console.log('[Eloquent]', ...args),
  info: (...args) => isDev && console.info('[Eloquent]', ...args),
  warn: (...args) => console.warn('[Eloquent]', ...args),
  error: (...args) => console.error('[Eloquent]', ...args),
};
