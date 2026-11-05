import { Plus, Repeat } from 'lucide-react';
import { useState } from 'react';
import { useLiveQuery } from '../../../core/db/live.ts';
import { Button } from '../../../core/ui/components/Button.tsx';
import { Chip } from '../../../core/ui/components/Chip.tsx';
import { EmptyState } from '../../../core/ui/components/EmptyState.tsx';
import { ListRow } from '../../../core/ui/components/ListRow.tsx';
import { Section } from '../../../core/ui/components/Section.tsx';
import { listHabits, listLinkTitles, type Habit } from '../data/habits-repository.ts';
import { scheduleSummary } from '../domain/habits.ts';
import { HabitSheet } from './HabitSheet.tsx';

export interface HabitsSectionProps {
  /** Only the habits linked to this project or goal (and preselected in "New habit"); all habits without one. */
  projectId?: string;
  goalId?: string;
}

/** Habits as rows (title, links, schedule, reminder; inactive marked); a click opens the sheet. */
export function HabitsSection({ projectId, goalId }: HabitsSectionProps) {
  const scoped = projectId !== undefined || goalId !== undefined;
  const data = useLiveQuery(
    async (db) => {
      const [all, titles] = await Promise.all([listHabits(db), listLinkTitles(db)]);
      const habits = all.filter((h) => !scoped || (projectId !== undefined ? h.projectId === projectId : h.goalId === goalId));
      return { habits, titles };
    },
    [projectId, goalId, scoped],
  );
  const [sheet, setSheet] = useState<{ habit?: Habit } | null>(null);
  const create = () => setSheet({});

  return (
    <Section
      title="Habits"
      count={data?.habits.length}
      actions={
        <Button variant="ghost" icon={<Plus />} onClick={create}>
          New habit
        </Button>
      }
    >
      {data && data.habits.length === 0 && (
        <EmptyState
          icon={Repeat}
          text="No habits"
          action={
            <Button variant="primary" icon={<Plus />} onClick={create}>
              New habit
            </Button>
          }
        />
      )}
      <div>
        {data?.habits.map((habit) => {
          const links = [
            !scoped || projectId === undefined ? (habit.projectId ? data.titles.projects.get(habit.projectId) : undefined) : undefined,
            !scoped || goalId === undefined ? (habit.goalId ? data.titles.goals.get(habit.goalId) : undefined) : undefined,
          ].filter((t): t is string => t !== undefined);
          return (
            <ListRow
              key={habit.id}
              title={habit.title}
              muted={!habit.active}
              onOpen={() => setSheet({ habit })}
              meta={
                <>
                  <span>{scheduleSummary(habit)}</span>
                  {habit.reminderTime && <span>{habit.reminderTime}</span>}
                  {links.map((t) => (
                    <Chip key={t}>{t}</Chip>
                  ))}
                  {!habit.active && <Chip tone="amber">Inactive</Chip>}
                </>
              }
            />
          );
        })}
      </div>
      {sheet && <HabitSheet habit={sheet.habit} projectId={projectId} goalId={goalId} onClose={() => setSheet(null)} />}
    </Section>
  );
}
