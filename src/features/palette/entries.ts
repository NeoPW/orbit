/** The command palette's entries and filter (see openspec command-palette). Pure: the palette loads the data and runs the commands. */
import type { ShortcutAction } from '../../app/shortcuts/keys.ts';

export type PaletteKind = 'Create' | 'Go to' | 'Focus' | 'Session' | 'Theme' | 'Sync';

export type PaletteCommand =
  | { type: 'sheet'; sheet: 'task' | 'log' | 'project' | 'goal' | 'habit' | 'area' }
  | { type: 'screen'; screen: 'home' | 'plan' | 'review' | 'stats' | 'settings' }
  | { type: 'page'; page: 'project' | 'goal' | 'task'; id: string }
  | { type: 'focus'; target: { taskId: string } | { habitId: string } | { projectId: string } }
  | { type: 'focus-text'; text: string }
  | { type: 'session'; action: 'pause' | 'resume' | 'complete' | 'limit' }
  | { type: 'theme'; theme: string }
  | { type: 'sync' };

export interface PaletteEntry {
  /** Unique within the list. */
  id: string;
  kind: PaletteKind;
  label: string;
  /** The entry's shortcut, from the shortcut table. */
  shortcut?: ShortcutAction;
  /** A project colour as a CSS colour. */
  color?: string | null;
  command: PaletteCommand;
}

export interface PaletteData {
  /** Every project (Go to) with whether it is active (Focus). */
  projects: { id: string; title: string; active: boolean; color: string | null }[];
  goals: { id: string; title: string }[];
  openTasks: { id: string; title: string; color: string | null }[];
  activeHabits: { id: string; title: string; color: string | null }[];
  themes: { id: string; name: string }[];
  /** The focus session, if one exists. */
  session: { paused: boolean } | null;
  syncConnected: boolean;
}

/** All entries, in the order they are shown without a search: create, screens, session, focus, pages, themes, sync. */
export function buildEntries(data: PaletteData): PaletteEntry[] {
  const entries: PaletteEntry[] = [
    { id: 'new-task', kind: 'Create', label: 'New task', shortcut: 'new-task', command: { type: 'sheet', sheet: 'task' } },
    { id: 'new-project', kind: 'Create', label: 'New project', command: { type: 'sheet', sheet: 'project' } },
    { id: 'new-goal', kind: 'Create', label: 'New goal', command: { type: 'sheet', sheet: 'goal' } },
    { id: 'new-habit', kind: 'Create', label: 'New habit', command: { type: 'sheet', sheet: 'habit' } },
    { id: 'new-area', kind: 'Create', label: 'New area', command: { type: 'sheet', sheet: 'area' } },
    { id: 'log-work', kind: 'Create', label: 'Log work', shortcut: 'log-work', command: { type: 'sheet', sheet: 'log' } },
    { id: 'go-home', kind: 'Go to', label: 'Home', shortcut: 'go-home', command: { type: 'screen', screen: 'home' } },
    { id: 'go-plan', kind: 'Go to', label: 'Plan', shortcut: 'go-plan', command: { type: 'screen', screen: 'plan' } },
    { id: 'go-review', kind: 'Go to', label: 'Review', shortcut: 'go-review', command: { type: 'screen', screen: 'review' } },
    { id: 'go-stats', kind: 'Go to', label: 'Stats', shortcut: 'go-stats', command: { type: 'screen', screen: 'stats' } },
    { id: 'go-settings', kind: 'Go to', label: 'Settings', shortcut: 'go-settings', command: { type: 'screen', screen: 'settings' } },
  ];
  if (data.session) {
    entries.push(
      data.session.paused
        ? { id: 'resume', kind: 'Session', label: 'Resume', shortcut: 'focus-toggle', command: { type: 'session', action: 'resume' } }
        : { id: 'pause', kind: 'Session', label: 'Pause', shortcut: 'focus-toggle', command: { type: 'session', action: 'pause' } },
      { id: 'complete', kind: 'Session', label: 'Complete', shortcut: 'focus-complete', command: { type: 'session', action: 'complete' } },
      { id: 'limit', kind: 'Session', label: 'Set time limit', shortcut: 'focus-limit', command: { type: 'session', action: 'limit' } },
    );
  }
  for (const task of data.openTasks) {
    entries.push({
      id: `focus-task-${task.id}`,
      kind: 'Focus',
      label: `Focus: ${task.title}`,
      color: task.color,
      command: { type: 'focus', target: { taskId: task.id } },
    });
  }
  for (const habit of data.activeHabits) {
    entries.push({
      id: `focus-habit-${habit.id}`,
      kind: 'Focus',
      label: `Focus: ${habit.title}`,
      color: habit.color,
      command: { type: 'focus', target: { habitId: habit.id } },
    });
  }
  for (const project of data.projects.filter((p) => p.active)) {
    entries.push({
      id: `focus-project-${project.id}`,
      kind: 'Focus',
      label: `Focus: ${project.title}`,
      color: project.color,
      command: { type: 'focus', target: { projectId: project.id } },
    });
  }
  for (const project of data.projects) {
    entries.push({
      id: `project-${project.id}`,
      kind: 'Go to',
      label: project.title,
      color: project.color,
      command: { type: 'page', page: 'project', id: project.id },
    });
  }
  for (const goal of data.goals) {
    entries.push({ id: `goal-${goal.id}`, kind: 'Go to', label: goal.title, command: { type: 'page', page: 'goal', id: goal.id } });
  }
  for (const task of data.openTasks) {
    entries.push({
      id: `task-${task.id}`,
      kind: 'Go to',
      label: task.title,
      color: task.color,
      command: { type: 'page', page: 'task', id: task.id },
    });
  }
  for (const theme of data.themes) {
    entries.push({ id: `theme-${theme.id}`, kind: 'Theme', label: `Theme: ${theme.name}`, command: { type: 'theme', theme: theme.id } });
  }
  if (data.syncConnected) entries.push({ id: 'sync', kind: 'Sync', label: 'Sync now', command: { type: 'sync' } });
  return entries;
}

export const MAX_SHOWN = 50;

/**
 * The entries whose label contains every typed word (ignoring case), at most 50, then, for any typed text,
 * "Focus: <text>" last (it starts like Home's focus field).
 */
export function filterEntries(entries: PaletteEntry[], query: string): PaletteEntry[] {
  const text = query.trim();
  if (!text) return entries.slice(0, MAX_SHOWN);
  const words = text.toLowerCase().split(/\s+/);
  const matches = entries.filter((entry) => {
    const label = entry.label.toLowerCase();
    return words.every((word) => label.includes(word));
  });
  const free: PaletteEntry = { id: 'focus-text', kind: 'Focus', label: `Focus: ${text}`, command: { type: 'focus-text', text } };
  return [...matches.slice(0, MAX_SHOWN - 1), free];
}
