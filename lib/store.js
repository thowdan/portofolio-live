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

// --- Binary file storage (e.g. the résumé PDF) -----------------------------
// Files live in their own `files` table as bytea, keyed by a short string.
// Created lazily on first use, like the kv table.

let filesSchemaReady = null;
function ensureFilesSchema() {
  if (!filesSchemaReady) {
    filesSchemaReady = sql`CREATE TABLE IF NOT EXISTS files (
      key          text PRIMARY KEY,
      filename     text NOT NULL,
      content_type text NOT NULL,
      data         bytea NOT NULL,
      updated_at   timestamptz NOT NULL DEFAULT now()
    )`;
  }
  return filesSchemaReady;
}

// Stores a file. `base64` is the raw file bytes base64-encoded; we decode to
// bytea in Postgres so the binary is stored compactly (not as a base64 string).
export async function putFile(key, { filename, contentType, base64 }) {
  if (!configured) throw new StoreNotConfiguredError();
  await ensureFilesSchema();
  await sql`
    INSERT INTO files (key, filename, content_type, data, updated_at)
    VALUES (${key}, ${filename}, ${contentType}, decode(${base64}, 'base64'), now())
    ON CONFLICT (key) DO UPDATE SET
      filename = EXCLUDED.filename,
      content_type = EXCLUDED.content_type,
      data = EXCLUDED.data,
      updated_at = now()
  `;
}

// Returns { filename, content_type, base64, updated_at } or null if missing.
export async function getFile(key) {
  if (!configured) return null;
  try {
    await ensureFilesSchema();
    const rows = await sql`
      SELECT filename, content_type, encode(data, 'base64') AS base64, updated_at
      FROM files WHERE key = ${key}
    `;
    return rows.length ? rows[0] : null;
  } catch (err) {
    console.error('[store] getFile failed:', err?.message || err);
    return null;
  }
}

// Lightweight existence/metadata check that does NOT pull the file bytes.
export async function getFileMeta(key) {
  if (!configured) return null;
  try {
    await ensureFilesSchema();
    const rows = await sql`SELECT filename, content_type, updated_at FROM files WHERE key = ${key}`;
    return rows.length ? rows[0] : null;
  } catch (err) {
    console.error('[store] getFileMeta failed:', err?.message || err);
    return null;
  }
}

export async function deleteFile(key) {
  if (!configured) throw new StoreNotConfiguredError();
  await ensureFilesSchema();
  await sql`DELETE FROM files WHERE key = ${key}`;
}
