import { NotebookPen } from 'lucide-react';
import { useLiveQuery } from '../../../core/db/live.ts';
import type { NoteTargetType } from '../../../core/db/schema.ts';
import { EmptyState } from '../../../core/ui/components/EmptyState.tsx';
import { Section } from '../../../core/ui/components/Section.tsx';
import { formatWeekRange } from '../../review/domain/review-week.ts';
import { listNotesForTarget } from '../data/notes-repository.ts';
import styles from './NotesSection.module.css';

/** The weekly notes of a project or goal, newest week first (they are written in the weekly review). */
export function NotesSection({ targetType, targetId, color }: { targetType: NoteTargetType; targetId: string; color?: string }) {
  const notes = useLiveQuery((db) => listNotesForTarget(db, targetType, targetId), [targetType, targetId]);

  return (
    <Section title="Weekly notes" tile color={color} count={notes?.length}>
      {notes && notes.length === 0 && <EmptyState icon={NotebookPen} text="No weekly notes yet" />}
      {notes?.map((note) => (
        <article key={note.id} className={styles.note}>
          <h3>{formatWeekRange(note.weekStart)}</h3>
          <p>{note.note}</p>
        </article>
      ))}
    </Section>
  );
}
