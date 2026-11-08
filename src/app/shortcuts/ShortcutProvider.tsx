import { useEffect, useState, type ReactNode } from 'react';
import { useLiveQuery } from '../../core/db/live.ts';
import { goBack, navigate, useRoute } from '../../core/routing/useRoute.ts';
import { getTimer } from '../../features/timer/data/timer-repository.ts';
import { CommandPalette } from '../../features/palette/CommandPalette.tsx';
import { useOpenAppSheet } from './AppSheets.tsx';
import { matchShortcut, type KeyInput, type ShortcutScope } from './keys.ts';
import { screenHandler, type ScreenMatch } from './screen-keys.ts';
import { focusFieldRequest, sessionRequest } from './requests.ts';
import { ShortcutOverlay } from './ShortcutOverlay.tsx';

/**
 * Esc in a text field outside a dialog or sheet leaves the field (inside one, Esc closes it as before). A field that
 * uses Esc itself, like closing its suggestions, prevents the default and keeps it.
 */
function leaveField(event: KeyboardEvent): boolean {
  if (event.key !== 'Escape' || !(event.target instanceof HTMLElement)) return false;
  const input = keyInput(event);
  if (!input.editable || event.target.closest('dialog')) return false;
  event.preventDefault();
  event.target.blur();
  return true;
}

/** A control other than a text field has the keyboard focus (shown with the focus ring), not just a mouse click's. */
function hasKeyboardFocus(): boolean {
  const active = document.activeElement;
  if (!(active instanceof HTMLElement) || active === document.body) return false;
  try {
    return active.matches(':focus-visible');
  } catch {
    return false;
  }
}

/** Where a key event happened, as `matchShortcut` needs it. */
export function keyInput(event: KeyboardEvent): KeyInput {
  const target = event.target instanceof Element ? event.target : null;
  const field = target?.closest('input, textarea, select, [contenteditable=""], [contenteditable="true"], [role="combobox"]');
  const toggle = field instanceof HTMLInputElement && ['checkbox', 'radio', 'button', 'submit', 'range'].includes(field.type);
  return {
    key: event.key,
    code: event.code,
    shiftKey: event.shiftKey,
    ctrlKey: event.ctrlKey,
    altKey: event.altKey,
    metaKey: event.metaKey,
    editable: field !== null && field !== undefined && !toggle,
    keyboardFocus: hasKeyboardFocus(),
    dialogOpen: document.querySelector('dialog[open], [role="menu"]') !== null,
    onControl:
      target?.closest('button, a[href], [role="button"], summary, input[type="checkbox"], input[type="radio"]') !== null && target !== null,
  };
}

const SCREEN_ACTIONS = new Set<string>([
  'todo-next',
  'todo-prev',
  'todo-start',
  'todo-complete',
  'todo-open',
  'habit-prev',
  'habit-next',
  'todo-select-n',
  'habit-select-n',
  'todo-clear',
  'focus-toggle',
  'focus-complete',
  'focus-leave',
  'focus-discard',
  'focus-limit',
  'focus-limit-up',
  'focus-limit-down',
]);

/** The global keyboard shortcuts, the shortcut overlay and the command palette (see openspec keyboard-shortcuts). */
export function ShortcutProvider({ children }: { children: ReactNode }) {
  const route = useRoute();
  const openSheet = useOpenAppSheet();
  const session = useLiveQuery(getTimer, []);
  const [overlay, setOverlay] = useState(false);
  const [palette, setPalette] = useState(false);
  const scope: ShortcutScope =
    route.name === 'focus'
      ? 'focus'
      : route.name === 'home'
        ? 'home'
        : route.name === 'goal' || route.name === 'project' || route.name === 'task'
          ? 'detail'
          : 'global';
  // A paused session leaves `F` to the focus field, where something else can be started.
  const running = session !== undefined && session.pausedAt === null;

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      if (leaveField(event)) return;
      const match = matchShortcut(keyInput(event), scope);
      if (!match) return;
      if (SCREEN_ACTIONS.has(match.action)) {
        const handle = screenHandler();
        if (!handle) return;
        event.preventDefault();
        handle(match as ScreenMatch);
        return;
      }
      event.preventDefault();
      switch (match.action) {
        case 'release-focus':
          return void (document.activeElement instanceof HTMLElement && document.activeElement.blur());
        case 'new-task':
          return openSheet('task');
        case 'log-work':
          return openSheet('log');
        case 'focus-field':
          if (running) return navigate({ name: 'focus' });
          navigate({ name: 'home' });
          return focusFieldRequest.request();
        case 'go-home':
          return navigate({ name: 'home' });
        case 'go-plan':
          return navigate({ name: 'plan' });
        case 'go-review':
          return navigate({ name: 'review' });
        case 'go-stats':
          return navigate({ name: 'stats' });
        case 'go-settings':
          return navigate({ name: 'settings' });
        case 'session-pause':
          if (running) sessionRequest.request('pause');
          return;
        case 'session-resume':
          // Only a paused session resumes; a request without a session would wait for the next panel.
          if (session && session.pausedAt !== null) sessionRequest.request('resume');
          return;
        case 'session-complete':
          if (session) sessionRequest.request('complete');
          return;
        case 'go-back':
          return goBack({ name: 'plan' });
        case 'overlay':
          return setOverlay(true);
        case 'palette':
          return setPalette(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [openSheet, scope, running, session]);

  return (
    <>
      {children}
      {overlay && <ShortcutOverlay onClose={() => setOverlay(false)} />}
      {palette && <CommandPalette onClose={() => setPalette(false)} />}
    </>
  );
}
