import type { CSSProperties, ReactNode } from 'react';
import styles from './Tile.module.css';

export interface TileProps {
  /** Renders a `section` (default) or an `article`. */
  as?: 'section' | 'article';
  /** A CSS colour (e.g. `projectColor(p)`): draws a 4 px left rail and sets `--pc` for the content. */
  color?: string;
  /** Tints the header row with `color` (needs `title` or `actions`). */
  tinted?: boolean;
  /** Header row, left. */
  title?: ReactNode;
  /** Header row, right: buttons, chips. */
  actions?: ReactNode;
  /** Accessible name when there is no visible `title`. */
  'aria-label'?: string;
  children?: ReactNode;
}

/** A card: 16 px radius, 1 px border, surface background; optional colour rail and header row. */
export function Tile({ as: Tag = 'section', color, tinted = false, title, actions, children, 'aria-label': ariaLabel }: TileProps) {
  const hasHeader = title !== undefined || actions !== undefined;
  const className = [styles.tile, color ? styles.rail : undefined].filter(Boolean).join(' ');
  return (
    <Tag className={className} style={color ? ({ '--pc': color } as CSSProperties) : undefined} aria-label={ariaLabel}>
      {hasHeader && (
        <header className={`${styles.header} ${tinted && color ? styles.tinted : ''}`}>
          {title !== undefined && <div className={styles.title}>{title}</div>}
          {actions !== undefined && <div className={styles.actions}>{actions}</div>}
        </header>
      )}
      <div className={styles.body}>{children}</div>
    </Tag>
  );
}
