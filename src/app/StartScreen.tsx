import { CircleAlert, Copy } from 'lucide-react';
import orbitIcon from '../../assets/icon/orbit.png';
import styles from './StartScreen.module.css';

export type StartState = { kind: 'loading' } | { kind: 'other-tab' } | { kind: 'error'; message: string };

/** Full-window screen before the shell: loading, open in another tab, or the database could not be opened. */
export function StartScreen({ state }: { state: StartState }) {
  return (
    <main className={styles.screen}>
      <img className={styles.logo} src={orbitIcon} alt={state.kind === 'loading' ? 'Orbit is loading' : ''} />
      {state.kind === 'other-tab' && (
        <div className={styles.card}>
          <Copy className={styles.icon} aria-hidden="true" />
          <h1>Orbit is open in another tab</h1>
          <p>Use that tab, or close it and reload this one.</p>
        </div>
      )}
      {state.kind === 'error' && (
        <div className={styles.card} role="alert">
          <CircleAlert className={`${styles.icon} ${styles.error}`} aria-hidden="true" />
          <h1>The database could not be opened</h1>
          <p className={styles.reason}>{state.message}</p>
        </div>
      )}
    </main>
  );
}
