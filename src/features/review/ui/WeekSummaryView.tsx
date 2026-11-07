import { CalendarCheck } from 'lucide-react';
import type { CSSProperties } from 'react';
import { navigate } from '../../../core/routing/useRoute.ts';
import { Chip } from '../../../core/ui/components/Chip.tsx';
import { EmptyState } from '../../../core/ui/components/EmptyState.tsx';
import { ListRow } from '../../../core/ui/components/ListRow.tsx';
import { ProgressBar } from '../../../core/ui/components/ProgressBar.tsx';
import { Section } from '../../../core/ui/components/Section.tsx';
import { goalColor } from '../../../core/ui/colors.ts';
import { WeekTimeline } from '../../timeline/ui/WeekTimeline.tsx';
import { formatDuration } from '../../work-log/domain/work-log.ts';
import { measureWeekText } from '../domain/measure-text.ts';
import type { GoalSummary, WeekSummary } from '../domain/week-summary.ts';
import { TimeSection } from './TimeSection.tsx';
import styles from './WeekSummaryView.module.css';

/** "+15", "−3" or "0" in percentage points. */
export function formatChange(change: number): string {
  return change > 0 ? `+${change}` : change < 0 ? `−${Math.abs(change)}` : '0';
}

function Change({ value }: { value: number | null }) {
  if (value === null) return null;
  const tone = value > 0 ? styles.up : value < 0 ? styles.down : styles.flat;
  return (
    <span className={`${styles.change} ${tone}`} title="Change in percentage points this week">
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
      {goal.progress !== null && <ProgressBar value={goal.progress} gain={goal.gain} color={color} label={`Progress of ${goal.title}`} />}
      {goal.work.count > 0 && <span className={styles.muted}>{workText(goal.work)}</span>}
      {goal.measures.length > 0 && (
        <ul className={styles.measures}>
          {goal.measures.map((m) => {
            const { text, delta } = measureWeekText(m);
            return (
              <li key={m.measureId}>
                <span className={styles.measureTitle}>{m.title}</span>
                <ProgressBar value={m.progress} gain={m.gain} color={color} label={m.title} />
                <span className={`${styles.measureValue} ${m.from === null ? '' : styles.measureChanged}`}>
                  {text}
                  {delta && <span className={delta.startsWith('+') ? styles.up : styles.down}> {delta}</span>}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export interface WeekSummaryViewProps {
  summary: WeekSummary;
}

/** A week at a glance: goals, time, finished projects, completed tasks and habit adherence. */
export function WeekSummaryView({ summary }: WeekSummaryViewProps) {
  const { goals, time, trend, finishedProjects, completedTasks, habits } = summary;
  const empty = time.totalMinutes === 0 && [goals, finishedProjects, completedTasks, habits].every((list) => list.length === 0);
  if (empty) return <EmptyState icon={CalendarCheck} text="Nothing recorded this week" />;

  return (
    <div className={styles.summary}>
      {goals.length > 0 && (
        <Section tile title="Goals" count={goals.length}>
          <div className={styles.goals}>
            {goals.map((goal) => (
              <GoalBlock key={goal.goalId} goal={goal} />
            ))}
          </div>
        </Section>
      )}
      <TimeSection time={time} trend={trend} />
      <Section tile title="Days">
        <WeekTimeline weekStart={summary.weekStart} />
      </Section>
      {finishedProjects.length > 0 && (
        <Section tile title="Finished projects" count={finishedProjects.length}>
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
        <Section tile title="Completed tasks" count={completedTasks.length}>
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
        <Section tile title="Habits" count={habits.length}>
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
