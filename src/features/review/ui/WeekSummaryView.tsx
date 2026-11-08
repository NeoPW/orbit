import { CalendarCheck, CircleCheck, Target } from 'lucide-react';
import type { CSSProperties, ReactNode } from 'react';
import { navigate } from '../../../core/routing/useRoute.ts';
import { EmptyState } from '../../../core/ui/components/EmptyState.tsx';
import { ListRow } from '../../../core/ui/components/ListRow.tsx';
import { ProgressBar } from '../../../core/ui/components/ProgressBar.tsx';
import { Section } from '../../../core/ui/components/Section.tsx';
import { goalColor } from '../../../core/ui/colors.ts';
import { useOpenTask } from '../../tasks/ui/TaskPopup.tsx';
import { formatDuration } from '../../work-log/domain/work-log.ts';
import { measureWeekText } from '../domain/measure-text.ts';
import { habitsFigure, type GoalSummary, type WeekSummary } from '../domain/week-summary.ts';
import { DaysPanel } from './DaysPanel.tsx';
import { TimeByPanel, TrendPanel } from './TimeSection.tsx';
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
        {goal.work.count > 0 && <span className={styles.muted}>{workText(goal.work)}</span>}
        <Change value={goal.change} />
      </div>
      {goal.progress !== null && <ProgressBar value={goal.progress} gain={goal.gain} color={color} label={`Progress of ${goal.title}`} />}
      {goal.measures.some((m) => m.from !== null) && (
        <ul className={styles.measures}>
          {goal.measures
            .filter((m) => m.from !== null)
            .map((m) => {
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
  /** The plan panel's content (the Review tab); without it, goals take the whole row. */
  plan?: ReactNode;
  /** The history panel's content (the Review tab); without it, "Done this week" takes the whole row. */
  history?: ReactNode;
}

const time = (minutes: number) => (minutes > 0 ? formatDuration(minutes) : '0 min');
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

function Figure({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className={styles.figure}>
      <span className={styles.figureLabel}>{label}</span>
      <strong className={styles.figureValue}>{value}</strong>
      {note && <span className={styles.figureNote}>{note}</span>}
    </div>
  );
}

/** The five figures of the week (see week-summary, "Summary figures"). */
function Figures({ summary }: { summary: WeekSummary }) {
  const { time: t } = summary;
  const habits = habitsFigure(summary.habits);
  const done = summary.completedTasks.length;
  const finished = summary.finishedProjects.length;
  return (
    <div className={styles.figures}>
      <Figure
        label="Time worked"
        value={time(t.totalMinutes)}
        note={t.targetMinutes === null ? undefined : `of ${time(t.targetMinutes)} · ${t.targetShare} %`}
      />
      <Figure label="Daily average" value={time(t.dailyAverageMinutes)} />
      <Figure
        label="On goals"
        value={t.goalShare === null ? '–' : `${t.goalShare} %`}
        note={t.goalShare === null ? undefined : time(t.goalMinutes)}
      />
      <Figure
        label="Habits"
        value={habits.share === null ? '–' : `${habits.kept} / ${habits.expected}`}
        note={habits.share === null ? undefined : `${habits.share} % kept`}
      />
      <Figure label="Done" value={plural(done, 'task')} note={finished > 0 ? `${plural(finished, 'project')} finished` : undefined} />
    </div>
  );
}

/** A week as a dashboard: figures, then panels in a 12-column grid from 1100 px, stacked below (see "Dashboard layout"). */
export function WeekSummaryView({ summary, plan, history }: WeekSummaryViewProps) {
  const openTask = useOpenTask();
  const { goals, finishedProjects, completedTasks, habits } = summary;
  const done = [
    ...completedTasks.map((t) => ({
      key: `t-${t.taskId}`,
      at: t.completedAt,
      title: t.title,
      meta: t.assignedTo?.title ?? null,
      open: () => openTask(t.taskId),
    })),
    ...finishedProjects.map((p) => ({
      key: `p-${p.projectId}`,
      at: p.completedAt,
      title: p.title,
      meta: 'Project finished',
      open: () => navigate({ name: 'project', id: p.projectId }),
    })),
  ].sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0));

  return (
    <div className={styles.dashboard}>
      <Figures summary={summary} />
      <div className={styles.grid}>
        <div className={plan === undefined ? styles.full : styles.span7}>
          <Section tile title="Goals" count={goals.length || undefined}>
            {goals.length === 0 ? (
              <EmptyState icon={Target} text="No active goals" />
            ) : (
              <div className={styles.goals}>
                {goals.map((goal) => (
                  <GoalBlock key={goal.goalId} goal={goal} />
                ))}
              </div>
            )}
          </Section>
        </div>
        {plan !== undefined && <div className={styles.span5}>{plan}</div>}
        <div className={styles.span5}>
          <TimeByPanel time={summary.time} />
        </div>
        <div className={styles.span7}>
          <TrendPanel trend={summary.trend} />
        </div>
        <div className={styles.full}>
          <DaysPanel weekStart={summary.weekStart} dayMinutes={summary.time.dayMinutes} />
        </div>
        <div className={history === undefined ? styles.half : styles.third}>
          <Section tile title="Habits" count={habits.length || undefined}>
            {habits.length === 0 ? (
              <EmptyState icon={CalendarCheck} text="No active habits" />
            ) : (
              <ul className={styles.habits}>
                {habits.map((h) => (
                  <li key={h.habitId}>
                    <span className={styles.habitTitle}>{h.title}</span>
                    <span
                      className={styles.habitTrack}
                      role="progressbar"
                      aria-label={h.title}
                      aria-valuemin={0}
                      aria-valuemax={h.expected}
                      aria-valuenow={Math.min(h.done, h.expected)}
                    >
                      <span style={{ width: `${Math.min(1, h.expected > 0 ? h.done / h.expected : h.done > 0 ? 1 : 0) * 100}%` }} />
                    </span>
                    <span className={styles.habitCount}>{`${h.done} / ${h.expected}`}</span>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </div>
        <div className={history === undefined ? styles.half : styles.third}>
          <Section tile title="Done this week" count={done.length || undefined}>
            {done.length === 0 ? (
              <EmptyState icon={CircleCheck} text="Nothing completed this week" />
            ) : (
              done.map((d) => <ListRow key={d.key} title={d.title} onOpen={d.open} meta={d.meta ? <span>{d.meta}</span> : undefined} />)
            )}
          </Section>
        </div>
        {history !== undefined && <div className={styles.third}>{history}</div>}
      </div>
    </div>
  );
}
