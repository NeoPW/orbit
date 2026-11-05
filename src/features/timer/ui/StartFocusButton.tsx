import { Play } from 'lucide-react';
import { Button } from '../../../core/ui/components/Button.tsx';
import { Menu } from '../../../core/ui/components/Menu.tsx';
import { useSettings } from '../../settings/data/settings.ts';
import type { LogTarget } from '../../work-log/data/log-repository.ts';
import { useStartFocus } from './useStartFocus.ts';

const LENGTHS: { minutes: number | null; label: string }[] = [
  { minutes: 25, label: '25 minutes' },
  { minutes: 50, label: '50 minutes' },
  { minutes: 90, label: '90 minutes' },
  { minutes: null, label: 'Open-ended' },
];

/** "Start focus" with the choice of the planned length; the session starts on choosing it. */
export function StartFocusButton({ target }: { target: LogTarget }) {
  const { start } = useStartFocus();
  const { settings } = useSettings();
  return (
    <Menu
      label="Start focus"
      trigger={(props) => (
        <Button icon={<Play />} {...props}>
          Start focus
        </Button>
      )}
      items={LENGTHS.map(({ minutes, label }) => ({
        label,
        checked: minutes === settings.focusMinutes,
        onSelect: () => void start(target, minutes),
      }))}
    />
  );
}
