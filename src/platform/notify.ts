import { platform } from './platform.ts';

export interface DesktopNotification {
  title: string;
  body: string;
  /** App path opened when the notification is clicked, for example `/focus`. */
  route: string;
}

const CLICK_EVENT = 'notification-clicked';

/** Shows a system notification on the desktop; does nothing in the browser. */
export async function showNotification({ title, body, route }: DesktopNotification): Promise<void> {
  if (platform !== 'desktop') return;
  const { invoke } = await import('@tauri-apps/api/core');
  await invoke('show_notification', { title, body, route });
}

/** Calls `handler` with the route of a clicked notification. Returns the unsubscribe function. */
export function onNotificationClick(handler: (route: string) => void): () => void {
  if (platform !== 'desktop') return () => {};
  let active = true;
  let unlisten: (() => void) | undefined;
  void import('@tauri-apps/api/event')
    .then(({ listen }) => listen<string>(CLICK_EVENT, (event) => handler(event.payload)))
    .then((stop) => {
      if (active) unlisten = stop;
      else stop();
    });
  return () => {
    active = false;
    unlisten?.();
  };
}
