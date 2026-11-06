import { ThemeSwitcher } from '../../../core/ui/components/ThemeSwitcher.tsx';
import { Section } from '../../../core/ui/components/Section.tsx';
import { PageHeader } from '../../../core/ui/components/PageHeader.tsx';
import { SyncPanel } from '../../sync/ui/SyncPanel.tsx';
import { useSettings } from '../data/settings.ts';
import { ExampleDataSection } from './ExampleDataSection.tsx';
import { ReminderSettings } from './ReminderSettings.tsx';
import styles from './SettingsScreen.module.css';

export function SettingsScreen() {
  const { settings, save } = useSettings();
  return (
    <div className={styles.page}>
      <PageHeader title="Settings" />
      <Section tile title="Appearance">
        <ThemeSwitcher showNames value={settings.theme} onChange={(id) => void save('theme', id)} />
      </Section>
      <Section tile title="Reminders">
        <ReminderSettings />
      </Section>
      <Section tile title="Sync">
        <SyncPanel />
      </Section>
      {import.meta.env.DEV && <ExampleDataSection />}
    </div>
  );
}
