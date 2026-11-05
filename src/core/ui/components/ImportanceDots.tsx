import styles from './ImportanceDots.module.css';

export interface ImportanceDotsProps {
  /** 1 to 5. */
  value: number;
  /** Marks an importance taken over from the project, drawn fainter. */
  inherited?: boolean;
}

export function ImportanceDots({ value, inherited = false }: ImportanceDotsProps) {
  const label = `Importance ${value} of 5${inherited ? ', inherited' : ''}`;
  return (
    <span role="img" aria-label={label} title={label} className={`${styles.dots} ${inherited ? styles.inherited : ''}`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={n <= value ? styles.filled : styles.empty} />
      ))}
    </span>
  );
}
