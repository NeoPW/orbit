import { localToday } from '../../../core/dates/deadline.ts';
import type { GoalStatus, MeasureType, ScheduleType } from '../../../core/db/schema.ts';
import { goalProgress, measureProgress, measureStateAt, type ValueChange } from '../../goals/domain/goals.ts';
import { weekAdherence, weekStartOf } from '../../habits/domain/habits.ts';
import { workOnGoal, type WorkLinks } from '../../work-log/domain/work-log.ts';
import type { WeekRange } from './review-week.ts';
import { recentWeeks, weekTime, type RecentWeeks, type WeekTime } from './week-time.ts';

/** Plain rows of what a week summary needs; the loader fills them, soft-deleted rows included where noted. */
export interface WeekRows {
  /** Goals in sort order (not deleted). */
  goals: { id: string; title: string; status: GoalStatus; color: string | null }[];
  /** Measures (not deleted). `checkIns` counts the checks of the linked habit since the goal's start. */
  measures: {
    id: string;
    goalId: string;
    title: string;
    measureType: MeasureType;
    startValue: number | null;
    targetValue: number | null;
    currentValue: number | null;
    habitId: string | null;
    unit: string | null;
    checkIns: number;
    /** Local dates of the linked habit's checks since the goal's start. */
    checkDates: string[];
    /** Recorded value changes (see measures, "Value history"). */
    changes: ValueChange[];
  }[];
  /** Areas (not deleted). */
  areas: { id: string; name: string; color: string }[];
  /** Projects, deleted ones included (their entries then count as "No project"). */
  projects: {
    id: string;
    title: string;
    goalId: string | null;
    areaId: string | null;
    color: string | null;
    status: string;
    completedAt: string | null;
    deletedAt: string | null;
  }[];
  /** Tasks, deleted ones included (for the links of log entries). */
  tasks: {
    id: string;
    title: string;
    projectId: string | null;
    goalId: string | null;
    status: string;
    completedAt: string | null;
    deletedAt: string | null;
  }[];
  habits: {
    id: string;
    title: string;
    projectId: string | null;
    goalId: string | null;
    active: boolean;
    scheduleType: ScheduleType;
    weekdays: number[] | null;
    timesPerWeek: number | null;
    createdAt: string;
  }[];
  /** Habit checks of the week (not deleted). */
  habitChecks: { habitId: string; date: string }[];
  /** Log entries (not deleted); entries outside the week are ignored. */
  logEntries: {
    projectId: string | null;
    goalId: string | null;
    taskId: string | null;
    habitId: string | null;
    occurredAt: string;
    durationMinutes: number | null;
  }[];
  /** Completed reviews (not deleted) and the snapshots stored with them. */
  reviews: { id: string; weekStart: string; completedAt: string | null }[];
  snapshots: { weeklyReviewId: string; measureId: string; progress: number }[];
}

export interface MeasureSummary {
  measureId: string;
  title: string;
  /** 0 to 1. */
  progress: number;
  measureType: MeasureType;
  unit: string | null;
  target: number | null;
  /** The value at the end of the week (check-ins for a habit measure, 0 or 1 for yes/no). */
  value: number;
  /** The value at the start of the week; null when the measure did not change in the week. */
  from: number | null;
  /** Progress (0 to 1) gained during the week, for the bar; 0 when it did not rise. */
  gain: number;
}

export interface GoalSummary {
  goalId: string;
  title: string;
  color: string | null;
  /** Position among all goals in sort order, for the Auto color. */
  index: number;
  /** 0 to 1; null without measures. */
  progress: number | null;
  /** Change of the progress during the week in percentage points; null when zero or unknown. */
  change: number | null;
  /** Progress (0 to 1) the goal gained during the week, for the bar. */
  gain: number;
  measures: MeasureSummary[];
  work: { count: number; minutes: number };
}

export interface HabitAdherence {
  habitId: string;
  title: string;
  done: number;
  expected: number;
}

export interface CompletedTaskSummary {
  taskId: string;
  title: string;
  completedAt: string;
  /** What the task is assigned to, if anything. */
  assignedTo: { kind: 'project' | 'goal'; id: string; title: string } | null;
}

export interface FinishedProject {
  projectId: string;
  title: string;
  completedAt: string;
  goalTitle: string | null;
}

export interface WeekSummary {
  weekStart: string;
  weekEnd: string;
  goals: GoalSummary[];
  time: WeekTime;
  trend: RecentWeeks;
  habits: HabitAdherence[];
  completedTasks: CompletedTaskSummary[];
  finishedProjects: FinishedProject[];
}

/** The "Habits" figure: check-ins counted up to what each habit expects, out of all expected; share null without any. */
export function habitsFigure(habits: HabitAdherence[]): { kept: number; expected: number; share: number | null } {
  const kept = habits.reduce((sum, h) => sum + Math.min(h.done, h.expected), 0);
  const expected = habits.reduce((sum, h) => sum + h.expected, 0);
  return { kept, expected, share: expected > 0 ? Math.round((kept / expected) * 100) : null };
}

const localDate = (iso: string) => localToday(new Date(iso));
const byRecent = <T extends { completedAt: string }>(a: T, b: T) =>
  a.completedAt < b.completedAt ? 1 : a.completedAt > b.completedAt ? -1 : 0;
