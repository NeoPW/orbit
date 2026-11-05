import { CalendarCheck } from 'lucide-react';
import type { CSSProperties } from 'react';
import { navigate } from '../../../core/routing/useRoute.ts';
import { Chip } from '../../../core/ui/components/Chip.tsx';
import { EmptyState } from '../../../core/ui/components/EmptyState.tsx';
import { ListRow } from '../../../core/ui/components/ListRow.tsx';
import { ProgressBar } from '../../../core/ui/components/ProgressBar.tsx';
import { Section } from '../../../core/ui/components/Section.tsx';
import { goalColor } from '../../../core/ui/palette.ts';
import { formatDuration } from '../../work-log/domain/work-log.ts';
import type { GoalSummary, WeekSummary } from '../domain/week-summary.ts';
import styles from './WeekSummaryView.module.css';

/** "+15", "−3" or "0" in percentage points. */
export function formatChange(change: number): string {
  return change > 0 ? `+${change}` : change < 0 ? `−${Math.abs(change)}` : '0';
}

function Change({ value }: { value: number | null }) {
  if (value === null) return null;
  const tone = value > 0 ? styles.up : value < 0 ? styles.down : styles.flat;
  return (
    <span className={`${styles.change} ${tone}`} title="Change in percentage points since the previous review">
      {formatChange(value)}
    </span>
  );
}

const workText = (work: { count: number; minutes: number }) =>
  `${work.count} ${work.count === 1 ? 'entry' : 'entries'}${work.minutes > 0 ? `, ${formatDuration(work.minutes)}` : ''}`;

function GoalBlock({ goal }: { goal: GoalSummary }) {
  const color = goalColor(goal, goal.index);
  return (
    <div className={styles.goal} style={{ '--goal-color': color } as CSSProperties}>
      <div className={styles.goalHead}>
        <button type="button" className={styles.link} onClick={() => navigate({ name: 'goal', id: goal.goalId })}>
          {goal.title}
        </button>
        <Change value={goal.change} />
      </div>
      {goal.progress !== null && <ProgressBar value={goal.progress} color={color} label={`Progress of ${goal.title}`} />}
      {goal.work.count > 0 && <span className={styles.muted}>{workText(goal.work)}</span>}
      {goal.measures.length > 0 && (
        <ul className={styles.measures}>
          {goal.measures.map((m) => (
            <li key={m.measureId}>
              <span className={styles.measureTitle}>{m.title}</span>
              <ProgressBar value={m.progress} color={color} label={m.title} />
              <Change value={m.change} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export interface WeekSummaryViewProps {
  summary: WeekSummary;
}

/** A week at a glance: goals, work per goal, finished projects, completed tasks and habit adherence. */
export function WeekSummaryView({ summary }: WeekSummaryViewProps) {
  const { goals, work, finishedProjects, completedTasks, habits } = summary;
  const empty = [goals, work, finishedProjects, completedTasks, habits].every((list) => list.length === 0);
  if (empty) return <EmptyState icon={CalendarCheck} text="Nothing recorded this week" />;

  return (
    <div className={styles.summary}>
      {goals.length > 0 && (
        <Section title="Goals" count={goals.length}>
          <div className={styles.goals}>
            {goals.map((goal) => (
              <GoalBlock key={goal.goalId} goal={goal} />
            ))}
          </div>
        </Section>
      )}
      {work.length > 0 && (
        <Section title="Work">
          {work.map((group) => (
            <div key={group.goalId ?? 'none'} className={styles.group}>
              {group.goalTitle !== null && <h3 className={styles.groupTitle}>{group.goalTitle}</h3>}
              {group.goalTitle === null && work.length > 1 && <h3 className={styles.groupTitle}>Without a goal</h3>}
              {group.projects.map((p) => (
                <ListRow
                  key={p.projectId ?? 'none'}
                  title={p.title}
                  onOpen={p.projectId ? () => navigate({ name: 'project', id: p.projectId! }) : undefined}
                  trailing={<span className={styles.muted}>{workText(p)}</span>}
                />
              ))}
            </div>
          ))}
        </Section>
      )}
      {finishedProjects.length > 0 && (
        <Section title="Finished projects" count={finishedProjects.length}>
          {finishedProjects.map((p) => (
            <ListRow
              key={p.projectId}
              title={p.title}
              onOpen={() => navigate({ name: 'project', id: p.projectId })}
              meta={p.goalTitle ? <span>{p.goalTitle}</span> : undefined}
            />
          ))}
        </Section>
      )}
      {completedTasks.length > 0 && (
        <Section title="Completed tasks" count={completedTasks.length}>
          {completedTasks.map((t) => (
            <ListRow
              key={t.taskId}
              title={t.title}
              onOpen={() => navigate({ name: 'task', id: t.taskId })}
              meta={t.assignedTo ? <span>{t.assignedTo.title}</span> : undefined}
            />
          ))}
        </Section>
      )}
      {habits.length > 0 && (
        <Section title="Habits" count={habits.length}>
          {habits.map((h) => (
            <ListRow
              key={h.habitId}
              title={h.title}
              trailing={<Chip tone={h.expected > 0 && h.done >= h.expected ? 'secondary' : 'neutral'}>{`${h.done} of ${h.expected}`}</Chip>}
            />
          ))}
        </Section>
      )}
    </div>
  );
}
