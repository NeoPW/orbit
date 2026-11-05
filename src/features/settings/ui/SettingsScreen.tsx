import { PageHeader } from '../../../core/ui/components/PageHeader.tsx';
import { SyncPanel } from '../../sync/ui/SyncPanel.tsx';
import styles from './SettingsScreen.module.css';

// The reminder settings come with the Settings feature change.
export function SettingsScreen() {
  return (
    <>
      <PageHeader title="Settings" />
      <section className={styles.section} aria-labelledby="settings-sync">
        <h2 id="settings-sync">Sync</h2>
        <SyncPanel />
      </section>
    </>
  );
}
