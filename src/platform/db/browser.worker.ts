/// <reference lib="webworker" />
// SQLite for the browser build: sqlite-wasm with the opfs-sahpool VFS, which
// keeps orbit.db in the origin private file system and needs no cross-origin
// isolation headers. Without OPFS (e.g. Firefox private windows) the database
// lives in memory and the app shows a warning.
import sqlite3InitModule from '@sqlite.org/sqlite-wasm';

type Method = 'run' | 'all' | 'values' | 'get';
type WorkerQuery = { sql: string; params: unknown[]; method: Method };
type QueryRows = { rows: unknown[][] };
type Database = {
  exec(opts: { sql: string; bind?: unknown[]; rowMode: 'array'; returnValue: 'resultRows' }): unknown[][];
  transaction<T>(callback: () => T): T;
};

export type WorkerRequest =
  | { id: number; kind: 'open' }
  | { id: number; kind: 'query'; query: WorkerQuery }
  | { id: number; kind: 'batch'; queries: WorkerQuery[] };

export type WorkerResponse =
  | { id: number; ok: true; result: { storage: 'opfs' | 'memory' } | QueryRows | QueryRows[] }
  | { id: number; ok: false; error: string };

let db: Database | undefined;

async function open(): Promise<{ storage: 'opfs' | 'memory' }> {
  const sqlite3 = await sqlite3InitModule();
  try {
    const pool = await sqlite3.installOpfsSAHPoolVfs({ name: 'orbit-sahpool' });
    db = new pool.OpfsSAHPoolDb('/orbit.db') as unknown as Database;
    return { storage: 'opfs' };
  } catch (error) {
    console.warn('OPFS unavailable, using an in-memory database:', error);
    db = new sqlite3.oo1.DB(':memory:', 'c') as unknown as Database;
    return { storage: 'memory' };
  }
}

function run(query: WorkerQuery): QueryRows {
  if (!db) throw new Error('Database is not open');
  const rows = db.exec({
    sql: query.sql,
    bind: query.params.length > 0 ? query.params.map(toBindable) : undefined,
    rowMode: 'array',
    returnValue: 'resultRows',
  });
  if (query.method === 'run') return { rows: [] };
  if (query.method === 'get') return { rows: rows.slice(0, 1) };
  return { rows };
}

function toBindable(value: unknown): unknown {
  return typeof value === 'boolean' ? Number(value) : value;
}

async function handle(request: WorkerRequest): Promise<unknown> {
  switch (request.kind) {
    case 'open':
      return open();
    case 'query':
      return run(request.query);
    case 'batch': {
      const database = db;
      if (!database) throw new Error('Database is not open');
      return database.transaction(() => request.queries.map(run));
    }
  }
}

self.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const request = event.data;
  try {
    const result = await handle(request);
    self.postMessage({ id: request.id, ok: true, result } as WorkerResponse);
  } catch (error) {
    self.postMessage({ id: request.id, ok: false, error: error instanceof Error ? error.message : String(error) } satisfies WorkerResponse);
  }
};
