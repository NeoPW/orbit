import styles from './ProgressBar.module.css';

export interface ProgressBarProps {
  /** 0 to 1; values outside are clamped. */
  value: number;
  /** Bar color, usually the goal's color. */
  color: string;
  /** Accessible name, for example the measure's name. */
  label: string;
}

/** A slim bar in `color` with the percentage next to it. */
export function ProgressBar({ value, color, label }: ProgressBarProps) {
  const percent = Math.round(Math.min(1, Math.max(0, value)) * 100);
  return (
    <div className={styles.progress}>
      <div className={styles.track} role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}>
        <div className={styles.fill} style={{ width: `${percent}%`, background: color }} />
      </div>
      <span className={styles.percent}>{percent} %</span>
    </div>
  );
}
