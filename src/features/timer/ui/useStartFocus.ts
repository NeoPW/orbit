import { useCallback } from 'react';
import { useServices } from '../../../app/services.ts';
import { navigate } from '../../../core/routing/useRoute.ts';
import { useSettings } from '../../settings/data/settings.ts';
import type { LogTarget } from '../../work-log/data/log-repository.ts';
import { startTimer } from '../data/timer-repository.ts';

const clock = () => new Date();

export interface StartFocus {
  /** Starts a focus session (null minutes: open-ended), remembers a chosen length and opens focus mode. */
  start: (target: LogTarget, plannedMinutes: number | null) => Promise<void>;
  /** Starts with the length last chosen. */
  startWithLastLength: (target: LogTarget) => Promise<void>;
}

export function useStartFocus(): StartFocus {
  const { db } = useServices();
  const { settings, save } = useSettings();
  const lastLength = settings.focusMinutes;

  const start = useCallback(
    async (target: LogTarget, plannedMinutes: number | null) => {
      await startTimer(db, clock, target, plannedMinutes);
      await save('focusMinutes', plannedMinutes);
      navigate({ name: 'focus' });
    },
    [db, save],
  );
  const startWithLastLength = useCallback((target: LogTarget) => start(target, lastLength), [start, lastLength]);
  return { start, startWithLastLength };
}
