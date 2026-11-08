/** Pure parsing of the focus panel's field: `title # project` (see openspec day-timeline, "Start with a new task"). */

/** Something to focus on that the field suggests: an open task or an active habit. */
export interface QuickTask {
  id: string;
  title: string;
  projectId: string | null;
  /** A task unless stated. */
  kind?: 'task' | 'habit';
}

export interface QuickProject {
  id: string;
  title: string;
}

export type QuickStartPlan =
  | { kind: 'empty' }
  | { kind: 'task'; taskId: string }
  | { kind: 'habit'; habitId: string }
  | { kind: 'new'; title: string; projectId: string | null }
  | { kind: 'project'; projectId: string }
  | { kind: 'error'; message: string };

/** Splits at the last `#`; `projectQuery` is null without `#` or when nothing follows it. */
export function parseQuickStart(text: string): { title: string; projectQuery: string | null; hasHash: boolean } {
  const at = text.lastIndexOf('#');
  if (at === -1) return { title: text.trim(), projectQuery: null, hasHash: false };
  const query = text.slice(at + 1).trim();
  return { title: text.slice(0, at).trim(), projectQuery: query === '' ? null : query, hasHash: true };
}

const lower = (text: string) => text.trim().toLowerCase();

/** Items whose title contains `text` (ignoring case), those starting with it first, at most `limit`. */
function matchTitles<T extends { title: string }>(text: string, items: T[], limit: number): T[] {
  const needle = lower(text);
  if (needle === '') return [];
  const hits = items.filter((item) => lower(item.title).includes(needle));
  const starts = hits.filter((item) => lower(item.title).startsWith(needle));
  return [...starts, ...hits.filter((item) => !starts.includes(item))].slice(0, limit);
}

export const matchTasks = <T extends { title: string }>(text: string, tasks: T[], limit = 8): T[] => matchTitles(text, tasks, limit);
export const matchProjects = <T extends { title: string }>(text: string, projects: T[], limit = 8): T[] =>
  matchTitles(text, projects, limit);

/** The project named exactly (ignoring case), else the only one starting with the query, else null. */
export function resolveProject<T extends { title: string }>(query: string, projects: T[]): T | null {
  const needle = lower(query);
  const exact = projects.find((p) => lower(p.title) === needle);
  if (exact) return exact;
  const prefixed = projects.filter((p) => lower(p.title).startsWith(needle));
  return prefixed.length === 1 ? (prefixed[0] ?? null) : null;
}

const isHabit = (t: QuickTask) => t.kind === 'habit';
const existing = (t: QuickTask): QuickStartPlan => (isHabit(t) ? { kind: 'habit', habitId: t.id } : { kind: 'task', taskId: t.id });

/** The open task with this title, else the habit (a task wins, so no duplicate is created for a habit's name). */
function findByTitle(items: QuickTask[], title: string): QuickTask | undefined {
  const same = items.filter((t) => lower(t.title) === lower(title));
  return same.find((t) => !isHabit(t)) ?? same[0];
}

/** What Start does for the field's text; the UI only carries it out. */
export function quickStartPlan(text: string, tasks: QuickTask[], projects: QuickProject[]): QuickStartPlan {
  const { title, projectQuery } = parseQuickStart(text);
  if (projectQuery !== null) {
    const project = resolveProject(projectQuery, projects);
    if (!project) return { kind: 'error', message: `No project named ${projectQuery}` };
    if (title === '') return { kind: 'project', projectId: project.id };
    const same = tasks.find((t) => t.projectId === project.id && lower(t.title) === lower(title));
    return same ? existing(same) : { kind: 'new', title, projectId: project.id };
  }
  if (title === '') return { kind: 'empty' };
  const found = findByTitle(tasks, title);
  if (found) return existing(found);
  // A project's exact name starts on the project rather than creating a task named like it.
  const project = projects.find((p) => lower(p.title) === lower(title));
  return project ? { kind: 'project', projectId: project.id } : { kind: 'new', title, projectId: null };
}
