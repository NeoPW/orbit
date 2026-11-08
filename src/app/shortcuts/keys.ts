/** The shortcuts of the app (see openspec keyboard-shortcuts): one table for matching, the overlay, tooltips and the palette. */

export type GlobalAction =
  'new-task' | 'log-work' | 'focus-field' | 'go-home' | 'go-plan' | 'go-review' | 'go-stats' | 'go-settings' | 'go-back' | 'overlay' | 'palette';
export type TodoAction =
  | 'todo-next'
  | 'todo-prev'
  | 'habit-prev'
  | 'habit-next'
  | 'todo-start'
  | 'todo-complete'
  | 'todo-open'
  | 'todo-select-n'
  | 'habit-select-n'
  | 'session-pause'
  | 'session-resume'
  | 'session-complete';
export type FocusAction =
  'focus-toggle' | 'focus-complete' | 'focus-leave' | 'focus-discard' | 'focus-limit' | 'focus-limit-up' | 'focus-limit-down';
export type ShortcutAction = GlobalAction | TodoAction | FocusAction;

/** Where the keys are pressed: screen keys win over global ones there. */
export type ShortcutScope = 'global' | 'home' | 'focus' | 'detail';

export interface Shortcut {
  action: ShortcutAction;
  /** As shown to the user, e.g. `Shift+P`. */
  keys: string;
  label: string;
  group: 'Global' | 'Home' | 'Focus mode';
}

export const SHORTCUTS: Shortcut[] = [
  { action: 'new-task', keys: 'T', label: 'New task', group: 'Global' },
  { action: 'log-work', keys: 'L', label: 'Log work', group: 'Global' },
  { action: 'focus-field', keys: 'F', label: 'Focus field (focus mode while a session runs)', group: 'Global' },
  { action: 'go-home', keys: 'Shift+H', label: 'Home', group: 'Global' },
  { action: 'go-plan', keys: 'Shift+P', label: 'Plan', group: 'Global' },
  { action: 'go-review', keys: 'Shift+R', label: 'Review', group: 'Global' },
  { action: 'go-stats', keys: 'Shift+S', label: 'Stats', group: 'Global' },
  { action: 'go-settings', keys: 'Ctrl+,', label: 'Settings', group: 'Global' },
  { action: 'go-back', keys: 'Esc', label: 'Back from a project, goal or task page', group: 'Global' },
  { action: 'palette', keys: 'Ctrl+K', label: 'Command palette', group: 'Global' },
  { action: 'overlay', keys: '?', label: 'All shortcuts', group: 'Global' },
  { action: 'todo-next', keys: 'J / ↓', label: 'Next task', group: 'Home' },
  { action: 'todo-prev', keys: 'K / ↑', label: 'Previous task', group: 'Home' },
  { action: 'habit-prev', keys: '←', label: 'Previous habit', group: 'Home' },
  { action: 'habit-next', keys: '→', label: 'Next habit', group: 'Home' },
  { action: 'todo-select-n', keys: '1–9', label: 'Highlight the 1st–9th task', group: 'Home' },
  { action: 'habit-select-n', keys: 'Shift+1–9', label: 'Highlight the 1st–9th habit', group: 'Home' },
  { action: 'todo-start', keys: 'Space', label: 'Start focus on the highlighted task or habit', group: 'Home' },
  { action: 'todo-complete', keys: 'X', label: 'Complete the task / check the habit', group: 'Home' },
  { action: 'todo-open', keys: 'Enter', label: 'Open the task / check the habit', group: 'Home' },
  { action: 'session-pause', keys: 'P', label: 'Pause the running session', group: 'Home' },
  { action: 'session-resume', keys: 'R', label: 'Resume the paused session', group: 'Home' },
  { action: 'session-complete', keys: 'C', label: 'Complete the session', group: 'Home' },
  { action: 'focus-toggle', keys: 'Space', label: 'Pause / resume', group: 'Focus mode' },
  { action: 'focus-complete', keys: 'Enter', label: 'Complete', group: 'Focus mode' },
  { action: 'focus-leave', keys: 'Esc', label: 'Leave focus mode', group: 'Focus mode' },
  { action: 'focus-discard', keys: 'Delete', label: 'Discard', group: 'Focus mode' },
  { action: 'focus-limit', keys: 'L', label: 'Time limit', group: 'Focus mode' },
  { action: 'focus-limit-up', keys: '+', label: 'Limit 5 minutes longer', group: 'Focus mode' },
  { action: 'focus-limit-down', keys: '−', label: 'Limit 5 minutes shorter', group: 'Focus mode' },
];

