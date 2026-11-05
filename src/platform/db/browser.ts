import type { SqlDriver, SqlQuery, SqlResult } from './driver.ts';
import type { PlatformDriver } from './index.ts';
import type { WorkerRequest, WorkerResponse } from './browser.worker.ts';

type Request = WorkerRequest extends infer R ? (R extends { id: number } ? Omit<R, 'id'> : never) : never;

/**
 * Only one tab may hold the database (the opfs-sahpool VFS is exclusive).
 * The Web Lock is held for the tab's lifetime and released when it closes.
 */
async function acquireTabLock(): Promise<boolean> {
  if (!('locks' in navigator)) return true;
  return new Promise((resolve) => {
    void navigator.locks.request('orbit-db', { ifAvailable: true }, (lock) => {
      resolve(lock !== null);
      // Keep the lock until the tab closes.
      return lock === null ? undefined : new Promise<never>(() => {});
    });
  });
}

function connect(worker: Worker) {
  let nextId = 1;
  const pending = new Map<number, { resolve: (value: unknown) => void; reject: (error: Error) => void }>();
  worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
    const response = event.data;
    const call = pending.get(response.id);
    if (!call) return;
    pending.delete(response.id);
    if (response.ok) call.resolve(response.result);
    else call.reject(new Error(response.error));
  };
  return <T>(request: Request): Promise<T> =>
    new Promise<T>((resolve, reject) => {
      const id = nextId++;
      pending.set(id, { resolve: resolve as (value: unknown) => void, reject });
      worker.postMessage({ ...request, id });
    });
}

/** SQLite WASM in a worker, stored in OPFS (or in memory when OPFS is unavailable). */
export async function openBrowserDriver(): Promise<PlatformDriver> {
  if (!(await acquireTabLock())) return { status: 'other-tab' };

  // Ask the browser not to evict our storage; the answer doesn't change what we do.
  void navigator.storage?.persist?.().catch(() => false);

  const worker = new Worker(new URL('./browser.worker.ts', import.meta.url), { type: 'module' });
  const call = connect(worker);
  const { storage } = await call<{ storage: 'opfs' | 'memory' }>({ kind: 'open' });

  const driver: SqlDriver = {
    query: (sql, params, method) => call<SqlResult>({ kind: 'query', query: { sql, params, method } }),
    batch: (queries: SqlQuery[]) => call<SqlResult[]>({ kind: 'batch', queries }),
    close: async () => worker.terminate(),
  };
  return { status: 'ready', driver, storage };
}
