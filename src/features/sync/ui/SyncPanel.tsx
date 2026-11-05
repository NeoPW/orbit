import { useCallback, useEffect, useMemo, useState } from 'react';
import { platform } from '../../../platform/platform.ts';
import type { SqlDriver } from '../../../platform/db/driver.ts';
import { SyncError } from '../data/api.ts';
import { checkServer, disconnect, saveConnection } from '../data/connect.ts';
import { runSync } from '../data/engine.ts';
import { EMPTY_STATE, readState, type SyncState } from '../data/state.ts';
import type { FailureReason } from '../data/types.ts';
import { suggestedAddress } from '../domain/address.ts';
import { formatDateTime } from '../domain/format.ts';
import { createSyncScheduler } from '../scheduler.ts';

// Placeholder UI until the Settings screen (the "Account & sync" section) exists.

const REASONS: Record<FailureReason, string> = {
  offline: 'no connection',
  token: 'token refused',
  version: 'different schema version',
  server: 'server error',
};

function connectError(error: unknown): string {
  if (error instanceof SyncError) {
    if (error.reason === 'token') return 'The server refused this token.';
    if (error.reason === 'offline') return 'The server could not be reached.';
  }
  return 'The server answered with an error.';
}

interface Props {
  driver: SqlDriver;
  /** Subscribes to writes of synced tables made by the app. */
  onWrite: (listener: () => void) => () => void;
  /** Called after each sync, so screens can show what was downloaded. */
  onSynced: () => void;
}

export function SyncPanel({ driver, onWrite, onSynced }: Props) {
  const [state, setState] = useState<SyncState>(EMPTY_STATE);
  const [loaded, setLoaded] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [address, setAddress] = useState(() => suggestedAddress(platform, window.location));
  const [token, setToken] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<{ url: string; token: string } | null>(null);

  const refresh = useCallback(async () => {
    setState(await readState(driver));
    setLoaded(true);
  }, [driver]);

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
            onSynced();
          }
        },
      }),
    [driver, refresh, onSynced],
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

  async function connect() {
    setError(null);
    try {
      const check = await checkServer(address, token);
      if (check.hasData) {
        setPending({ url: check.url, token });
        return;
      }
      await saveConnection(driver, { url: check.url, token }, 'upload');
      setToken('');
      await refresh();
    } catch (e) {
      setError(connectError(e));
    }
  }

  async function replace() {
    if (!pending) return;
    await saveConnection(driver, pending, 'replace');
    setPending(null);
    setToken('');
    await refresh();
    onSynced();
  }

  async function disconnectDevice() {
    scheduler.stop();
    await disconnect(driver);
    await refresh();
  }

  if (!loaded) return null;

  if (pending) {
    return (
      <section>
        <h2>Sync</h2>
        <p role="alert">
          The server already holds data. Replace the data on this device with it? Everything on this device that is not on the server is lost.
        </p>
        <button onClick={() => void replace()}>Replace</button> <button onClick={() => setPending(null)}>Cancel</button>
      </section>
    );
  }

  if (!connected) {
    return (
      <section>
        <h2>Sync</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void connect();
          }}
        >
          <p>
            <label>
              Server address <input value={address} onChange={(e) => setAddress(e.target.value)} />
            </label>
          </p>
          <p>
            <label>
              Device token <input type="password" value={token} onChange={(e) => setToken(e.target.value)} />
            </label>
          </p>
          <button type="submit" disabled={address.trim() === '' || token.trim() === ''}>
            Connect
          </button>
          {error && <p role="alert">{error}</p>}
        </form>
      </section>
    );
  }

  return (
    <section>
      <h2>Sync</h2>
      <p>Connected to {state.url}</p>
      {state.lastSuccess && <p>Last synced {formatDateTime(state.lastSuccess)}</p>}
      {state.lastFailure && <p>Last sync failed: {REASONS[state.lastFailure.reason]}</p>}
      <button onClick={() => void scheduler.syncNow()} disabled={syncing}>
        {syncing ? 'Syncing…' : 'Sync now'}
      </button>{' '}
      <button onClick={() => void disconnectDevice()}>Disconnect</button>
    </section>
  );
}
