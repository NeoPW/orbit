import { useEffect, useRef, useState } from 'react';
import { useServices } from '../../app/services.ts';
import { useSync } from '../../features/sync/ui/SyncRunner.tsx';
import { subscribeSettings } from '../../features/settings/data/settings.ts';
import type { Db } from './drizzle.ts';

/** Schedules `callback` for the next frame and returns a function that cancels it. */
export type FrameScheduler = (callback: () => void) => () => void;

export const animationFrame: FrameScheduler = (callback) => {
  const id = requestAnimationFrame(callback);
  return () => cancelAnimationFrame(id);
};

export interface Reloader {
  /** Asks for a run: coalesced to one per frame, and never overlapping a run in progress. */
  request: () => void;
  /** Stops pending and future runs. */
  dispose: () => void;
}

/**
 * Coalesces reload requests: any number of `request()` calls before the next
 * frame give one run; a request during a run gives exactly one more run after it.
 */
export function createReloader(run: () => Promise<void>, schedule: FrameScheduler = animationFrame): Reloader {
  let cancelFrame: (() => void) | null = null;
  let running = false;
  let dirty = false;
  let disposed = false;

  function start() {
    cancelFrame = schedule(() => {
      cancelFrame = null;
      void execute();
    });
  }

  async function execute() {
    running = true;
    dirty = false;
    try {
      await run();
    } finally {
      running = false;
      if (dirty && !disposed) start();
    }
  }

  return {
    request() {
      if (disposed) return;
      if (running) dirty = true;
      else if (!cancelFrame) start();
    },
    dispose() {
      disposed = true;
      cancelFrame?.();
      cancelFrame = null;
    },
  };
}

/**
 * Runs `load(db)` and returns its result, `undefined` until the first run.
 * It runs again after every local write, every sync, every settings change and
 * when `deps` change; the previous data stays until the new data arrives.
 * `load` may use anything listed in `deps`.
 */
export function useLiveQuery<T>(load: (db: Db) => Promise<T>, deps: readonly unknown[] = []): T | undefined {
  const { db, onWrite } = useServices();
  const { dataVersion } = useSync();
  const [data, setData] = useState<T | undefined>(undefined);
  const loadRef = useRef(load);

  useEffect(() => {
    loadRef.current = load;
  });

  useEffect(() => {
    let active = true;
    const reloader = createReloader(async () => {
      try {
        const next = await loadRef.current(db);
        if (active) setData(() => next);
      } catch (error) {
        console.error('Live query failed', error);
      }
    });
    reloader.request();
    const stopWrites = onWrite(reloader.request);
    const stopSettings = subscribeSettings(reloader.request);
    return () => {
      active = false;
      reloader.dispose();
      stopWrites();
      stopSettings();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db, onWrite, dataVersion, ...deps]);

  return data;
}
