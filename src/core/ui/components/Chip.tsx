import type { CSSProperties, ReactNode } from 'react';
import styles from './Chip.module.css';

export type ChipTone = 'neutral' | 'primary' | 'secondary' | 'amber' | 'red';

export interface ChipProps {
  children: ReactNode;
  /** Color scheme for a status; ignored when `color` is set. */
  tone?: ChipTone;
  /** An area's color: shown as a dot and a tinted border. */
  color?: string;
  /** A project's CSS colour (`projectColor(p)`): tinted chip with a dot; the name is the children. */
  projectColor?: string;
  icon?: ReactNode;
  /** Makes the chip a button, for example a status chip that offers the other statuses. */
  onClick?: () => void;
  title?: string;
  /** For a chip that opens a Menu. */
  'aria-haspopup'?: 'menu';
  'aria-expanded'?: boolean;
}

export function Chip({
  children,
  tone = 'neutral',
  color,
  projectColor,
  icon,
  onClick,
  title,
  'aria-haspopup': haspopup,
  'aria-expanded': expanded,
}: ChipProps) {
  const className = [styles.chip, projectColor ? styles.project : color ? styles.area : styles[tone], onClick ? styles.clickable : undefined]
    .filter(Boolean)
    .join(' ');
  const style = projectColor ? ({ '--pc': projectColor } as CSSProperties) : color ? ({ '--chip-color': color } as CSSProperties) : undefined;
  const content = (
    <>
      {(color || projectColor) && <span className={styles.dot} aria-hidden="true" />}
      {icon}
      {children}
    </>
  );
  if (onClick) {
    return (
      <button type="button" className={className} style={style} onClick={onClick} title={title} aria-haspopup={haspopup} aria-expanded={expanded}>
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
