/**
 * Development-only logger that silences output in production builds.
 *
 * Usage:
 *   import { logger } from '@/lib/logger';
 *   logger.error('Something went wrong', error);
 *   logger.warn('Fallback triggered');
 *
 * In production (`import.meta.env.PROD === true`), all calls are no-ops.
 */

const noop = () => {};

const isDev = typeof import.meta !== 'undefined' && import.meta.env?.DEV;

export const logger = isDev
  ? {
      error: (...args: unknown[]) => console.error(...args),
      warn: (...args: unknown[]) => console.warn(...args),
      info: (...args: unknown[]) => console.info(...args),
      debug: (...args: unknown[]) => console.debug(...args),
    }
  : {
      error: noop,
      warn: noop,
      info: noop,
      debug: noop,
    };
