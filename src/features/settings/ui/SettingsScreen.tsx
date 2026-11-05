import { PageHeader } from '../../../core/ui/components/PageHeader.tsx';
import { SyncPanel } from '../../sync/ui/SyncPanel.tsx';
import { ReminderSettings } from './ReminderSettings.tsx';
import styles from './SettingsScreen.module.css';

export function SettingsScreen() {
  return (
    <>
      <PageHeader title="Settings" />
      <section className={styles.section} aria-labelledby="settings-reminders">
        <h2 id="settings-reminders">Reminders</h2>
        <ReminderSettings />
      </section>
      <section className={styles.section} aria-labelledby="settings-sync">
        <h2 id="settings-sync">Sync</h2>
        <SyncPanel />
      </section>
    </>
  );
}
