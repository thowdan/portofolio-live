// Storage layer. Uses Upstash Redis (REST) when configured, otherwise runs in a
// "not configured" mode where reads fall back to defaults and writes are rejected.
// This lets the public site deploy and render with ZERO backend setup; the admin
// editor activates once the Upstash env vars are present.

import { Redis } from '@upstash/redis';

let client = null;
let configured = false;

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

if (url && token) {
  try {
    client = new Redis({ url, token });
    configured = true;
  } catch (err) {
    console.error('[store] Failed to init Upstash Redis:', err?.message || err);
    client = null;
    configured = false;
  }
}

export function isStoreConfigured() {
  return configured;
}

export class StoreNotConfiguredError extends Error {
  constructor() {
    super('Storage backend is not configured. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.');
    this.name = 'StoreNotConfiguredError';
    this.statusCode = 503;
  }
}

// Returns the parsed JSON value at `key`, or null if missing / store unconfigured.
export async function getJSON(key) {
  if (!configured) return null;
  try {
    const value = await client.get(key);
    if (value == null) return null;
    // Upstash auto-deserializes JSON; guard for string payloads too.
    return typeof value === 'string' ? JSON.parse(value) : value;
  } catch (err) {
    console.error('[store] get failed:', err?.message || err);
    return null;
  }
}

// Persists a JSON-serializable value at `key`. Throws if the store is unconfigured.
export async function setJSON(key, value) {
  if (!configured) throw new StoreNotConfiguredError();
  await client.set(key, JSON.stringify(value));
  return value;
}

export function getRedis() {
  return client;
}
