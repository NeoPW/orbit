import { NotFound } from '../../../app/NotFound.tsx';
import { useLiveQuery } from '../../../core/db/live.ts';
import { navigate, useRoute } from '../../../core/routing/useRoute.ts';
import { Chip } from '../../../core/ui/components/Chip.tsx';
import { ListRow } from '../../../core/ui/components/ListRow.tsx';
import { PageHeader } from '../../../core/ui/components/PageHeader.tsx';
import { Section } from '../../../core/ui/components/Section.tsx';
import { getGoal } from '../../goals/data/goals-repository.ts';
import { getProject } from '../../projects/data/projects-repository.ts';
import { listNotesForWeek } from '../../notes/data/notes-repository.ts';
import { getReviewById } from '../data/reviews-repository.ts';
import { formatWeekRange } from '../domain/review-week.ts';
import styles from './ReviewScreen.module.css';
import { useWeekSummary } from './useWeekSummary.ts';
import { WeekSummaryView } from './WeekSummaryView.tsx';

function Text({ title, text }: { title: string; text: string }) {
  return (
    <Section tile title={title}>
      <p className={styles.plan}>{text}</p>
    </Section>
  );
}

function WeekSummaryOf({ weekStart }: { weekStart: string }) {
  const summary = useWeekSummary(weekStart);
  return summary ? <WeekSummaryView summary={summary} /> : null;
}

/** A completed review in full, followed by that week's summary and notes. */
export function ReviewHistoryPage() {
  const route = useRoute();
  const id = route.name === 'review-history' ? route.id : '';
  const loaded = useLiveQuery(
    async (db) => {
      const review = await getReviewById(db, id);
      if (!review) return null;
      const notes = await listNotesForWeek(db, review.weekStart);
      const items = await Promise.all(
        notes.map(async (note) => {
          const title = note.targetType === 'goal' ? (await getGoal(db, note.targetId))?.goal.title : (await getProject(db, note.targetId))?.project.title;
          return title === undefined ? null : { note, title };
        }),
      );
      return { review, notes: items.flatMap((item) => (item ? [item] : [])) };
    },
    [id],
  );

  if (loaded === undefined) return null;
  if (loaded === null) return <NotFound text="Review not found" destination={{ name: 'review' }} label="Go to Review" />;

  const { review, notes } = loaded;
  return (
    <div className={styles.page}>
      <PageHeader title={`Week ${formatWeekRange(review.weekStart)}`} meta={review.score !== null && <Chip tone="primary">{`Score ${review.score}`}</Chip>} />
      <div className={styles.sections}>
        {review.reflection.trim() && <Text title="Reflection" text={review.reflection.trim()} />}
        {review.planNextWeek.trim() && <Text title="Plan for the next week" text={review.planNextWeek.trim()} />}
        {notes.length > 0 && (
          <Section tile title="Notes" count={notes.length}>
            {notes.map(({ note, title }) => (
              <ListRow
                key={note.id}
                title={title}
                onOpen={() => navigate({ name: note.targetType, id: note.targetId })}
                meta={<span className={styles.noteText}>{note.note}</span>}
              />
            ))}
          </Section>
        )}
        <WeekSummaryOf weekStart={review.weekStart} />
      </div>
    </div>
  );
}
