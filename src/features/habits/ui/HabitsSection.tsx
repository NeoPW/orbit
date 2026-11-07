import { Plus, Repeat } from 'lucide-react';
import { useState } from 'react';
import { useLiveQuery } from '../../../core/db/live.ts';
import { Button } from '../../../core/ui/components/Button.tsx';
import { Chip } from '../../../core/ui/components/Chip.tsx';
import { EmptyState } from '../../../core/ui/components/EmptyState.tsx';
import { ListRow } from '../../../core/ui/components/ListRow.tsx';
import { Section } from '../../../core/ui/components/Section.tsx';
import { Tile } from '../../../core/ui/components/Tile.tsx';
import { listHabits, listLinkColors, listLinkTitles, type Habit } from '../data/habits-repository.ts';
import { scheduleSummary } from '../domain/habits.ts';
import { habitTotals } from '../../work-log/data/log-repository.ts';
import { formatTotal } from '../../work-log/domain/work-log.ts';
import { HabitSheet } from './HabitSheet.tsx';
import styles from './HabitsSection.module.css';

export interface HabitsSectionProps {
  /** Only the habits linked to this project or goal (and preselected in "New habit"); all habits without one. */
  projectId?: string;
  goalId?: string;
  /** Renders as a tile with this colour as rail (project and goal pages). */
  tileColor?: string;
}

function link(id: string | null, titles: Map<string, string>, colors: Map<string, string>) {
  const title = id ? titles.get(id) : undefined;
  return title === undefined || !id ? undefined : { title, color: colors.get(id) };
}

/** Habits as rows (title, links, schedule, reminder; inactive marked; time worked at the right); a click opens the sheet. */
export function HabitsSection({ projectId, goalId, tileColor }: HabitsSectionProps) {
  const scoped = projectId !== undefined || goalId !== undefined;
  const data = useLiveQuery(
    async (db) => {
      const [all, titles, colors, totals] = await Promise.all([listHabits(db), listLinkTitles(db), listLinkColors(db), habitTotals(db)]);
      const habits = all.filter((h) => !scoped || (projectId !== undefined ? h.projectId === projectId : h.goalId === goalId));
      return { habits, titles, colors, totals };
    },
    [projectId, goalId, scoped],
  );
  const [sheet, setSheet] = useState<{ habit?: Habit } | null>(null);
  const create = () => setSheet({});

  return (
    <Section
      title="Habits"
      tile={tileColor !== undefined}
      color={tileColor}
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
      {data && data.habits.length > 0 && (
        <Tile>
          <div className={styles.list}>
            {data.habits.map((habit) => {
              const links = [
                !scoped || projectId === undefined ? link(habit.projectId, data.titles.projects, data.colors.projects) : undefined,
                !scoped || goalId === undefined ? link(habit.goalId, data.titles.goals, data.colors.goals) : undefined,
              ].filter((l): l is { title: string; color: string | undefined } => l !== undefined);
              return (
                <ListRow
                  key={habit.id}
                  title={habit.title}
                  muted={!habit.active}
                  onOpen={() => setSheet({ habit })}
                  trailing={
                    <span className={styles.total} aria-label="Time worked">
                      {formatTotal(data.totals.get(habit.id) ?? 0)}
                    </span>
                  }
                  meta={
                    <>
                      <span>{scheduleSummary(habit)}</span>
                      {habit.reminderTime && <span>{habit.reminderTime}</span>}
                      {links.map((l) => (
                        <Chip key={l.title} projectColor={l.color}>
                          {l.title}
                        </Chip>
                      ))}
                      {!habit.active && <Chip tone="amber">Inactive</Chip>}
                    </>
                  }
                />
              );
            })}
          </div>
        </Tile>
      )}
      {sheet && <HabitSheet habit={sheet.habit} projectId={projectId} goalId={goalId} onClose={() => setSheet(null)} />}
    </Section>
  );
}
