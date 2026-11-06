import { Clock } from 'lucide-react';
import { useToday } from '../../../core/dates/today.ts';
import { useLiveQuery } from '../../../core/db/live.ts';
import { EmptyState } from '../../../core/ui/components/EmptyState.tsx';
import { Section } from '../../../core/ui/components/Section.tsx';
import { currentWeekStart, weekRange } from '../../review/domain/review-week.ts';
import { listWorkOnGoal } from '../data/log-repository.ts';
import { formatDuration, type WorkTotals } from '../domain/work-log.ts';
import { LogEntryList } from './LogEntryList.tsx';
import styles from './LogEntryList.module.css';

const RECENT = 10;

function totalsText({ count, minutes }: WorkTotals): string {
  const entries = count === 1 ? '1 entry' : `${count} entries`;
  return minutes > 0 ? `${entries}, ${formatDuration(minutes)}` : entries;
}

/** Work on a goal (its own entries and those of its projects and tasks): this week, the total and the recent entries. */
export function GoalWorkSection({ goalId, color }: { goalId: string; color?: string }) {
  const today = useToday();
  const week = weekRange(currentWeekStart(today));
  const work = useLiveQuery((db) => listWorkOnGoal(db, goalId, week), [goalId, week.from, week.to]);

  return (
    <Section title="Work" tile color={color} count={work?.total.count}>
      {work && work.total.count === 0 && <EmptyState icon={Clock} text="No work on this goal yet" />}
      {work && work.total.count > 0 && (
        <>
          <dl className={styles.totals}>
            <dt>This week</dt>
            <dd>{totalsText(work.week)}</dd>
            <dt>Total</dt>
            <dd>{totalsText(work.total)}</dd>
          </dl>
          <LogEntryList entries={work.entries.slice(0, RECENT)} label="Recent work" />
        </>
      )}
    </Section>
  );
}
