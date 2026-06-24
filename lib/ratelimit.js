// Rate limiting for the API surface. Backed by Upstash when configured; otherwise
// a no-op limiter that allows everything (so local/unconfigured deploys still run).
// This protects the admin login from brute force and the write endpoint from abuse.

import { Ratelimit } from '@upstash/ratelimit';
import { getRedis, isStoreConfigured } from './store.js';

const noopLimiter = { limit: async () => ({ success: true, remaining: 999, reset: 0 }) };

function make(tokens, window, prefix) {
  if (!isStoreConfigured()) return noopLimiter;
  try {
    return new Ratelimit({
      redis: getRedis(),
      limiter: Ratelimit.slidingWindow(tokens, window),
      prefix: `pf:rl:${prefix}`,
      analytics: false,
    });
  } catch (err) {
    console.error('[ratelimit] init failed:', err?.message || err);
    return noopLimiter;
  }
}

// Hard limit on login attempts to deter brute force; generous limits on reads.
export const loginLimiter = make(5, '60 s', 'login');
export const writeLimiter = make(20, '60 s', 'write');
export const readLimiter = make(120, '60 s', 'read');

export function clientIp(req) {
  const xff = req.headers?.['x-forwarded-for'];
  if (typeof xff === 'string' && xff.length) return xff.split(',')[0].trim();
  return req.headers?.['x-real-ip'] || req.socket?.remoteAddress || '0.0.0.0';
}

// Returns true if the request is allowed; sets rate-limit headers on the response.
export async function allow(limiter, key, res) {
  const { success, remaining, reset } = await limiter.limit(key);
  if (res && typeof res.setHeader === 'function') {
    res.setHeader('X-RateLimit-Remaining', String(Math.max(0, remaining ?? 0)));
    if (reset) res.setHeader('X-RateLimit-Reset', String(reset));
    if (!success) res.setHeader('Retry-After', '60');
  }
  return success;
}
