import { CalendarClock, ChevronRight, History, NotebookPen } from 'lucide-react';
import { useToday } from '../../../core/dates/today.ts';
import { useLiveQuery } from '../../../core/db/live.ts';
import { navigate } from '../../../core/routing/useRoute.ts';
import { Button } from '../../../core/ui/components/Button.tsx';
import { EmptyState } from '../../../core/ui/components/EmptyState.tsx';
import { ListRow } from '../../../core/ui/components/ListRow.tsx';
import { PageHeader } from '../../../core/ui/components/PageHeader.tsx';
import { Section } from '../../../core/ui/components/Section.tsx';
import { getLatestCompletedReview, getReview, listCompletedReviews } from '../data/reviews-repository.ts';
import { currentWeekStart, formatWeekRange, reviewWeekStart } from '../domain/review-week.ts';
import styles from './ReviewScreen.module.css';
import { useWeekSummary } from './useWeekSummary.ts';
import { WeekSummaryView } from './WeekSummaryView.tsx';

/** The first line of a plan, for lists. */
export function planPreview(plan: string): string {
  return plan.trim().split('\n')[0] ?? '';
}

export function ReviewScreen() {
  const today = useToday();
  const reviewWeek = reviewWeekStart(today);
  const thisWeek = currentWeekStart(today);
  const data = useLiveQuery(
    async (db) => ({
      current: await getReview(db, reviewWeek),
      latest: await getLatestCompletedReview(db),
      history: await listCompletedReviews(db),
    }),
    [reviewWeek],
  );
  const summary = useWeekSummary(thisWeek);

  if (!data) return null;
  const { current, latest, history } = data;
  const buttonLabel = !current ? 'Start weekly review' : current.completedAt ? 'Edit weekly review' : 'Continue weekly review';
  const plan = latest?.planNextWeek.trim();

  return (
    <div className={styles.page}>
      <PageHeader title="Review" meta={<span>Week {formatWeekRange(thisWeek)}</span>} />
      <div className={styles.sections}>
        <Section tile title="Plan for this week">
          {plan ? <p className={styles.plan}>{plan}</p> : <EmptyState icon={NotebookPen} text="No plan yet, it comes from your weekly review" />}
        </Section>
        <Section title="This week so far">{summary && <WeekSummaryView summary={summary} />}</Section>
        <div className={styles.action}>
          <Button variant="primary" icon={<CalendarClock />} onClick={() => navigate({ name: 'review-flow' })}>
            {buttonLabel}
          </Button>
          <span className={styles.muted}>Week {formatWeekRange(reviewWeek)}</span>
        </div>
        <Section tile title="History" count={history.length}>
          {history.length === 0 ? (
            <EmptyState icon={History} text="No completed reviews yet" />
          ) : (
            history.map((review) => (
              <ListRow
                key={review.id}
                title={formatWeekRange(review.weekStart)}
                onOpen={() => navigate({ name: 'review-history', id: review.id })}
                meta={review.planNextWeek.trim() ? <span className={styles.preview}>{planPreview(review.planNextWeek)}</span> : undefined}
                trailing={
                  <>
                    <span className={styles.score} aria-label={`Score ${review.score}`}>
                      {review.score}
                    </span>
                    <ChevronRight aria-hidden="true" />
                  </>
                }
              />
            ))
          )}
        </Section>
        <div>
          <Button icon={<CalendarClock />} onClick={() => navigate({ name: 'review-last-week' })}>
            Last week
          </Button>
        </div>
      </div>
    </div>
  );
}
