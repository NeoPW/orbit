import { localToday } from '../../../core/dates/deadline.ts';
import { addDays } from '../../../core/dates/today.ts';
import type { GoalStatus, MeasureType, ScheduleType } from '../../../core/db/schema.ts';
import { goalProgress, measureProgress } from '../../goals/domain/goals.ts';
import { isoWeekday } from '../../habits/domain/habits.ts';
import { workOnGoal, type WorkLinks } from '../../work-log/domain/work-log.ts';
import type { WeekRange } from './review-week.ts';

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
    checkIns: number;
  }[];
  /** Projects, deleted ones included (their entries then count as "No project"). */
  projects: { id: string; title: string; goalId: string | null; status: string; completedAt: string | null; deletedAt: string | null }[];
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
    active: boolean;
    scheduleType: ScheduleType;
    weekdays: number[] | null;
    timesPerWeek: number | null;
    createdAt: string;
  }[];
  /** Habit checks of the week (not deleted). */
  habitChecks: { habitId: string; date: string }[];
  /** Log entries (not deleted); entries outside the week are ignored. */
  logEntries: { projectId: string | null; goalId: string | null; taskId: string | null; occurredAt: string; durationMinutes: number | null }[];
  /** Completed reviews (not deleted) and the snapshots stored with them. */
  reviews: { id: string; weekStart: string; completedAt: string | null }[];
  snapshots: { weeklyReviewId: string; measureId: string; progress: number }[];
}

export interface MeasureSummary {
  measureId: string;
  title: string;
  /** 0 to 1. */
  progress: number;
  /** Change in percentage points since the earlier review, or null. */
  change: number | null;
}

export interface GoalSummary {
  goalId: string;
  title: string;
  color: string | null;
  /** Position among all goals in sort order, for the Auto color. */
  index: number;
  /** 0 to 1; null without measures. */
  progress: number | null;
  change: number | null;
  measures: MeasureSummary[];
  work: { count: number; minutes: number };
}

export interface ProjectWork {
  /** Null for entries without a project. */
  projectId: string | null;
  title: string;
  count: number;
  minutes: number;
}

export interface WorkGroup {
  /** Null for projects without a goal (which also holds "No project"). */
  goalId: string | null;
  goalTitle: string | null;
  projects: ProjectWork[];
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
  work: WorkGroup[];
  habits: HabitAdherence[];
  completedTasks: CompletedTaskSummary[];
  finishedProjects: FinishedProject[];
}

const NO_PROJECT = 'No project';

const localDate = (iso: string) => localToday(new Date(iso));
const byRecent = <T extends { completedAt: string }>(a: T, b: T) => (a.completedAt < b.completedAt ? 1 : a.completedAt > b.completedAt ? -1 : 0);
const round = (n: number) => Math.round(n * 100);

function summarizeWork(rows: WeekRows, week: WeekRange): WorkGroup[] {
  const projects = new Map(rows.projects.filter((p) => p.deletedAt === null).map((p) => [p.id, p]));
  const totals = new Map<string | null, ProjectWork>();
  for (const e of rows.logEntries) {
    if (e.occurredAt < week.from || e.occurredAt >= week.to) continue;
    const project = e.projectId ? projects.get(e.projectId) : undefined;
    const key = project?.id ?? null;
    const row = totals.get(key) ?? { projectId: key, title: project?.title ?? NO_PROJECT, count: 0, minutes: 0 };
    row.count += 1;
    row.minutes += e.durationMinutes ?? 0;
    totals.set(key, row);
  }
  const order = (a: ProjectWork, b: ProjectWork) => b.minutes - a.minutes || b.count - a.count || a.title.localeCompare(b.title);
  const groups: WorkGroup[] = [];
  for (const goal of rows.goals) {
    const list = [...totals.values()].filter((w) => w.projectId !== null && projects.get(w.projectId)?.goalId === goal.id).sort(order);
    if (list.length > 0) groups.push({ goalId: goal.id, goalTitle: goal.title, projects: list });
  }
  const goalIds = new Set(rows.goals.map((g) => g.id));
  const loose = [...totals.values()].filter((w) => w.projectId !== null && !goalIds.has(projects.get(w.projectId)?.goalId ?? '')).sort(order);
  const none = totals.get(null);
  if (none) loose.push(none);
  if (loose.length > 0) groups.push({ goalId: null, goalTitle: null, projects: loose });
  return groups;
}

