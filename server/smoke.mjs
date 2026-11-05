// Smoke test for a running sync server: npm run server:smoke -- <url> <token>
const [base, token] = process.argv.slice(2);
if (!base || !token) {
  console.error('Usage: npm run server:smoke -- <url> <token>');
  process.exit(2);
}

let failed = false;
function check(name, ok, detail = '') {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${ok ? '' : ` ${detail}`}`);
  if (!ok) failed = true;
}

async function call(path, { method = 'GET', body, token: t = token, version } = {}) {
  const headers = {};
  if (t) headers.Authorization = `Bearer ${t}`;
  if (version !== null) headers['Orbit-Schema-Version'] = String(version ?? schemaVersion);
  if (body) headers['Content-Type'] = 'application/json';
  const response = await fetch(new URL(path, base), { method, headers, body: body && JSON.stringify(body) });
  return { status: response.status, json: await response.json().catch(() => null) };
}

let schemaVersion = 0;
const status = await call('/api/status', { version: null });
check('status answers 200', status.status === 200, JSON.stringify(status));
schemaVersion = status.json?.schemaVersion;

const id = crypto.randomUUID();
const area = (updatedAt, name) => ({
  id, created_at: '2026-11-05T09:00:00.000Z', updated_at: updatedAt, deleted_at: null, name, color: '#1E88E5', sort_order: 0,
});

const first = await call('/api/push', { method: 'POST', body: { rows: { areas: [area('2026-11-05T10:05:00.000Z', 'smoke')] } } });
check('push stores the area', first.json?.stored === 1, JSON.stringify(first));

const pulled = await call('/api/pull?cursor=0');
check('pull returns the area', pulled.json?.rows?.areas?.some((a) => a.id === id), JSON.stringify(pulled).slice(0, 200));

const older = await call('/api/push', { method: 'POST', body: { rows: { areas: [area('2026-11-05T10:00:00.000Z', 'older')] } } });
check('an older version stores nothing', older.json?.stored === 0, JSON.stringify(older));

// Leave the smoke area deleted so it does not show up in the app after the first sync.
const cleanup = await call('/api/push', { method: 'POST', body: { rows: { areas: [{ ...area('2026-11-05T10:10:00.000Z', 'smoke'), deleted_at: '2026-11-05T10:10:00.000Z' }] } } });
check('the smoke area can be deleted', cleanup.json?.stored === 1, JSON.stringify(cleanup));

check('no token gives 401', (await call('/api/pull', { token: '' })).status === 401);
check('wrong token gives 401', (await call('/api/pull', { token: 'wrong' })).status === 401);
check('wrong version gives 409', (await call('/api/pull', { version: schemaVersion + 1 })).status === 409);

process.exit(failed ? 1 : 0);
