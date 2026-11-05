import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { SqlDriver } from '../../../platform/db/driver.ts';
import { runSync } from '../data/engine.ts';
import { EMPTY_STATE, readState, type SyncState } from '../data/state.ts';
import { createSyncScheduler } from '../scheduler.ts';

export interface SyncContextValue {
  state: SyncState;
  /** False until the stored sync state has been read. */
  loaded: boolean;
  syncing: boolean;
  connected: boolean;
  syncNow: () => Promise<void>;
  /** Stops scheduled syncs, before disconnecting. */
  stop: () => void;
  /** Re-reads the stored sync state, after connecting or disconnecting. */
  refresh: () => Promise<void>;
  /** Increases after each sync and after local data was replaced; screens reload their data when it changes. */
  dataVersion: number;
  dataReplaced: () => void;
}

const SyncContext = createContext<SyncContextValue | null>(null);

interface Props {
  driver: SqlDriver;
  onWrite: (listener: () => void) => () => void;
  children: ReactNode;
}

/**
 * Runs sync for the whole app while it is open (mounted once in AppRoot), so
 * sync keeps going whichever screen is shown.
 */
export function SyncRunner({ driver, onWrite, children }: Props) {
  const [state, setState] = useState<SyncState>(EMPTY_STATE);
  const [loaded, setLoaded] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [dataVersion, setDataVersion] = useState(0);

  const refresh = useCallback(async () => {
    setState(await readState(driver));
    setLoaded(true);
  }, [driver]);

  const dataReplaced = useCallback(() => setDataVersion((n) => n + 1), []);

  const scheduler = useMemo(
    () =>
      createSyncScheduler({
        run: async () => {
          setSyncing(true);
          try {
            return await runSync(driver);
          } finally {
            setSyncing(false);
            await refresh();
            setDataVersion((n) => n + 1);
          }
        },
      }),
    [driver, refresh],
  );

  useEffect(() => {
    let active = true;
    void readState(driver).then((next) => {
      if (!active) return;
      setState(next);
      setLoaded(true);
    });
    return () => {
      active = false;
    };
  }, [driver]);

  const connected = state.url !== null && state.token !== null;

  useEffect(() => {
    if (!connected) return;
    scheduler.start();
    const unsubscribe = onWrite(() => scheduler.notifyWrite());
    return () => {
      unsubscribe();
      scheduler.stop();
    };
  }, [connected, scheduler, onWrite]);

  const value = useMemo<SyncContextValue>(
    () => ({
      state,
      loaded,
      syncing,
      connected,
      syncNow: scheduler.syncNow,
      stop: scheduler.stop,
      refresh,
      dataVersion,
      dataReplaced,
    }),
    [state, loaded, syncing, connected, scheduler, refresh, dataVersion, dataReplaced],
  );

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}

export function useSync(): SyncContextValue {
  const value = useContext(SyncContext);
  if (!value) throw new Error('useSync() needs a SyncRunner');
  return value;
}
