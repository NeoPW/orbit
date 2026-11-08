import { SCHEMA_VERSION } from '../../src/core/db/version.ts';
import type { SqlDriver } from '../../src/platform/db/driver.ts';
import { isAuthorized } from './auth.ts';
import { HttpError } from './errors.ts';
import { parseCursor, pull } from './pull.ts';
import { push } from './push.ts';
import { parseReminderTarget, reminderNeeded } from './reminder-check.ts';
import { status } from './status.ts';

export const MAX_BODY_BYTES = 1_000_000;
export const VERSION_HEADER = 'Orbit-Schema-Version';

export interface ApiDeps {
  driver: SqlDriver;
  /** The `DEVICE_TOKENS` secret. */
  deviceTokens: string | undefined;
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': `Authorization, Content-Type, ${VERSION_HEADER}`,
  'Access-Control-Max-Age': '86400',
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

function requireVersion(request: Request) {
  if (request.headers.get(VERSION_HEADER) !== String(SCHEMA_VERSION)) {
    throw new HttpError(409, `Schema version mismatch: the server expects version ${SCHEMA_VERSION}`);
  }
}

async function readJson(request: Request): Promise<unknown> {
  const text = await request.text();
  if (new TextEncoder().encode(text).length > MAX_BODY_BYTES) throw new HttpError(413, 'The body is too large');
  try {
    return JSON.parse(text);
  } catch {
    throw new HttpError(400, 'The body is not valid JSON');
  }
}

async function route(request: Request, url: URL, { driver }: ApiDeps): Promise<Response> {
  const method = request.method;
  switch (url.pathname) {
    case '/api/status':
      if (method !== 'GET') break;
      return json(await status(driver));
    case '/api/push':
      if (method !== 'POST') break;
      requireVersion(request);
      return json(await push(driver, await readJson(request)));
    case '/api/pull':
      if (method !== 'GET') break;
      requireVersion(request);
      return json(await pull(driver, parseCursor(url.searchParams.get('cursor'))));
    case '/api/reminder-check':
      if (method !== 'POST') break;
      requireVersion(request);
      return json({ needed: await reminderNeeded(driver, parseReminderTarget(await readJson(request))) });
    default:
      throw new HttpError(404, 'Not found');
  }
  throw new HttpError(405, 'Method not allowed');
}

/** Handles one request to `/api/*`: CORS, device token, schema version, routing, JSON errors. */
export async function handleApi(request: Request, deps: ApiDeps): Promise<Response> {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
  try {
    if (!(await isAuthorized(request.headers.get('Authorization'), deps.deviceTokens))) {
      throw new HttpError(401, 'Unauthorized');
    }
    return await route(request, new URL(request.url), deps);
  } catch (error) {
    if (error instanceof HttpError) return json({ error: error.message }, error.status);
    console.error(error);
    return json({ error: 'Internal error' }, 500);
  }
}
