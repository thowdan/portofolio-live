// Rate limiting for the API surface. Backed by Neon Postgres when configured;
// otherwise a no-op limiter that allows everything (so local/unconfigured deploys
// still run). This protects the admin login from brute force and the write
// endpoint from abuse.
//
// Implementation: a fixed-window counter in a `rate_limits` table. Each (bucket,
// window) pair gets a row whose count is incremented atomically; expired rows are
// ignored and lazily overwritten. Good enough for an admin surface at low volume.

import { getSql, isStoreConfigured } from './store.js';

let schemaReady = null;
function ensureSchema(sql) {
  if (!schemaReady) {
    schemaReady = sql`CREATE TABLE IF NOT EXISTS rate_limits (
      bucket text PRIMARY KEY,
      count integer NOT NULL,
      reset_at bigint NOT NULL
    )`;
  }
  return schemaReady;
}

function make(tokens, windowSeconds, prefix) {
  return {
    async limit(key) {
      if (!isStoreConfigured()) return { success: true, remaining: tokens, reset: 0 };
      const sql = getSql();
      const now = Date.now();
      const resetAt = now + windowSeconds * 1000;
      const bucket = `pf:rl:${prefix}:${key}`;
      try {
        await ensureSchema(sql);
        // Insert a fresh window, or increment within the current one. If the stored
        // window has expired, reset count to 1 and start a new window.
        const rows = await sql`
          INSERT INTO rate_limits (bucket, count, reset_at)
          VALUES (${bucket}, 1, ${resetAt})
          ON CONFLICT (bucket) DO UPDATE SET
            count = CASE WHEN rate_limits.reset_at < ${now} THEN 1 ELSE rate_limits.count + 1 END,
            reset_at = CASE WHEN rate_limits.reset_at < ${now} THEN ${resetAt} ELSE rate_limits.reset_at END
          RETURNING count, reset_at
        `;
        const { count, reset_at } = rows[0];
        return {
          success: count <= tokens,
          remaining: Math.max(0, tokens - count),
          reset: Math.ceil(Number(reset_at) / 1000),
        };
      } catch (err) {
        console.error('[ratelimit] check failed (allowing):', err?.message || err);
        return { success: true, remaining: tokens, reset: 0 };
      }
    },
  };
}

// Hard limit on login attempts to deter brute force; generous limits on reads.
export const loginLimiter = make(5, 60, 'login');
export const writeLimiter = make(20, 60, 'write');
export const readLimiter = make(120, 60, 'read');

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
