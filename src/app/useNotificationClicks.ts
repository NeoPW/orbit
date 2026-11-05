import { useEffect } from 'react';
import { onNotificationClick } from '../platform/notify.ts';

/** Opens the page a clicked desktop notification points to. */
export function useNotificationClicks(): void {
  useEffect(
    () =>
      onNotificationClick((route) => {
        if (window.location.pathname !== route) window.history.pushState(null, '', route);
        window.dispatchEvent(new Event('orbit:navigate'));
      }),
    [],
  );
}
