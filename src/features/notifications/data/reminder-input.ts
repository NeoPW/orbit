import { and, eq, isNotNull } from 'drizzle-orm';
import type { Db } from '../../../core/db/drizzle.ts';
import { notDeleted } from '../../../core/db/records.ts';
import { goals, habits, projects, tasks, weeklyReviews } from '../../../core/db/schema.ts';
import { listChecksSince } from '../../habits/data/habits-repository.ts';
import { weekStartOf } from '../../habits/domain/habits.ts';
import { getTimer } from '../../timer/data/timer-repository.ts';
import type { ReminderInput } from '../domain/plan-reminders.ts';

/** Reads what `planReminders` needs; `today` is the local date. */
export async function loadReminderInput(db: Db, today: string): Promise<ReminderInput> {
  const [habitRows, projectRows, goalRows, taskRows, reviewRows, checks, timer] = await Promise.all([
    db.select().from(habits).where(and(notDeleted(habits), eq(habits.active, true))),
    db.select().from(projects).where(notDeleted(projects)),
    db.select({ id: goals.id, title: goals.title }).from(goals).where(notDeleted(goals)),
    db.select().from(tasks).where(and(notDeleted(tasks), eq(tasks.status, 'open'), isNotNull(tasks.dueDate))),
    db.select({ weekStart: weeklyReviews.weekStart }).from(weeklyReviews).where(and(notDeleted(weeklyReviews), isNotNull(weeklyReviews.completedAt))),
    listChecksSince(db, weekStartOf(today)),
    getTimer(db),
  ]);
  const projectById = new Map(projectRows.map((p) => [p.id, p]));
  const goalTitle = new Map(goalRows.map((g) => [g.id, g.title]));

  let focus: ReminderInput['focus'] = null;
  if (timer?.plannedMinutes) {
    const [task] = timer.taskId ? await db.select({ title: tasks.title }).from(tasks).where(eq(tasks.id, timer.taskId)) : [];
    const project = timer.projectId ? projectById.get(timer.projectId)?.title : undefined;
    focus = { title: task?.title ?? project ?? 'Focus session', startedAt: timer.startedAt, plannedMinutes: timer.plannedMinutes };
  }

  return {
    habits: habitRows.map((h) => ({
      id: h.id,
      title: h.title,
      active: h.active,
      scheduleType: h.scheduleType,
      weekdays: h.weekdays,
      timesPerWeek: h.timesPerWeek,
      reminderTime: h.reminderTime,
      linkTitle: (h.projectId ? projectById.get(h.projectId)?.title : undefined) ?? (h.goalId ? goalTitle.get(h.goalId) : undefined) ?? null,
    })),
    checks: checks.map((c) => ({ habitId: c.habitId, date: c.date })),
    tasks: taskRows.flatMap((t) => {
      const project = t.projectId ? projectById.get(t.projectId) : undefined;
      const usable = t.projectId === null || (project !== undefined && project.deletedAt === null && project.status === 'active');
      return usable && t.dueDate ? [{ id: t.id, title: t.title, dueDate: t.dueDate }] : [];
    }),
    projects: projectRows.flatMap((p) => (p.status === 'active' && p.deadline ? [{ id: p.id, title: p.title, deadline: p.deadline }] : [])),
    completedReviewWeeks: reviewRows.map((r) => r.weekStart),
    focus,
  };
}
