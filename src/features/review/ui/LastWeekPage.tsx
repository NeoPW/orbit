import { lastWeekStart, formatWeekRange } from '../domain/review-week.ts';
import { useToday } from '../../../core/dates/today.ts';
import { PageHeader } from '../../../core/ui/components/PageHeader.tsx';
import styles from './ReviewScreen.module.css';
import { useWeekSummary } from './useWeekSummary.ts';
import { WeekSummaryView } from './WeekSummaryView.tsx';

/** The summary of the Monday–Sunday week before the current one. */
export function LastWeekPage() {
  const weekStart = lastWeekStart(useToday());
  const summary = useWeekSummary(weekStart);
  return (
    <div className={styles.page}>
      <PageHeader title={`Week ${formatWeekRange(weekStart)}`} />
      {summary && <WeekSummaryView summary={summary} />}
    </div>
  );
}
