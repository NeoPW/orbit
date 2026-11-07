import { CalendarClock, ChevronLeft, ChevronRight, History, NotebookPen } from 'lucide-react';
import { addDays, useToday } from '../../../core/dates/today.ts';
import { useLiveQuery } from '../../../core/db/live.ts';
import { navigate, useRoute } from '../../../core/routing/useRoute.ts';
import { Button, IconButton } from '../../../core/ui/components/Button.tsx';
import { EmptyState } from '../../../core/ui/components/EmptyState.tsx';
import { ListRow } from '../../../core/ui/components/ListRow.tsx';
import { PageHeader } from '../../../core/ui/components/PageHeader.tsx';
import { Section } from '../../../core/ui/components/Section.tsx';
import { getPlanForWeek, getReview, listCompletedReviews } from '../data/reviews-repository.ts';
import { currentWeekStart, formatWeek, formatWeekFull, resolveWeek, reviewWeekStart } from '../domain/review-week.ts';
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
  const route = useRoute();
  const shown = resolveWeek(route.name === 'review' ? route.week : undefined, today);
  const isCurrent = shown === thisWeek;
  const data = useLiveQuery(
    async (db) => ({
      current: await getReview(db, reviewWeek),
      plan: await getPlanForWeek(db, shown),
      history: await listCompletedReviews(db),
    }),
    [reviewWeek, shown],
  );
  const summary = useWeekSummary(shown);

  if (!data) return null;
  const { current, plan, history } = data;
  const buttonLabel = !current ? 'Start weekly review' : current.completedAt ? 'Edit weekly review' : 'Continue weekly review';

  return (
    <div className={styles.page}>
      <PageHeader
        title="Review"
        meta={<span>{formatWeekFull(shown)}</span>}
        actions={
          <div className={styles.switcher}>
            {!isCurrent && <Button onClick={() => navigate({ name: 'review' })}>This week</Button>}
            <IconButton
              label="Previous week"
              icon={<ChevronLeft />}
              onClick={() => navigate({ name: 'review', week: addDays(shown, -7) })}
            />
            <IconButton
              label="Next week"
              icon={<ChevronRight />}
              disabled={isCurrent}
              onClick={() => navigate({ name: 'review', week: addDays(shown, 7) === thisWeek ? undefined : addDays(shown, 7) })}
            />
          </div>
        }
      />
      <div className={styles.sections}>
        <Section tile title={`Plan for ${formatWeek(shown)}`}>
          {plan ? (
            <p className={styles.plan}>{plan}</p>
          ) : (
            <EmptyState icon={NotebookPen} text="No plan yet, it comes from the weekly review before" />
          )}
        </Section>
        <Section title={isCurrent ? 'This week so far' : 'Week summary'}>{summary && <WeekSummaryView summary={summary} />}</Section>
        <div className={styles.action}>
          <Button variant="primary" icon={<CalendarClock />} onClick={() => navigate({ name: 'review-flow' })}>
            {buttonLabel}
          </Button>
          <span className={styles.muted}>{formatWeekFull(reviewWeek)}</span>
        </div>
        <Section tile title="History" count={history.length}>
          {history.length === 0 ? (
            <EmptyState icon={History} text="No completed reviews yet" />
          ) : (
            history.map((review) => (
              <ListRow
                key={review.id}
                title={formatWeekFull(review.weekStart)}
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
      </div>
    </div>
  );
}
