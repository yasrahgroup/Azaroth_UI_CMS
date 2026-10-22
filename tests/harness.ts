/**
 * Shared test harness.
 *
 * The suite runs against the real persistence layer (Neon PostgreSQL via
 * TEST_DATABASE_URL, falling back to the local file store) - no mocked API
 * responses and no in-memory fakes. The express app is mounted on an
 * ephemeral port so tests never collide with a running dev server.
 */
import http from 'http';
import type { AddressInfo } from 'net';
import dotenv from 'dotenv';

// Load the environment first so the dedicated test database URL is available.
dotenv.config();

// Point the data layer at the dedicated test database before any server or
// database module is imported. dotenv does not override existing values, so
// this wins over the .env file.
process.env.AZAROTH_AUTOSTART = 'false';
if (!process.env.TEST_DATABASE_URL) {
  throw new Error('TEST_DATABASE_URL is required to run the integration suite.');
}
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
process.env.NODE_ENV = 'test';
// Keep the local file-store fallback isolated from the real data directory,
// and give each test process its own store so parallel runners cannot race
// on the same JSON file.
process.env.DATA_DIR = process.env.TEST_DATA_DIR || `data-test-${process.pid}`;
process.env.UPLOAD_DIR = process.env.TEST_UPLOAD_DIR || `uploads-test-${process.pid}`;

const { app } = await import('../server.js');
const { initDatabase } = await import('../src/server/db.js');

export const ADMIN_EMAIL = process.env.INITIAL_ADMIN_EMAIL || 'admin@azaroth-techhive.com';
export const ADMIN_PASSWORD = process.env.INITIAL_ADMIN_PASSWORD || 'Admin';

let server: http.Server;
let baseUrl = '';

/** Boots the database and mounts the app on a random free port. */
export async function startTestServer(): Promise<string> {
  if (baseUrl) return baseUrl;
  await initDatabase();
  server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address() as AddressInfo;
  baseUrl = `http://127.0.0.1:${port}`;
  return baseUrl;
}

export async function stopTestServer(): Promise<void> {
  if (server) {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    server = undefined as unknown as http.Server;
    baseUrl = '';
  }
}

export function url(path: string): string {
  return `${baseUrl}${path}`;
}

export interface JsonResult<T = any> {
  status: number;
  body: T;
  headers: Headers;
}

/** Small fetch wrapper that always parses the JSON body. */
export async function api<T = any>(
  path: string,
  options: { method?: string; token?: string; body?: unknown; headers?: Record<string, string> } = {}
): Promise<JsonResult<T>> {
  const { method = 'GET', token, body, headers = {} } = options;
  const finalHeaders: Record<string, string> = { ...headers };
  if (body !== undefined) finalHeaders['Content-Type'] = 'application/json';
  if (token) finalHeaders['Authorization'] = `Bearer ${token}`;

  const res = await fetch(url(path), {
    method,
    headers: finalHeaders,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const text = await res.text();
  let parsed: any = undefined;
  try {
    parsed = text ? JSON.parse(text) : undefined;
  } catch {
    parsed = text;
  }
  return { status: res.status, body: parsed, headers: res.headers };
}

/** Logs in as the seeded administrator and returns the bearer token. */
export async function loginAdmin(): Promise<string> {
  const res = await api('/api/auth/login', {
    method: 'POST',
    body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  });
  if (res.status !== 200) {
    throw new Error(`Admin login failed (${res.status}): ${JSON.stringify(res.body)}`);
  }
  return res.body.token as string;
}

/** Unique suffix so parallel/rerun tests never collide on a unique column. */
export function uniqueId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
