import { useEffect, useState, type ReactNode } from 'react';
import { useLiveQuery } from '../../core/db/live.ts';
import { navigate, useRoute } from '../../core/routing/useRoute.ts';
import { getTimer } from '../../features/timer/data/timer-repository.ts';
import { CommandPalette } from '../../features/palette/CommandPalette.tsx';
import { useOpenAppSheet } from './AppSheets.tsx';
import { matchShortcut, type KeyInput, type ShortcutScope } from './keys.ts';
import { screenHandler, type ScreenMatch } from './screen-keys.ts';
import { focusFieldRequest } from './requests.ts';
import { ShortcutOverlay } from './ShortcutOverlay.tsx';

/** Where a key event happened, as `matchShortcut` needs it. */
export function keyInput(event: KeyboardEvent): KeyInput {
  const target = event.target instanceof Element ? event.target : null;
  const field = target?.closest('input, textarea, select, [contenteditable=""], [contenteditable="true"], [role="combobox"]');
  const toggle = field instanceof HTMLInputElement && ['checkbox', 'radio', 'button', 'submit', 'range'].includes(field.type);
  return {
    key: event.key,
    shiftKey: event.shiftKey,
    ctrlKey: event.ctrlKey,
    altKey: event.altKey,
    metaKey: event.metaKey,
    editable: field !== null && field !== undefined && !toggle,
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
  const scope: ShortcutScope = route.name === 'focus' ? 'focus' : route.name === 'home' ? 'home' : 'global';
  const hasSession = session !== undefined;

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
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
        case 'new-task':
          return openSheet('task');
        case 'log-work':
          return openSheet('log');
        case 'focus-field':
          if (hasSession) return navigate({ name: 'focus' });
          navigate({ name: 'home' });
          return focusFieldRequest.request();
        case 'go-home':
          return navigate({ name: 'home' });
        case 'go-plan':
          return navigate({ name: 'plan' });
        case 'go-review':
          return navigate({ name: 'review' });
        case 'go-settings':
          return navigate({ name: 'settings' });
        case 'overlay':
          return setOverlay(true);
        case 'palette':
          return setPalette(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [openSheet, scope, hasSession]);

  return (
    <>
      {children}
      {overlay && <ShortcutOverlay onClose={() => setOverlay(false)} />}
      {palette && <CommandPalette onClose={() => setPalette(false)} />}
    </>
  );
}
