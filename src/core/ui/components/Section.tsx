import { useId, type ReactNode } from 'react';
import styles from './Section.module.css';

export interface SectionProps {
  title: string;
  /** Number of items, shown beside the title. */
  count?: number;
  /** Right of the title: a "New" button or menu. */
  actions?: ReactNode;
  children: ReactNode;
}

/** A titled block of a screen (Goals, Projects, …). */
export function Section({ title, count, actions, children }: SectionProps) {
  const id = useId();
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
