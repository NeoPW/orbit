import { Hourglass } from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Button } from '../../../core/ui/components/Button.tsx';
import { Menu } from '../../../core/ui/components/Menu.tsx';
import { TextField } from '../../../core/ui/components/TextField.tsx';
import styles from './TimeLimit.module.css';

const PRESETS = [15, 30, 45, 60, 90];

export interface TimeLimitProps {
  /** The current limit in worked minutes, or null. */
  minutes: number | null;
  onChange: (minutes: number | null) => void;
  /** Receives a function that opens the menu, for the `L` key. */
  onOpener?: (open: () => void) => void;
}

/** "Time limit" menu of focus mode: 15, 30, 45, 60 or 90 minutes, a custom number of minutes, or none. */
export function TimeLimit({ minutes, onChange, onOpener }: TimeLimitProps) {
  const anchor = useRef<HTMLDivElement>(null);
  useEffect(() => {
    onOpener?.(() => anchor.current?.querySelector('button')?.click());
  }, [onOpener]);
  const [custom, setCustom] = useState(false);
  const [text, setText] = useState('');
  const value = Number(text);
  const valid = Number.isInteger(value) && value >= 1 && value <= 24 * 60;

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!valid) return;
    onChange(value);
    setCustom(false);
  }

  if (custom) {
    return (
      <form className={styles.custom} onSubmit={submit} noValidate>
        <TextField
          label="Limit in minutes"
          type="text"
          inputMode="numeric"
          value={text}
          onChange={(event) => setText(event.target.value)}
          autoFocus
        />
        <Button type="submit" variant="primary" disabled={!valid}>
          Set
        </Button>
        <Button variant="ghost" onClick={() => setCustom(false)}>
          Cancel
        </Button>
      </form>
    );
  }
  const isPreset = minutes !== null && PRESETS.includes(minutes);
  return (
    <div ref={anchor}>
      <Menu
        label="Time limit"
        trigger={(props) => (
          <Button variant="ghost" icon={<Hourglass />} {...props}>
            {minutes === null ? 'Time limit' : `Limit: ${minutes} min`}
          </Button>
        )}
        items={[
          ...PRESETS.map((preset) => ({ label: `${preset} minutes`, checked: minutes === preset, onSelect: () => onChange(preset) })),
          {
            label: 'Custom…',
            checked: minutes !== null && !isPreset,
            onSelect: () => {
              setText(minutes === null ? '' : String(minutes));
              setCustom(true);
            },
          },
          { label: 'No limit', checked: minutes === null, onSelect: () => onChange(null) },
        ]}
      />
    </div>
  );
}