function summarizeHabits(rows: WeekRows, week: WeekRange, today: string): HabitAdherence[] {
  const lastDay = today < week.end ? today : week.end;
  return rows.habits
    .filter((h) => h.active)
    .map((h) => {
      const done = new Set(rows.habitChecks.filter((c) => c.habitId === h.id && c.date >= week.start && c.date <= week.end).map((c) => c.date)).size;
      let expected = 0;
      if (h.scheduleType === 'times_per_week') expected = h.timesPerWeek ?? 0;
      else {
        const from = localDate(h.createdAt) > week.start ? localDate(h.createdAt) : week.start;
        for (let d = from; d <= lastDay; d = addDays(d, 1)) {
          if (h.scheduleType === 'daily' || (h.weekdays ?? []).includes(isoWeekday(d))) expected += 1;
        }
      }
      return { habitId: h.id, title: h.title, done, expected };
    })
    .sort((a, b) => a.title.localeCompare(b.title));
}

function summarizeGoals(rows: WeekRows, week: WeekRange): GoalSummary[] {
  const measureById = new Map(rows.measures.map((m) => [m.id, m]));
  const goalById = new Map(rows.goals.map((g) => [g.id, g]));
  const completed = rows.reviews.filter((r) => r.completedAt !== null);
  const snapshotsOf = (reviewId: string) => rows.snapshots.filter((s) => s.weeklyReviewId === reviewId && measureById.has(s.measureId));
  const thisReview = completed.find((r) => r.weekStart === week.start);

  /** Progress per measure of each goal in this week's view. */
  const current = new Map<string, Map<string, number>>();
  if (thisReview) {
    for (const s of snapshotsOf(thisReview.id)) {
      const goalId = measureById.get(s.measureId)?.goalId;
      if (goalId && goalById.has(goalId)) current.set(goalId, (current.get(goalId) ?? new Map()).set(s.measureId, s.progress));
    }
  } else {
    for (const goal of rows.goals.filter((g) => g.status === 'active')) {
      current.set(goal.id, new Map(rows.measures.filter((m) => m.goalId === goal.id).map((m) => [m.id, measureProgress(m, m.checkIns)])));
    }
  }

  const earlier = completed.filter((r) => r.weekStart < week.start).sort((a, b) => (a.weekStart < b.weekStart ? 1 : -1));
  const projectGoals = new Map(rows.projects.map((p) => [p.id, p.goalId]));
  const links: WorkLinks = { projectGoals, tasks: new Map(rows.tasks.map((t) => [t.id, { projectId: t.projectId, goalId: t.goalId }])) };

  return rows.goals
    .filter((g) => current.has(g.id))
    .map((goal) => {
      const now = current.get(goal.id)!;
      const progress = goalProgress([...now.values()]);
      // The most recent earlier review that stored snapshots for this goal's measures.
      let before: Map<string, number> | null = null;
      for (const review of earlier) {
        const snaps = snapshotsOf(review.id).filter((s) => measureById.get(s.measureId)?.goalId === goal.id);
        if (snaps.length > 0) {
          before = new Map(snaps.map((s) => [s.measureId, s.progress]));
          break;
        }
      }
      const beforeGoal = before ? goalProgress([...before.values()]) : null;
      const work = workOnGoal(rows.logEntries, goal.id, links, week).week;
      return {
        goalId: goal.id,
        title: goal.title,
        color: goal.color,
        index: rows.goals.indexOf(goal),
        progress,
        change: progress !== null && beforeGoal !== null ? round(progress) - round(beforeGoal) : null,
        measures: [...now].map(([measureId, p]) => ({
          measureId,
          title: measureById.get(measureId)?.title ?? '',
          progress: p,
          change: before?.has(measureId) ? round(p) - round(before.get(measureId)!) : null,
        })),
        work,
      };
    });
}

/** Summary of the Monday–Sunday `week` over plain rows. `today` caps the expected habit days of the current week. */
export function summarizeWeek(rows: WeekRows, week: WeekRange, today: string): WeekSummary {
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
        assignedTo: project ? { kind: 'project', id: project.id, title: project.title } : goal ? { kind: 'goal', id: goal.id, title: goal.title } : null,
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
    work: summarizeWork(rows, week),
    habits: summarizeHabits(rows, week, today),
    completedTasks,
    finishedProjects,
  };
}
