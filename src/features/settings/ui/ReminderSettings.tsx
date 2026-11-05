import { useState } from 'react';
import { NumberField } from '../../../core/ui/components/NumberField.tsx';
import { Select } from '../../../core/ui/components/Select.tsx';
import { Switch } from '../../../core/ui/components/Switch.tsx';
import { TimeField } from '../../../core/ui/components/TimeField.tsx';
import { platform } from '../../../platform/platform.ts';
import { isValidSetting, useSettings, type Settings } from '../data/settings.ts';
import styles from './SettingsScreen.module.css';

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((label, i) => ({ value: String(i + 1), label }));

type TimeKey = 'reminderTime' | 'reviewTime';

/** A time setting: saved as soon as the text is a valid time; emptying it shows an error and keeps the last saved time. */
function TimeSetting({ label, settingKey, initial, save }: { label: string; settingKey: TimeKey; initial: string; save: (key: TimeKey, value: string) => Promise<boolean> }) {
  const [time, setTime] = useState<string | null>(initial);
  return (
    <TimeField
      label={label}
      value={time}
      error={time === null ? 'Enter a time as HH:mm' : null}
      onChange={(value) => {
        setTime(value);
        if (value !== null) void save(settingKey, value);
      }}
    />
  );
}

function LeadDaysField({ initial, save }: { initial: number; save: (value: number) => Promise<boolean> }) {
  const [value, setValue] = useState<number | null>(initial);
  const [invalid, setInvalid] = useState(false);
  return (
    <NumberField
      label="Deadline lead time (days)"
      value={value}
      error={invalid ? 'Enter a whole number from 1 to 30' : null}
      onChange={(next) => {
        setValue(next);
        const ok = next !== null && isValidSetting('leadDays', next);
        setInvalid(!ok);
        if (ok) void save(next);
      }}
    />
  );
}

/** The Reminders section of Settings. */
export function ReminderSettings() {
  const { settings, loaded, save } = useSettings();
  if (!loaded) return null;
  const saveOne = <K extends keyof Settings>(key: K, value: Settings[K]) => save(key, value);
  return (
    <>
      {platform === 'desktop' ? (
        <Switch label="Reminders" checked={settings.remindersOn} onChange={(on) => void saveOne('remindersOn', on)} />
      ) : (
        <p className={styles.note}>Reminders are shown by the desktop app.</p>
      )}
      <div className={styles.fields}>
        <TimeSetting label="Default reminder time" settingKey="reminderTime" initial={settings.reminderTime} save={saveOne} />
        <Select
          label="Weekly review day"
          value={String(settings.reviewDay)}
          options={WEEKDAYS}
          onChange={(value) => void saveOne('reviewDay', Number(value))}
        />
        <TimeSetting label="Weekly review time" settingKey="reviewTime" initial={settings.reviewTime} save={saveOne} />
        <LeadDaysField initial={settings.leadDays} save={(value) => saveOne('leadDays', value)} />
      </div>
    </>
  );
}
