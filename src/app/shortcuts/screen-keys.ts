import { useEffect } from 'react';
import type { FocusAction, ShortcutMatch, TodoAction } from './keys.ts';

export type ScreenMatch = ShortcutMatch & { action: TodoAction | FocusAction };
export type ScreenHandler = (match: ScreenMatch) => void;

let current: ScreenHandler | null = null;

/** The handler of the screen that is shown (Home, focus mode), or null. */
export function screenHandler(): ScreenHandler | null {
  return current;
}

/** Lets the shown screen handle its own keys; the shortcut provider still decides which key is which. */
export function useScreenShortcuts(handler: ScreenHandler): void {
  // Registered after every render, so the handler always sees the latest state.
  useEffect(() => {
    current = handler;
    return () => {
      if (current === handler) current = null;
    };
  });
}
