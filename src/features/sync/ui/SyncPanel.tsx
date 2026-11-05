import { Cloud, CloudOff, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { useServices } from '../../../app/services.ts';
import { Button } from '../../../core/ui/components/Button.tsx';
import { Chip } from '../../../core/ui/components/Chip.tsx';
import { ConfirmDialog } from '../../../core/ui/components/ConfirmDialog.tsx';
import { TextField } from '../../../core/ui/components/TextField.tsx';
import { platform } from '../../../platform/platform.ts';
import { SyncError } from '../data/api.ts';
import { checkServer, disconnect, saveConnection } from '../data/connect.ts';
import type { FailureReason } from '../data/types.ts';
import { suggestedAddress } from '../domain/address.ts';
import { formatDateTime } from '../domain/format.ts';
import styles from './SyncPanel.module.css';
import { useSync } from './SyncRunner.tsx';

/** The "Sync" section of Settings: connect this device, its sync status, Sync now and Disconnect. */

const REASONS: Record<FailureReason, string> = {
  offline: 'no connection',
  token: 'token refused',
  version: 'different schema version',
  server: 'server error',
};

function connectError(error: unknown): string {
  if (error instanceof SyncError) {
    if (error.reason === 'token') return 'The server refused this token';
    if (error.reason === 'offline') return 'The server could not be reached';
  }
  return 'The server answered with an error';
}

export function SyncPanel() {
  const { driver } = useServices();
  const sync = useSync();
  const [address, setAddress] = useState(() => suggestedAddress(platform, window.location));
  const [token, setToken] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<{ url: string; token: string } | null>(null);

  async function connect() {
    setError(null);
    setBusy(true);
    try {
      const check = await checkServer(address, token);
      if (check.hasData) {
        setPending({ url: check.url, token });
        return;
      }
      await saveConnection(driver, { url: check.url, token }, 'upload');
      setToken('');
      await sync.refresh();
    } catch (e) {
      setError(connectError(e));
    } finally {
      setBusy(false);
    }
  }

  async function replace() {
    if (!pending) return;
    await saveConnection(driver, pending, 'replace');
    setPending(null);
    setToken('');
    await sync.refresh();
    sync.dataReplaced();
  }

  async function disconnectDevice() {
    sync.stop();
    await disconnect(driver);
    await sync.refresh();
  }

  if (!sync.loaded) return null;

  if (!sync.connected) {
    return (
      <>
        <form
          className={styles.form}
          onSubmit={(e) => {
            e.preventDefault();
            void connect();
          }}
        >
          <TextField label="Server address" value={address} onChange={(e) => setAddress(e.target.value)} />
          <TextField
            label="Device token"
            type="password"
            autoComplete="off"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            error={error}
          />
          <div>
            <Button type="submit" variant="primary" icon={<Cloud />} disabled={busy || address.trim() === '' || token.trim() === ''}>
              Connect
            </Button>
          </div>
        </form>
        {pending && (
          <ConfirmDialog
            title="Replace the data on this device?"
            text="The server already holds data. Everything on this device that is not on the server is lost."
            confirmLabel="Replace"
            danger
            onConfirm={() => void replace()}
            onCancel={() => setPending(null)}
          />
        )}
      </>
    );
  }

  const { state } = sync;
  return (
    <div className={styles.status}>
      <div className={styles.line}>
        <Chip tone="secondary" icon={<Cloud aria-hidden="true" />}>
          Connected
        </Chip>
        <span className={styles.url}>{state.url}</span>
      </div>
      {state.lastSuccess && <p className={styles.muted}>Last synced {formatDateTime(state.lastSuccess)}</p>}
      {state.lastFailure && (
        <p className={styles.failure}>
          Last sync failed: {REASONS[state.lastFailure.reason]} ({formatDateTime(state.lastFailure.at)})
        </p>
      )}
      <div className={styles.actions}>
        <Button icon={<RefreshCw />} onClick={() => void sync.syncNow()} disabled={sync.syncing}>
          {sync.syncing ? 'Syncing…' : 'Sync now'}
        </Button>
        <Button variant="ghost" icon={<CloudOff />} onClick={() => void disconnectDevice()}>
          Disconnect
        </Button>
      </div>
    </div>
  );
}
