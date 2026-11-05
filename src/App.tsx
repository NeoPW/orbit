import { eq, sql } from 'drizzle-orm';
import { useEffect, useState } from 'react';
import { openAppDatabase } from './core/db/app-database.ts';
import type { Db } from './core/db/drizzle.ts';
import { settings } from './core/db/schema.ts';
import { platform } from './platform/platform.ts';

// Placeholder until the app shell (change app-shell) replaces it. It shows the
// database state and counts starts, so persistence can be checked by hand.

type Status =
  | { kind: 'loading' }
  | { kind: 'ready'; storage: string; schemaVersion: number; starts: number }
  | { kind: 'other-tab' }
  | { kind: 'error'; message: string };

async function countStart(db: Db): Promise<number> {
  await db
    .insert(settings)
    .values({ key: 'app_starts', value: '1' })
    .onConflictDoUpdate({ target: settings.key, set: { value: sql`CAST(${settings.value} AS INTEGER) + 1` } });
  const row = await db.select().from(settings).where(eq(settings.key, 'app_starts')).get();
  return Number(row?.value ?? 0);
}

let loading: Promise<Status> | undefined;

function loadStatus(): Promise<Status> {
  loading ??= (async (): Promise<Status> => {
    const result = await openAppDatabase();
    if (result.status === 'other-tab') return { kind: 'other-tab' };
    if (result.status === 'error') return { kind: 'error', message: result.message };
    try {
      const starts = await countStart(result.db);
      return { kind: 'ready', storage: result.storage, schemaVersion: result.schemaVersion, starts };
    } catch (error) {
      return { kind: 'error', message: error instanceof Error ? error.message : String(error) };
    }
  })();
  return loading;
}

export function App() {
  const [status, setStatus] = useState<Status>({ kind: 'loading' });

  useEffect(() => {
    let active = true;
    void loadStatus().then((next) => {
      if (active) setStatus(next);
    });
    return () => {
      active = false;
    };
  }, []);

  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', padding: 32 }}>
      <h1>Orbit</h1>
      <p>Running on: {platform}</p>
      {status.kind === 'loading' && <p>Opening the database…</p>}
      {status.kind === 'other-tab' && <p>Orbit is already open in another tab.</p>}
      {status.kind === 'error' && <p role="alert">The database could not be opened: {status.message}</p>}
      {status.kind === 'ready' && (
        <>
          {status.storage === 'memory' && (
            <p role="alert">This browser offers no storage for Orbit: data is not saved and is lost when the page is closed.</p>
          )}
          <p>Storage: {status.storage}</p>
          <p>Schema version: {status.schemaVersion}</p>
          <p>Starts: {status.starts}</p>
        </>
      )}
    </main>
  );
}
