import { useCallback } from 'react';
import { useServices } from '../../../app/services.ts';
import { navigate } from '../../../core/routing/useRoute.ts';
import type { LogTarget } from '../../work-log/data/log-repository.ts';
import { startTimer } from '../data/timer-repository.ts';

const clock = () => new Date();

export interface StartFocus {
  /** Starts a focus session without a time limit and opens focus mode. */
  start: (target: LogTarget) => Promise<void>;
}

export function useStartFocus(): StartFocus {
  const { db } = useServices();
  const start = useCallback(
    async (target: LogTarget) => {
      await startTimer(db, clock, target);
      navigate({ name: 'focus' });
    },
    [db],
  );
  return { start };
}
