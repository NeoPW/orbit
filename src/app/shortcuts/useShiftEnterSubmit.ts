import { useEffect } from 'react';
import { isFormSubmitKey } from './keys.ts';

/** Shift+Enter saves the form the cursor is in (see openspec keyboard-shortcuts), from any field including text areas. */
export function useShiftEnterSubmit(): void {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (!isFormSubmitKey(event) || !(event.target instanceof Element)) return;
      const form = event.target.closest('form');
      if (!form) return;
      const button = form.querySelector<HTMLButtonElement>('button[type=submit]:not(:disabled)');
      if (!button) return;
      event.preventDefault();
      form.requestSubmit(button);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);
}