/** `label (keys)` for a tooltip, e.g. "New task (T)". */
export function withShortcut(label: string, action: ShortcutAction): string {
  const shortcut = SHORTCUTS.find((s) => s.action === action);
  return shortcut ? `${label} (${shortcut.keys})` : label;
}

/** The key event and where it happened, as plain data. */
export interface KeyInput {
  key: string;
  /** The physical key (`Digit1`), for Shift+digits whose character depends on the layout. */
  code?: string;
  shiftKey: boolean;
  ctrlKey: boolean;
  altKey: boolean;
  metaKey: boolean;
  /** The target is a text field, text area, dropdown or editable element. */
  editable: boolean;
  /** A dialog, sheet, menu or the palette is open. */
  dialogOpen: boolean;
  /** The target is a button or link, which handles Space and Enter itself. */
  onControl: boolean;
}

export interface ShortcutMatch {
  action: ShortcutAction;
  /** For `todo-select-n` and `habit-select-n`: 0 for key 1. */
  index?: number;
}

const GLOBAL_KEYS: Record<string, GlobalAction> = {
  t: 'new-task',
  l: 'log-work',
  f: 'focus-field',
  'shift+h': 'go-home',
  'shift+p': 'go-plan',
  'shift+r': 'go-review',
  'shift+s': 'go-stats',
};

const TODO_KEYS: Record<string, TodoAction> = {
  j: 'todo-next',
  arrowdown: 'todo-next',
  k: 'todo-prev',
  arrowup: 'todo-prev',
  arrowleft: 'habit-prev',
  arrowright: 'habit-next',
  ' ': 'todo-start',
  x: 'todo-complete',
  enter: 'todo-open',
  p: 'session-pause',
  r: 'session-resume',
  c: 'session-complete',
};

const FOCUS_KEYS: Record<string, FocusAction> = {
  ' ': 'focus-toggle',
  enter: 'focus-complete',
  escape: 'focus-leave',
  delete: 'focus-discard',
  l: 'focus-limit',
  '+': 'focus-limit-up',
  '-': 'focus-limit-down',
  '−': 'focus-limit-down',
};

/**
 * The action a key press triggers in `scope`, or null. Nothing fires while typing, while a dialog is open or with
 * Ctrl/Alt/Meta held, except Ctrl+K and Ctrl+, (also from a field, not over a dialog). Space and Enter on a button or link keep
 * their own meaning.
 */
export function matchShortcut(input: KeyInput, scope: ShortcutScope): ShortcutMatch | null {
  const key = input.key.toLowerCase();
  if ((input.ctrlKey || input.metaKey) && !input.altKey && !input.shiftKey && key === 'k') {
    return input.dialogOpen ? null : { action: 'palette' };
  }
  if ((input.ctrlKey || input.metaKey) && !input.altKey && !input.shiftKey && key === ',') {
    return input.dialogOpen ? null : { action: 'go-settings' };
  }
  if (input.ctrlKey || input.altKey || input.metaKey) return null;
  if (input.editable || input.dialogOpen) return null;
  if (input.onControl && (key === ' ' || key === 'enter')) return null;

  // Symbols come with Shift on most layouts, so they match whatever Shift says.
  if (key === '?') return { action: 'overlay' };
  const named = (input.shiftKey && key.length === 1 && /[a-z]/.test(key) ? 'shift+' : '') + key;

  if (scope === 'focus') {
    const action = FOCUS_KEYS[key] ?? (input.shiftKey ? undefined : FOCUS_KEYS[named]);
    if (action) return { action };
  }
  if (scope === 'detail' && key === 'escape') return { action: 'go-back' };
  if (scope === 'home') {
    if (!input.shiftKey && /^[1-9]$/.test(key)) return { action: 'todo-select-n', index: Number(key) - 1 };
    const digit = /^Digit([1-9])$/.exec(input.code ?? '');
    if (input.shiftKey && digit) return { action: 'habit-select-n', index: Number(digit[1]) - 1 };
    const action = TODO_KEYS[named];
    if (action) return { action };
  }
  const action = GLOBAL_KEYS[named];
  return action ? { action } : null;
}
