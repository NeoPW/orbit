import type { CSSProperties } from 'react';
import styles from './ProgressBar.module.css';

export interface ProgressBarProps {
  /** 0 to 1; values outside are clamped. */
  value: number;
  /** Bar color, usually the goal's color. */
  color: string;
  /** Accessible name, for example the measure's name. */
  label: string;
  /** Part of `value` (0 to 1) gained recently, drawn as a striped segment at the end of the bar. */
  gain?: number;
}

/** A slim bar in `color` with the percentage next to it. */
export function ProgressBar({ value, color, label, gain = 0 }: ProgressBarProps) {
  const percent = Math.round(Math.min(1, Math.max(0, value)) * 100);
  const gained = Math.min(percent, Math.round(Math.min(1, Math.max(0, gain)) * 100));
  return (
    <div className={styles.progress}>
      <div className={styles.track} role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}>
        <div className={styles.fill} style={{ width: `${percent - gained}%`, background: color }} />
        {gained > 0 && (
          <div
            className={styles.gain}
            style={{ left: `${percent - gained}%`, width: `${gained}%`, '--bar-color': color } as CSSProperties}
          />
        )}
      </div>
      <span className={styles.percent}>{percent} %</span>
    </div>
  );
}
