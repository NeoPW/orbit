import type { CSSProperties, ReactNode } from 'react';
import styles from './Chip.module.css';

export type ChipTone = 'neutral' | 'primary' | 'secondary' | 'amber' | 'red';

export interface ChipProps {
  children: ReactNode;
  /** Color scheme for a status; ignored when `color` is set. */
  tone?: ChipTone;
  /** An area's color: shown as a dot and a tinted border. */
  color?: string;
  icon?: ReactNode;
  /** Makes the chip a button, for example a status chip that offers the other statuses. */
  onClick?: () => void;
  title?: string;
}

export function Chip({ children, tone = 'neutral', color, icon, onClick, title }: ChipProps) {
  const className = [styles.chip, color ? styles.area : styles[tone], onClick ? styles.clickable : undefined]
    .filter(Boolean)
    .join(' ');
  const style = color ? ({ '--chip-color': color } as CSSProperties) : undefined;
  const content = (
    <>
      {color && <span className={styles.dot} aria-hidden="true" />}
      {icon}
      {children}
    </>
  );
  if (onClick) {
    return (
      <button type="button" className={className} style={style} onClick={onClick} title={title}>
        {content}
      </button>
    );
  }
  return (
    <span className={className} style={style} title={title}>
      {content}
    </span>
  );
}
