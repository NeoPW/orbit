import { useNow } from '../../../core/dates/today.ts';
import { elapsedMs, formatElapsed, formatOvertime } from '../domain/timer.ts';
import styles from './TimerReadout.module.css';

export interface TimerReadoutProps {
  startedAt: string;
  plannedMinutes: number | null;
  large?: boolean;
}

/** The elapsed time counting up every second, with the planned length and the overtime. */
export function TimerReadout({ startedAt, plannedMinutes, large = false }: TimerReadoutProps) {
  const now = useNow(1000);
  const elapsed = elapsedMs(startedAt, now);
  const overtime = formatOvertime(elapsed, plannedMinutes);
  return (
    <div className={`${styles.readout} ${large ? styles.large : ''}`}>
      <span className={styles.time} role="timer">
        {formatElapsed(elapsed)}
      </span>
      {plannedMinutes !== null && (
        <span className={styles.plan}>
          {overtime ? `The ${plannedMinutes} minutes are over` : `of ${plannedMinutes} minutes`}
          {overtime && <span className={styles.over}>{overtime}</span>}
        </span>
      )}
    </div>
  );
}
