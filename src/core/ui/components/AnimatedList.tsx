import { useEffect, useRef, useState, type ReactNode } from 'react';
import styles from './AnimatedList.module.css';

/** Time an exiting row is kept; the same as `--motion-normal`. */
const EXIT_MS = 200;

export interface AnimatedListProps<T> {
  items: T[];
  getKey: (item: T) => string;
  renderItem: (item: T) => ReactNode;
  /** Accessible name of the list. */
  label?: string;
}

interface Leaving<T> {
  key: string;
  item: T;
  /** Position it had in the previous list. */
  index: number;
}

function reducedMotion(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * A list whose rows fade in when added and fade and collapse out when
 * removed, within 200 ms. A removed row stays until its exit ends. Rows
 * present at the first render do not animate; with reduced motion nothing does.
 */
export function AnimatedList<T>({ items, getKey, renderItem, label }: AnimatedListProps<T>) {
  const [initialKeys] = useState(() => new Set(items.map(getKey)));
  const [previous, setPrevious] = useState(items);
  const [leaving, setLeaving] = useState<Leaving<T>[]>([]);
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  // Items that disappeared since the last render start leaving (derived during render, so there is no flash).
  if (items !== previous) {
    const keys = new Set(items.map(getKey));
    const gone = reducedMotion()
      ? []
      : previous
          .map((item, index) => ({ key: getKey(item), item, index }))
          .filter((entry) => !keys.has(entry.key) && !leaving.some((l) => l.key === entry.key));
    setPrevious(items);
    setLeaving([...leaving.filter((l) => !keys.has(l.key)), ...gone]);
  }

  useEffect(() => {
    for (const [key, timer] of timers.current) {
      if (!leaving.some((l) => l.key === key)) {
        clearTimeout(timer);
        timers.current.delete(key);
      }
    }
    for (const { key } of leaving) {
      if (timers.current.has(key)) continue;
      timers.current.set(
        key,
        setTimeout(() => {
          timers.current.delete(key);
          setLeaving((list) => list.filter((l) => l.key !== key));
        }, EXIT_MS),
      );
    }
  }, [leaving]);

  useEffect(() => {
    const active = timers.current;
    return () => {
      for (const timer of active.values()) clearTimeout(timer);
      active.clear();
    };
  }, []);

  const rows = items.map((item) => ({ key: getKey(item), item, exiting: false }));
  for (const l of [...leaving].sort((a, b) => a.index - b.index)) {
    rows.splice(Math.min(l.index, rows.length), 0, { key: l.key, item: l.item, exiting: true });
  }

  return (
    <ul className={styles.list} aria-label={label}>
      {rows.map(({ key, item, exiting }) => (
        <li key={key} className={exiting ? styles.exit : initialKeys.has(key) ? styles.item : `${styles.item} ${styles.enter}`}>
          <div className={styles.inner}>{renderItem(item)}</div>
        </li>
      ))}
    </ul>
  );
}