const round = (n: number) => Math.round(n * 100);

function summarizeHabits(rows: WeekRows, week: WeekRange, today: string): HabitAdherence[] {
  return rows.habits
    .filter((h) => h.active)
    .map((h) => {
      const checks = rows.habitChecks.filter((c) => c.habitId === h.id).map((c) => c.date);
      return { habitId: h.id, title: h.title, ...weekAdherence(h, checks, week, today) };
    })
    .sort((a, b) => a.title.localeCompare(b.title));
}

function summarizeGoals(rows: WeekRows, week: WeekRange): GoalSummary[] {
  const measureById = new Map(rows.measures.map((m) => [m.id, m]));
  const goalById = new Map(rows.goals.map((g) => [g.id, g]));
  const completed = rows.reviews.filter((r) => r.completedAt !== null);
  const thisReview = completed.find((r) => r.weekStart === week.start);

  /** Progress per measure of each goal in this week's view. */
  const current = new Map<string, Map<string, number>>();
  if (thisReview) {
    for (const s of rows.snapshots.filter((s) => s.weeklyReviewId === thisReview.id && measureById.has(s.measureId))) {
      const goalId = measureById.get(s.measureId)?.goalId;
      if (goalId && goalById.has(goalId)) current.set(goalId, (current.get(goalId) ?? new Map()).set(s.measureId, s.progress));
    }
  } else {
    for (const goal of rows.goals.filter((g) => g.status === 'active')) {
      current.set(goal.id, new Map(rows.measures.filter((m) => m.goalId === goal.id).map((m) => [m.id, measureProgress(m, m.checkIns)])));
    }
  }

  const projectGoals = new Map(rows.projects.map((p) => [p.id, p.goalId]));
  const links: WorkLinks = { projectGoals, tasks: new Map(rows.tasks.map((t) => [t.id, { projectId: t.projectId, goalId: t.goalId }])) };

  return rows.goals
    .filter((g) => current.has(g.id))
    .map((goal) => {
      const now = current.get(goal.id)!;
      const progress = goalProgress([...now.values()]);
      const atStart = new Map<string, number>();
      const atEnd = new Map<string, number>();
      const measures = [...now].map(([measureId, p]): MeasureSummary => {
        const m = measureById.get(measureId)!;
        const start = measureStateAt(m, week.from, (d) => d < week.start);
        const end = measureStateAt(m, week.to, (d) => d <= week.end);
        atStart.set(measureId, start.progress);
        atEnd.set(measureId, end.progress);
        return {
          measureId,
          title: m.title,
          progress: p,
          measureType: m.measureType,
          unit: m.unit,
          target: m.targetValue,
          value: end.value,
          from: start.value !== end.value ? start.value : null,
          gain: Math.max(0, Math.min(p, end.progress) - start.progress),
        };
      });
      const endProgress = goalProgress([...atEnd.values()]) ?? 0;
      const startProgress = goalProgress([...atStart.values()]) ?? 0;
      const delta = round(endProgress) - round(startProgress);
      return {
        goalId: goal.id,
        title: goal.title,
        color: goal.color,
        index: rows.goals.indexOf(goal),
        progress,
        change: delta === 0 ? null : delta,
        gain: Math.max(0, Math.min(progress ?? 0, endProgress) - startProgress),
        measures,
        work: workOnGoal(rows.logEntries, goal.id, links, week).week,
      };
    });
}

/** Summary of the Monday–Sunday `week` over plain rows. `today` caps the expected habit days of the current week. */
export function summarizeWeek(rows: WeekRows, week: WeekRange, today: string, options: { targetHours?: number | null } = {}): WeekSummary {
  const projectsById = new Map(rows.projects.filter((p) => p.deletedAt === null).map((p) => [p.id, p]));
  const goalTitle = (id: string | null) => rows.goals.find((g) => g.id === id)?.title ?? null;
  const inWeek = (iso: string | null): iso is string => iso !== null && localDate(iso) >= week.start && localDate(iso) <= week.end;

  const completedTasks = rows.tasks
    .filter((t) => t.deletedAt === null && t.status === 'done' && inWeek(t.completedAt))
    .map((t): CompletedTaskSummary => {
      const project = t.projectId ? projectsById.get(t.projectId) : undefined;
      const goal = t.goalId ? rows.goals.find((g) => g.id === t.goalId) : undefined;
      return {
        taskId: t.id,
        title: t.title,
        completedAt: t.completedAt!,
        assignedTo: project
          ? { kind: 'project', id: project.id, title: project.title }
          : goal
            ? { kind: 'goal', id: goal.id, title: goal.title }
            : null,
      };
    })
    .sort(byRecent);

  const finishedProjects = rows.projects
    .filter((p) => p.deletedAt === null && p.status === 'completed' && inWeek(p.completedAt))
    .map((p): FinishedProject => ({ projectId: p.id, title: p.title, completedAt: p.completedAt!, goalTitle: goalTitle(p.goalId) }))
    .sort(byRecent);

  return {
    weekStart: week.start,
    weekEnd: week.end,
    goals: summarizeGoals(rows, week),
    time: weekTime(rows, week, today, options.targetHours ?? null),
    trend: recentWeeks(rows, week.start, weekStartOf(today)),
    habits: summarizeHabits(rows, week, today),
    completedTasks,
    finishedProjects,
  };
}
