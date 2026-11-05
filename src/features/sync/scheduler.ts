export const DEBOUNCE_MS = 3000;
export const INTERVAL_MS = 5 * 60 * 1000;

/** Subscribes to "the app came to the foreground"; returns the unsubscribe function. */
export type ForegroundSubscription = (onForeground: () => void) => () => void;

/** The page becoming visible, or the window getting focus. Does nothing outside a browser page. */
export const browserForeground: ForegroundSubscription = (onForeground) => {
  if (typeof document === 'undefined' || typeof window === 'undefined') return () => undefined;
  const onVisibility = () => {
    if (document.visibilityState === 'visible') onForeground();
  };
  document.addEventListener('visibilitychange', onVisibility);
  window.addEventListener('focus', onForeground);
  return () => {
    document.removeEventListener('visibilitychange', onVisibility);
    window.removeEventListener('focus', onForeground);
  };
};

export interface SchedulerOptions {
  /** Runs one sync cycle; must not throw. */
  run: () => Promise<unknown>;
  foreground?: ForegroundSubscription;
  debounceMs?: number;
  intervalMs?: number;
}

export interface SyncScheduler {
  /** Syncs now, then on every trigger until `stop()`. */
  start(): void;
  stop(): void;
  /** A synced table was written: sync after the changes settle. */
  notifyWrite(): void;
  /** "Sync now"; resolves when the sync it led to is done. */
  syncNow(): Promise<void>;
}

/**
 * Decides when syncs run. At most one runs at a time; triggers that arrive
 * during a run lead to exactly one more run after it.
 */
export function createSyncScheduler(options: SchedulerOptions): SyncScheduler {
  const debounceMs = options.debounceMs ?? DEBOUNCE_MS;
  const intervalMs = options.intervalMs ?? INTERVAL_MS;
  const foreground = options.foreground ?? browserForeground;
  let active = false;
  let current: Promise<void> | null = null;
  let queued: Promise<void> | null = null;
  let debounce: ReturnType<typeof setTimeout> | undefined;
  let interval: ReturnType<typeof setInterval> | undefined;
  let unsubscribe: (() => void) | undefined;

  function trigger(): Promise<void> {
    if (!active) return Promise.resolve();
    if (current === null) {
      current = options
        .run()
        .then(() => undefined, () => undefined)
        .finally(() => {
          current = null;
        });
      return current;
    }
    queued ??= current.then(() => {
      queued = null;
      return trigger();
    });
    return queued;
  }

  return {
    start() {
      if (active) return;
      active = true;
      unsubscribe = foreground(() => void trigger());
      interval = setInterval(() => void trigger(), intervalMs);
      void trigger();
    },
    stop() {
      active = false;
      clearTimeout(debounce);
      clearInterval(interval);
      unsubscribe?.();
      unsubscribe = undefined;
    },
    notifyWrite() {
      if (!active) return;
      clearTimeout(debounce);
      debounce = setTimeout(() => void trigger(), debounceMs);
    },
    syncNow: trigger,
  };
}
