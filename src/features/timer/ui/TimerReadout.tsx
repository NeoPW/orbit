import { useNow } from '../../../core/dates/today.ts';
import { formatElapsed, formatOvertime, workedMs, type SessionClock } from '../domain/timer.ts';
import styles from './TimerReadout.module.css';

export interface TimerReadoutProps {
  session: SessionClock;
  /** The time limit in worked minutes, or null. */
  limitMinutes: number | null;
  large?: boolean;
}

/** The worked time counting up every second while running, with the time limit and the overtime; large adds a progress bar in `--pc`. */
export function TimerReadout({ session, limitMinutes, large = false }: TimerReadoutProps) {
  const now = useNow(1000);
  const worked = workedMs(session, now);
  const paused = session.pausedAt !== null;
  const overtime = formatOvertime(worked, limitMinutes);
  const percent = limitMinutes ? Math.min(100, Math.round((worked / (limitMinutes * 60_000)) * 100)) : null;
  const left = limitMinutes ? formatElapsed(limitMinutes * 60_000 - worked) : '';
  return (
    <div className={`${styles.readout} ${large ? styles.large : ''}`}>
      <span className={styles.time} role="timer">
        {formatElapsed(worked)}
      </span>
      {paused && <span className={styles.paused}>Paused</span>}
      {limitMinutes !== null &&
        (large ? (
          <span className={styles.plan}>
            {overtime ? `The ${limitMinutes} min are over · ` : `of ${limitMinutes} min · `}
            <span className={overtime ? styles.over : styles.left}>{overtime ? `${overtime} over` : `${left} left`}</span>
          </span>
        ) : (
          <span className={styles.plan}>
            {overtime ? `The ${limitMinutes} minutes are over` : `of ${limitMinutes} minutes`}
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
