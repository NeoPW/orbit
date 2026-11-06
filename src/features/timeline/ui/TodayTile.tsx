import { NotebookPen } from 'lucide-react';
import { useNow, useToday, addDays } from '../../../core/dates/today.ts';
import { useLiveQuery } from '../../../core/db/live.ts';
import { Button } from '../../../core/ui/components/Button.tsx';
import { Tile } from '../../../core/ui/components/Tile.tsx';
import { loadTimeline } from '../data/timeline-loader.ts';
import { localRange } from '../domain/day-timeline.ts';
import { DayTimeline } from './DayTimeline.tsx';
import styles from './TodayTile.module.css';

/** Home's "Today" tile: the work logged today, live. */
export function TodayTile({ onLogWork }: { onLogWork: () => void }) {
  const today = useToday();
  const now = useNow(60000);
  const items = useLiveQuery(
    (db) => {
      const { from, to } = localRange(today, addDays(today, 1));
      return loadTimeline(db, from, to);
    },
    [today],
  );
  return (
    <Tile title={<h2 className={styles.title}>Today</h2>}>
      <DayTimeline
        days={[{ date: today, items: items ?? [] }]}
        now={now}
        today={today}
        hourHeight={48}
        label="Work today"
        maxHeight={420}
        emptyText="Nothing logged yet"
        emptyAction={
          <Button icon={<NotebookPen />} onClick={onLogWork}>
            Log work
          </Button>
        }
      />
    </Tile>
  );
}
