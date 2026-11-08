import { useEffect, useState } from 'react';
import { notificationsAllowed } from '../../../platform/notify.ts';
import { platform } from '../../../platform/platform.ts';

type Listener = () => void;
const listeners = new Set<Listener>();

/** Tells `useNotificationPermission` users to read the permission again (after asking for it). */
export function notifyPermissionChanged(): void {
  for (const listener of [...listeners]) listener();
}

/** Whether the phone may show notifications: null while unknown, always true off Android. Read again on resume. */
export function useNotificationPermission(): boolean | null {
  const [allowed, setAllowed] = useState<boolean | null>(platform === 'android' ? null : true);
  useEffect(() => {
    if (platform !== 'android') return;
    let active = true;
    const read = () =>
      void notificationsAllowed()
        .then((value) => {
          if (active) setAllowed(value);
        })
        .catch(() => {});
    const onVisible = () => {
      if (document.visibilityState === 'visible') read();
    };
    read();
    listeners.add(read);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      active = false;
      listeners.delete(read);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);
  return allowed;
}
