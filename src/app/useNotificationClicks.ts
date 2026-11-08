import { useEffect } from 'react';
import { parsePath } from '../core/routing/routes.ts';
import { navigate } from '../core/routing/useRoute.ts';
import { useOpenTask } from '../features/tasks/ui/TaskPopup.tsx';
import { onNotificationClick } from '../platform/notify.ts';
import { platform } from '../platform/platform.ts';

/**
 * Opens what a clicked notification points to. On the phone (no Plan there) a task opens in the task popup over
 * Home and a project opens Home; everywhere else the route opens as it is.
 */
export function useNotificationClicks(): void {
  const openTask = useOpenTask();
  useEffect(
    () =>
      onNotificationClick((path) => {
        const { route } = parsePath(path);
        if (platform === 'android' && route.name === 'task') {
          navigate({ name: 'home' });
          openTask(route.id);
        } else if (platform === 'android' && route.name === 'project') {
          navigate({ name: 'home' });
        } else {
          navigate(route);
        }
      }),
    [openTask],
  );
}

/** Renders nothing; lets the hook sit inside the providers (the task popup). */
export function NotificationClicks(): null {
  useNotificationClicks();
  return null;
}
