import { addDays } from '../../../core/dates/today.ts';
import styles from './DayCalendar.module.css';

export type CellTone = 'blank' | 'none' | 's1' | 's2' | 's3' | 's4' | 'checked' | 'missed';

export interface CellInfo {
  tone: CellTone;
  /** Tooltip. */
  title?: string;
  /** Outside the emphasised range. */
  dim?: boolean;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Days as a grid: one column per week from Monday to Sunday, the months labelled above. `start` is a Monday, `end` a Sunday. */
export function DayCalendar({ start, end, label, cell }: { start: string; end: string; label: string; cell: (date: string) => CellInfo }) {
  const weeks: string[] = [];
  for (let monday = start; monday <= end; monday = addDays(monday, 7)) weeks.push(monday);
  let lastMonth = -1;
  return (
    <div className={styles.wrap}>
      <div className={styles.grid} role="img" aria-label={label} style={{ gridTemplateColumns: `repeat(${weeks.length}, var(--cell))` }}>
        {weeks.map((monday, column) => {
          const month = Number(addDays(monday, 6).slice(5, 7)) - 1;
          const showMonth = month !== lastMonth;
          lastMonth = month;
          return (
            <div key={monday} className={styles.column} style={{ gridColumn: column + 1 }}>
              <span className={styles.month}>{showMonth ? MONTHS[month] : ''}</span>
              {Array.from({ length: 7 }, (_, day) => {
                const date = addDays(monday, day);
                const info = cell(date);
                return (
                  <span key={date} className={`${styles.cell} ${styles[info.tone]} ${info.dim ? styles.dim : ''}`} title={info.title} />
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
