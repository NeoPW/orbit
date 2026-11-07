import { useState } from 'react';
import { NumberField } from '../../../core/ui/components/NumberField.tsx';
import { isValidSetting, useSettings } from '../data/settings.ts';
import styles from './SettingsScreen.module.css';

function TargetField({ initial, save }: { initial: number | null; save: (value: number | null) => Promise<boolean> }) {
  const [value, setValue] = useState<number | null>(initial);
  const [invalid, setInvalid] = useState(false);
  return (
    <NumberField
      label="Weekly hour target"
      value={value}
      placeholder="No target"
      error={invalid ? 'Enter a whole number of hours from 1 to 168, or leave it empty' : null}
      onChange={(next) => {
        setValue(next);
        // An empty field clears the target; text that is not a number is as invalid as 0 or 200.
        const ok = isValidSetting('weeklyTargetHours', next);
        setInvalid(!ok);
        if (ok) void save(next);
      }}
    />
  );
}

/** The Review section of Settings. */
export function ReviewSettings() {
  const { settings, loaded, save } = useSettings();
  if (!loaded) return null;
  return (
    <div className={styles.fields}>
      <TargetField initial={settings.weeklyTargetHours} save={(value) => save('weeklyTargetHours', value)} />
    </div>
  );
}
