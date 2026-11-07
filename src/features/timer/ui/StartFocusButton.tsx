import { Play } from 'lucide-react';
import { Button } from '../../../core/ui/components/Button.tsx';
import type { LogTarget } from '../../work-log/data/log-repository.ts';
import { useStartFocus } from './useStartFocus.ts';

/** "Start focus": starts a session without a time limit (the limit is set in focus mode). */
export function StartFocusButton({ target }: { target: LogTarget }) {
  const { start } = useStartFocus();
  return (
    <Button icon={<Play />} onClick={() => void start(target)}>
      Start focus
    </Button>
  );
}
