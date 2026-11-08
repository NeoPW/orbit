import { CalendarClock, ChevronLeft, ChevronRight, History, NotebookPen } from 'lucide-react';
import { useState } from 'react';
import { addDays, useToday } from '../../../core/dates/today.ts';
import { useLiveQuery } from '../../../core/db/live.ts';
import { navigate, useRoute } from '../../../core/routing/useRoute.ts';
import { Button, IconButton } from '../../../core/ui/components/Button.tsx';
import { EmptyState } from '../../../core/ui/components/EmptyState.tsx';
import { ListRow } from '../../../core/ui/components/ListRow.tsx';
import { PageHeader } from '../../../core/ui/components/PageHeader.tsx';
import { Section } from '../../../core/ui/components/Section.tsx';
import { getPlanForWeek, getReview, listCompletedReviews, type WeeklyReview } from '../data/reviews-repository.ts';
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

  const planPanel = (
    <Section tile title={`Plan for ${formatWeek(shown)}`}>
      {plan ? (
        <p className={styles.plan}>{plan}</p>
      ) : (
        <EmptyState icon={NotebookPen} text="No plan yet, it comes from the weekly review before" />
      )}
    </Section>
  );

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
            <Button
              variant="primary"
              icon={<CalendarClock />}
              title={`Review of ${formatWeekFull(reviewWeek)}`}
              onClick={() => navigate({ name: 'review-flow' })}
            >
              {buttonLabel}
            </Button>
          </div>
        }
      />
      {summary && <WeekSummaryView summary={summary} plan={planPanel} history={<HistoryPanel history={history} />} />}
    </div>
  );
}

const HISTORY_SHOWN = 5;

/** The latest completed reviews with week and score; "Show all" lists every one. */
function HistoryPanel({ history }: { history: WeeklyReview[] }) {
  const [all, setAll] = useState(false);
  const shown = all ? history : history.slice(0, HISTORY_SHOWN);
  return (
    <Section
      tile
      title="History"
      count={history.length || undefined}
      actions={
        history.length > HISTORY_SHOWN ? (
          <Button variant="ghost" onClick={() => setAll(!all)}>
            {all ? 'Show fewer' : 'Show all'}
          </Button>
        ) : undefined
      }
    >
      {history.length === 0 ? (
        <EmptyState icon={History} text="No completed reviews yet" />
      ) : (
        shown.map((review) => (
          <ListRow
            key={review.id}
            title={formatWeekFull(review.weekStart)}
            onOpen={() => navigate({ name: 'review-history', id: review.id })}
            trailing={
              <span className={styles.score} aria-label={`Score ${review.score}`}>
                {review.score}
              </span>
            }
          />
        ))
      )}
    </Section>
  );
}
