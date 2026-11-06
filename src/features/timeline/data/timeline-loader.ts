import { and, gte, lt } from 'drizzle-orm';
import type { Db } from '../../../core/db/drizzle.ts';
import { notDeleted } from '../../../core/db/records.ts';
import { goals, habits, logEntries, projects, tasks } from '../../../core/db/schema.ts';
import { goalColor, projectColor } from '../../../core/ui/colors.ts';
import { getTimer } from '../../timer/data/timer-repository.ts';
import { blockTimes } from '../domain/day-timeline.ts';

/** What clicking an item opens. */
export type TimelineTarget = { taskId: string } | { projectId: string } | { goalId: string };

export interface TimelineItem {
  id: string;
  kind: 'block' | 'marker';
  start: Date;
  end: Date;
  /** The task, else the project, else the goal, else the note. */
  label: string;
  /** The project's title, for the second line of a block; null without a project. */
  projectName: string | null;
  note: string;
  /** Duration in minutes; for a running session the minutes up to `end`. 0 for a marker. */
  minutes: number;
  /** A CSS colour (project, else goal), or null for neutral. */
  color: string | null;
  target: TimelineTarget | null;
  /** The running focus session; its `end` is the time of loading and the view moves it. */
  running: boolean;
}

/**
 * The work between two UTC instants (`from` inclusive, `to` exclusive) as timeline items:
 * a block for each log entry with a duration, a marker for each without, and the running
 * timer (if it started in the range) as a running block ending at `now`.
 */
export async function loadTimeline(db: Db, from: string, to: string, now: Date = new Date()): Promise<TimelineItem[]> {
  const [entries, timer, projectRows, taskRows, goalRows, habitRows] = await Promise.all([
    db
      .select()
      .from(logEntries)
      .where(and(notDeleted(logEntries), gte(logEntries.occurredAt, from), lt(logEntries.occurredAt, to))),
    getTimer(db),
    db.select().from(projects),
    db.select().from(tasks),
    db.select().from(goals).where(notDeleted(goals)).orderBy(goals.sortOrder, goals.createdAt),
    db.select().from(habits),
  ]);
  const habitById = new Map(habitRows.map((h) => [h.id, h]));
  const projectById = new Map(projectRows.map((p) => [p.id, p]));
  const taskById = new Map(taskRows.map((t) => [t.id, t]));
  const goalIndex = new Map(goalRows.map((g, index) => [g.id, { goal: g, index }]));

  /** Label, colour and target of what some work belongs to. */
  const describe = (
    links: { taskId: string | null; habitId: string | null; projectId: string | null; goalId: string | null },
    note: string,
  ) => {
    const task = links.taskId ? taskById.get(links.taskId) : undefined;
    const liveTask = task && task.deletedAt === null ? task : undefined;
    const habit = links.habitId && !liveTask ? habitById.get(links.habitId) : undefined;
    const liveHabit = habit && habit.deletedAt === null ? habit : undefined;
    const project = projectById.get(task?.projectId ?? habit?.projectId ?? links.projectId ?? '');
    const liveProject = project && project.deletedAt === null ? project : undefined;
    const goalEntry = goalIndex.get(task?.goalId ?? habit?.goalId ?? links.goalId ?? '');
    const label = liveTask?.title ?? liveHabit?.title ?? liveProject?.title ?? goalEntry?.goal.title ?? (note.trim() || 'Work');
    const color = project ? projectColor(project) : goalEntry ? goalColor(goalEntry.goal, goalEntry.index) : null;
    const target: TimelineTarget | null = liveTask
      ? { taskId: liveTask.id }
      : liveProject
        ? { projectId: liveProject.id }
        : goalEntry
          ? { goalId: goalEntry.goal.id }
          : null;
    return { label, color, target, projectName: liveProject?.title ?? null };
  };

  const items: TimelineItem[] = entries.map((entry) => {
    const { start, end } = blockTimes(entry);
    const isBlock = entry.durationMinutes !== null && entry.durationMinutes > 0;
    return {
      id: entry.id,
      kind: isBlock ? 'block' : 'marker',
      start,
      end,
      note: entry.note,
      minutes: isBlock ? (entry.durationMinutes ?? 0) : 0,
      running: false,
      ...describe(entry, entry.note),
    };
  });

  if (timer && timer.startedAt >= from && timer.startedAt < to) {
    const start = new Date(timer.startedAt);
    items.push({
      id: timer.id,
      kind: 'block',
      start,
      end: now > start ? now : start,
      note: '',
      minutes: Math.max(0, Math.floor((now.getTime() - start.getTime()) / 60000)),
      running: true,
      ...describe({ taskId: timer.taskId, habitId: timer.habitId, projectId: timer.projectId, goalId: null }, ''),
    });
  }
  return items.sort((a, b) => a.start.getTime() - b.start.getTime());
}
