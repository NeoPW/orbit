import { useNow } from '../../../core/dates/today.ts';
import { elapsedMs, formatElapsed, formatOvertime } from '../domain/timer.ts';
import styles from './TimerReadout.module.css';

export interface TimerReadoutProps {
  startedAt: string;
  plannedMinutes: number | null;
  large?: boolean;
}

/** The elapsed time counting up every second, with the planned length and the overtime; large adds a progress bar in `--pc`. */
export function TimerReadout({ startedAt, plannedMinutes, large = false }: TimerReadoutProps) {
  const now = useNow(1000);
  const elapsed = elapsedMs(startedAt, now);
  const overtime = formatOvertime(elapsed, plannedMinutes);
  const percent = plannedMinutes ? Math.min(100, Math.round((elapsed / (plannedMinutes * 60_000)) * 100)) : null;
  const left = plannedMinutes ? formatElapsed(plannedMinutes * 60_000 - elapsed) : '';
  return (
    <div className={`${styles.readout} ${large ? styles.large : ''}`}>
      <span className={styles.time} role="timer">
        {formatElapsed(elapsed)}
      </span>
      {plannedMinutes !== null &&
        (large ? (
          <span className={styles.plan}>
            {overtime ? `The ${plannedMinutes} min are over · ` : `of ${plannedMinutes} min · `}
            <span className={overtime ? styles.over : styles.left}>{overtime ? `${overtime} over` : `${left} left`}</span>
          </span>
        ) : (
          <span className={styles.plan}>
            {overtime ? `The ${plannedMinutes} minutes are over` : `of ${plannedMinutes} minutes`}
            {overtime && <span className={styles.over}>{overtime}</span>}
          </span>
        ))}
      {large && percent !== null && (
        <div
          className={styles.bar}
          role="progressbar"
          aria-label="Session progress"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div className={styles.fill} style={{ width: `${percent}%` }} />
        </div>
      )}
    </div>
  );
}
