// Storage layer. Uses Neon Postgres when configured, otherwise runs in a
// "not configured" mode where reads fall back to defaults and writes are rejected.
// This lets the public site deploy and render with ZERO backend setup; the admin
// editor activates once DATABASE_URL is present.
//
// Data model: a single key/value table `kv (key text primary key, value jsonb)`.
// The table is created lazily on first use, so there is no migration step.

import { neon } from '@neondatabase/serverless';

let sql = null;
let configured = false;
let schemaReady = null; // a promise, so we only run the CREATE TABLE once

const connectionString = process.env.DATABASE_URL;

if (connectionString) {
  try {
    sql = neon(connectionString);
    configured = true;
  } catch (err) {
    console.error('[store] Failed to init Neon client:', err?.message || err);
    sql = null;
    configured = false;
  }
}

export function isStoreConfigured() {
  return configured;
}

export class StoreNotConfiguredError extends Error {
  constructor() {
    super('Storage backend is not configured. Set DATABASE_URL (Neon Postgres connection string).');
    this.name = 'StoreNotConfiguredError';
    this.statusCode = 503;
  }
}

// Ensures the kv table exists. Runs at most once per cold start.
function ensureSchema() {
  if (!schemaReady) {
    schemaReady = sql`CREATE TABLE IF NOT EXISTS kv (key text PRIMARY KEY, value jsonb NOT NULL)`;
  }
  return schemaReady;
}

// Returns the parsed JSON value at `key`, or null if missing / store unconfigured.
export async function getJSON(key) {
  if (!configured) return null;
  try {
    await ensureSchema();
    const rows = await sql`SELECT value FROM kv WHERE key = ${key}`;
    if (!rows.length) return null;
    const value = rows[0].value;
    // Neon returns jsonb already parsed; guard for string payloads too.
    return typeof value === 'string' ? JSON.parse(value) : value;
  } catch (err) {
    console.error('[store] get failed:', err?.message || err);
    return null;
  }
}

// Persists a JSON-serializable value at `key`. Throws if the store is unconfigured.
export async function setJSON(key, value) {
  if (!configured) throw new StoreNotConfiguredError();
  await ensureSchema();
  const payload = JSON.stringify(value);
  await sql`
    INSERT INTO kv (key, value) VALUES (${key}, ${payload}::jsonb)
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
  `;
  return value;
}

// Exposes the raw Neon SQL tagged-template client (used by the rate limiter).
export function getSql() {
  return sql;
}
