import { localToday } from '../../../core/dates/deadline.ts';
import { addDays } from '../../../core/dates/today.ts';
import { goalColor, projectColor } from '../../../core/ui/colors.ts';
import { isWorkOnGoal, type WorkLinks } from '../../work-log/domain/work-log.ts';
import { weekRange, type WeekRange } from './review-week.ts';
import type { WeekRows } from './week-summary.ts';

export type TimeGrouping = 'area' | 'goal' | 'project';

export interface TimeItem {
  /** Null for "Other". */
  id: string | null;
  title: string;
  /** CSS colour; null for "Other". */
  color: string | null;
  minutes: number;
}

export interface WeekTime {
  totalMinutes: number;
  /** The weekly hour target in minutes, or null without one. */
  targetMinutes: number | null;
  /** Share of the target reached, whole percent; null without a target. */
  targetShare: number | null;
  dailyAverageMinutes: number;
  /** Minutes that are work on any goal. */
  goalMinutes: number;
  /** Share of the total on goals, whole percent; null without time. */
  goalShare: number | null;
  byArea: TimeItem[];
  byGoal: TimeItem[];
  byProject: TimeItem[];
  /** Minutes worked on each day, Monday to Sunday (by the local date of the entry). */
  dayMinutes: number[];
}

const OTHER = 'Other';
const percent = (part: number, whole: number) => Math.round((part / whole) * 100);
const minutesOf = (e: { durationMinutes: number | null }) => e.durationMinutes ?? 0;

/** Entries that fall in the local week. */
function inWeek<E extends { occurredAt: string }>(entries: readonly E[], week: WeekRange): E[] {
  return entries.filter((e) => e.occurredAt >= week.from && e.occurredAt < week.to);
}

/** Days the daily average divides by: the days up to today in the current week, else 7. */
function daysOf(week: WeekRange, today: string): number {
  if (today < week.start || today > week.end) return 7;
  let days = 1;
  for (let d = week.start; d < today; d = addDays(d, 1)) days += 1;
  return days;
}

/** Sums minutes per key; items by minutes (highest first), "Other" last. */
function items(totals: Map<string | null, number>, info: (id: string) => { title: string; color: string } | undefined): TimeItem[] {
  const list: TimeItem[] = [];
  let other = totals.get(null) ?? 0;
  for (const [id, minutes] of totals) {
    if (id === null || minutes <= 0) continue;
    const known = info(id);
    if (known) list.push({ id, title: known.title, color: known.color, minutes });
    else other += minutes;
  }
  list.sort((a, b) => b.minutes - a.minutes || a.title.localeCompare(b.title));
  if (other > 0) list.push({ id: null, title: OTHER, color: null, minutes: other });
  return list;
}

/** The week's time: totals, the share on goals and the time grouped by area, goal and project. `targetHours` is the weekly target. */
export function weekTime(rows: WeekRows, week: WeekRange, today: string, targetHours: number | null): WeekTime {
  const entries = inWeek(rows.logEntries, week);
  const total = entries.reduce((sum, e) => sum + minutesOf(e), 0);
  const projects = new Map(rows.projects.filter((p) => p.deletedAt === null).map((p) => [p.id, p]));
  const areas = new Map(rows.areas.map((a) => [a.id, a]));
  const tasks = new Map(rows.tasks.map((t) => [t.id, { projectId: t.projectId, goalId: t.goalId }]));
  const links: WorkLinks = { projectGoals: new Map(rows.projects.map((p) => [p.id, p.goalId])), tasks };

  const byProject = new Map<string | null, number>();
  const byArea = new Map<string | null, number>();
  for (const e of entries) {
    const projectId = e.projectId ?? (e.taskId ? tasks.get(e.taskId)?.projectId : null) ?? null;
    const project = projectId ? projects.get(projectId) : undefined;
    byProject.set(project?.id ?? null, (byProject.get(project?.id ?? null) ?? 0) + minutesOf(e));
    const areaId = project?.areaId ?? null;
    byArea.set(areaId, (byArea.get(areaId) ?? 0) + minutesOf(e));
  }

  const goalIndex = new Map(rows.goals.map((g, i) => [g.id, i]));
  const byGoal = new Map<string | null, number>();
  let goalMinutes = 0;
  for (const goal of rows.goals) {
    const minutes = entries.filter((e) => isWorkOnGoal(e, goal.id, links)).reduce((sum, e) => sum + minutesOf(e), 0);
    byGoal.set(goal.id, minutes);
    goalMinutes += minutes;
  }
  goalMinutes = Math.min(goalMinutes, total);
  byGoal.set(null, total - goalMinutes);

  const targetMinutes = targetHours === null ? null : targetHours * 60;
  const goals = new Map(rows.goals.map((g) => [g.id, g]));
  const dayMinutes = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(week.start, i);
    return entries.filter((e) => localToday(new Date(e.occurredAt)) === date).reduce((sum, e) => sum + minutesOf(e), 0);
  });
  return {
    dayMinutes,
    totalMinutes: total,
    targetMinutes,
    targetShare: targetMinutes === null ? null : percent(total, targetMinutes),
    dailyAverageMinutes: Math.round(total / daysOf(week, today)),
    goalMinutes,
    goalShare: total > 0 ? percent(goalMinutes, total) : null,
    byArea: items(byArea, (id) => {
      const a = areas.get(id);
      return a && { title: a.name, color: a.color };
    }),
    byGoal: items(byGoal, (id) => {
      const g = goals.get(id);
      return g && { title: g.title, color: goalColor(g, goalIndex.get(id) ?? 0) };
    }),
    byProject: items(byProject, (id) => {
      const p = projects.get(id);
      return p && { title: p.title, color: projectColor(p) };
    }),
  };
}

export interface TrendWeek {
  weekStart: string;
  minutes: number;
  /** The 4-week average ending with this week; null for the current week. */
  average: number | null;
  shown: boolean;
  current: boolean;
}

export interface RecentWeeks {
  weeks: TrendWeek[];
  /** The 4-week average of the shown week, or of the 4 weeks before it when the shown week is the current one. */
  headline: number;
}

export const TREND_WEEKS = 8;
const AVERAGE_WEEKS = 4;

/** Total time of each of the 8 weeks ending with `shownWeek`, with the rolling 4-week average. Weeks are Monday dates. */
export function recentWeeks(rows: Pick<WeekRows, 'logEntries'>, shownWeek: string, currentWeek: string): RecentWeeks {
  const total = (weekStart: string) => inWeek(rows.logEntries, weekRange(weekStart)).reduce((sum, e) => sum + minutesOf(e), 0);
  const mean = (weekStart: string) => {
    let sum = 0;
    for (let i = 0; i < AVERAGE_WEEKS; i++) sum += total(addDays(weekStart, -7 * i));
    return Math.round(sum / AVERAGE_WEEKS);
  };
  const weeks = Array.from({ length: TREND_WEEKS }, (_, i): TrendWeek => {
    const weekStart = addDays(shownWeek, -7 * (TREND_WEEKS - 1 - i));
    const current = weekStart === currentWeek;
    return { weekStart, minutes: total(weekStart), average: current ? null : mean(weekStart), shown: weekStart === shownWeek, current };
  });
  return { weeks, headline: mean(shownWeek === currentWeek ? addDays(shownWeek, -7) : shownWeek) };
}
