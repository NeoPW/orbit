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
  if (platform === 'android') return onAndroidTap(handler);
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

// --- Android: the app's own `reminders` plugin (src-tauri/src/reminders.rs and the Kotlin RemindersPlugin) ---

/** What the phone asks the sync server when a reminder is due (see sync-server, "Reminder check"). */
export type ReminderCheck = { kind: 'habit'; id: string; date: string } | { kind: 'task'; id: string } | { kind: 'project'; id: string };

export interface AndroidReminder {
  id: number;
  /** Epoch milliseconds. */
  at: number;
  title: string;
  body: string;
  route: string;
  /** Null shows it without asking (the end of a focus session). */
  check: ReminderCheck | null;
}

export interface ReminderServer {
  url: string;
  token: string;
  schemaVersion: number;
}

async function reminders<T>(command: string, payload?: unknown): Promise<T> {
  const { invoke } = await import('@tauri-apps/api/core');
  return invoke<T>(`plugin:reminders|${command}`, payload === undefined ? {} : { payload });
}

/** Replaces all reminders scheduled on the phone. Does nothing elsewhere. */
export async function scheduleAndroidReminders(list: AndroidReminder[], server: ReminderServer | null): Promise<void> {
  if (platform !== 'android') return;
  await reminders('schedule', { reminders: list, server });
}

/** Shows or updates the ongoing focus notification on the phone. */
export async function showOngoingNotification(title: string, body: string): Promise<void> {
  if (platform !== 'android') return;
  await reminders('show_ongoing', { title, body });
}

export async function clearOngoingNotification(): Promise<void> {
  if (platform !== 'android') return;
  await reminders('clear_ongoing');
}

/** Whether the phone may show notifications (always true elsewhere). */
export async function notificationsAllowed(): Promise<boolean> {
  if (platform !== 'android') return true;
  return (await reminders<{ granted: boolean }>('permission_state')).granted;
}

/** Asks Android for the notification permission when it is missing; resolves to whether it is granted. */
export async function requestNotificationPermission(): Promise<boolean> {
  if (platform !== 'android') return true;
  return (await reminders<{ granted: boolean }>('request_permission')).granted;
}

/** The listener that gets a tapped route: the latest one (React mounts effects twice in development). */
let tapListener: ((route: string) => void) | null = null;
/** A tapped route that arrived while no listener was there. */
let missedTap: string | null = null;

function deliverTap(route: string): void {
  if (tapListener) tapListener(route);
  else missedTap = route;
}

/** Taps on the phone: the route of the notification that opened or resumed the app, read at start and on resume. */
function onAndroidTap(handler: (route: string) => void): () => void {
  tapListener = handler;
  const take = () => {
    void reminders<{ route?: string | null }>('take_launch_route')
      .then(({ route }) => {
        if (route) deliverTap(route);
      })
      .catch(() => {});
  };
  if (missedTap) {
    const route = missedTap;
    missedTap = null;
    queueMicrotask(() => deliverTap(route));
  }
  const onVisible = () => {
    if (document.visibilityState === 'visible') take();
  };
  take();
  document.addEventListener('visibilitychange', onVisible);
  return () => {
    if (tapListener === handler) tapListener = null;
    document.removeEventListener('visibilitychange', onVisible);
  };
}
