export const MAX_DURATION_MINUTES = 1440;

/** "45 min", "2 h" or "1 h 30 min". */
export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

export type DurationResult = { ok: true; minutes: number | null } | { ok: false; error: string };

/** A duration is empty or a whole number of minutes from 1 to 1440. */
export function parseDuration(input: string): DurationResult {
  const text = input.trim();
  if (text === '') return { ok: true, minutes: null };
  const n = Number(text);
  if (!/^\d+$/.test(text) || n < 1 || n > MAX_DURATION_MINUTES) {
    return { ok: false, error: `Enter whole minutes from 1 to ${MAX_DURATION_MINUTES}` };
  }
  return { ok: true, minutes: n };
}

export type OccurrenceResult = { ok: true; at: Date } | { ok: false; error: string };

/**
 * The time of a manual entry. Without a start time the work ended `now`; with one (`HH:mm`, today) it ended
 * at the start plus the duration (the start itself without a duration). A start later than `now` is an error.
 */
export function occurrenceTime(start: string | null, durationMinutes: number | null, now: Date): OccurrenceResult {
  if (start === null || start.trim() === '') return { ok: true, at: now };
  const match = /^(\d{1,2}):(\d{2})$/.exec(start.trim());
  if (!match) return { ok: false, error: 'Enter a time as HH:mm' };
  const begin = new Date(now.getFullYear(), now.getMonth(), now.getDate(), Number(match[1]), Number(match[2]));
  if (begin.getTime() > now.getTime()) return { ok: false, error: 'The start time is in the future' };
  return { ok: true, at: new Date(begin.getTime() + (durationMinutes ?? 0) * 60000) };
}

/** Items with log entries first, newest entry first, then the rest by title. `lastLogged` maps item id to its latest `occurred_at`. */
export function recentFirst<T extends { id: string; title: string }>(items: readonly T[], lastLogged: ReadonlyMap<string, string>): T[] {
  return [...items].sort((a, b) => {
    const la = lastLogged.get(a.id);
    const lb = lastLogged.get(b.id);
    if (la && lb) return la < lb ? 1 : la > lb ? -1 : a.title.localeCompare(b.title);
    if (la) return -1;
    if (lb) return 1;
    return a.title.localeCompare(b.title);
  });
}

/** Latest `occurred_at` per target id, for `recentFirst`. */
export function lastLoggedBy<K extends string>(
  entries: readonly ({ occurredAt: string } & Record<K, string | null>)[],
  key: K,
): Map<string, string> {
  const map = new Map<string, string>();
  for (const e of entries) {
    const id = e[key];
    if (id !== null && (map.get(id) ?? '') < e.occurredAt) map.set(id, e.occurredAt);
  }
  return map;
}

export interface GoalWorkEntry {
  projectId: string | null;
  goalId: string | null;
  taskId: string | null;
  occurredAt: string;
  durationMinutes: number | null;
}

export interface WorkLinks {
  /** Current goal of each project (null or missing when none). */
  projectGoals: ReadonlyMap<string, string | null>;
  /** Current project and goal of each task. */
  tasks: ReadonlyMap<string, { projectId: string | null; goalId: string | null }>;
}

export interface WorkTotals {
  count: number;
  minutes: number;
}

export interface GoalWork<E> {
  /** The goal's entries, newest first. */
  entries: E[];
  week: WorkTotals;
  total: WorkTotals;
}

/** Whether the entry is work on the goal, by the current links of its project and task. */
export function isWorkOnGoal(entry: GoalWorkEntry, goalId: string, links: WorkLinks): boolean {
  if (entry.goalId === goalId) return true;
  if (entry.projectId && links.projectGoals.get(entry.projectId) === goalId) return true;
  if (entry.taskId) {
    const task = links.tasks.get(entry.taskId);
    if (task?.goalId === goalId) return true;
    if (task?.projectId && links.projectGoals.get(task.projectId) === goalId) return true;
  }
  return false;
}

/** Work on a goal: its entries, newest first, with totals for the week (`from` inclusive, `to` exclusive, ISO instants) and overall. */
export function workOnGoal<E extends GoalWorkEntry>(
  entries: readonly E[],
  goalId: string,
  links: WorkLinks,
  week: { from: string; to: string },
): GoalWork<E> {
  const mine = entries
    .filter((e) => isWorkOnGoal(e, goalId, links))
    .sort((a, b) => (a.occurredAt < b.occurredAt ? 1 : a.occurredAt > b.occurredAt ? -1 : 0));
  const sum = (list: E[]): WorkTotals => ({ count: list.length, minutes: list.reduce((s, e) => s + (e.durationMinutes ?? 0), 0) });
  return {
    entries: mine,
    week: sum(mine.filter((e) => e.occurredAt >= week.from && e.occurredAt < week.to)),
    total: sum(mine),
  };
}
