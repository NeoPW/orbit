import { useId, type ReactNode } from 'react';
import styles from './Section.module.css';
import { Tile } from './Tile.tsx';

export interface SectionProps {
  title: string;
  /** Number of items, shown beside the title. */
  count?: number;
  /** Right of the title: a "New" button or menu. */
  actions?: ReactNode;
  /** Renders the section as a `Tile` (page sections). */
  tile?: boolean;
  /** A CSS colour for the tile's rail (a project's or goal's colour). */
  color?: string;
  children: ReactNode;
}

/** A titled block of a screen (Goals, Projects, …). */
export function Section({ title, count, actions, tile = false, color, children }: SectionProps) {
  const id = useId();
  if (tile) {
    return (
      <Tile
        aria-label={title}
        color={color}
        title={
          <span className={styles.tileTitle}>
            <h2 className={styles.tileHeading}>{title}</h2>
            {count !== undefined && <span className={styles.count}>{count}</span>}
          </span>
        }
        actions={actions}
      >
        {children}
      </Tile>
    );
  }
  return (
    <section className={styles.section} aria-labelledby={id}>
      <header className={styles.header}>
        <h2 id={id}>{title}</h2>
        {count !== undefined && <span className={styles.count}>{count}</span>}
        {actions && <div className={styles.actions}>{actions}</div>}
      </header>
      {children}
    </section>
  );
}
