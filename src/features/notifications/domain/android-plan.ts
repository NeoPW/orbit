import type { PlannedReminder, ReminderTarget } from './plan-reminders.ts';

/** How far ahead the phone schedules its reminders with Android (see notifications, "Reminders on Android"). */
export const ANDROID_PLAN_DAYS = 7;

/** Ids 1–9 are the plugin's own (1 is the ongoing focus notification). */
const FIRST_REMINDER_ID = 10;

/** A stable positive 31-bit id for a reminder key (FNV-1a), never one of the reserved ids. */
export function reminderId(key: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < key.length; i++) {
    hash ^= key.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  const id = hash & 0x7fffffff;
  return id < FIRST_REMINDER_ID ? id + FIRST_REMINDER_ID : id;
}

export interface PhoneReminder {
  id: number;
  /** Epoch milliseconds. */
  at: number;
  title: string;
  body: string;
  route: string;
  /** Asked of the server before showing; null shows it without asking (the end of a focus session). */
  check: ReminderTarget | null;
}

/** The planned reminders as the phone schedules them: without the weekly review (not on the phone). */
export function phoneReminders(planned: PlannedReminder[]): PhoneReminder[] {
  return planned
    .filter((r) => !r.key.startsWith('review:'))
    .map((r) => ({ id: reminderId(r.key), at: r.at.getTime(), title: r.title, body: r.body, route: r.route, check: r.target ?? null }));
}

const pad = (n: number) => String(n).padStart(2, '0');

/** The ongoing focus notification: what the session runs for and "Running since HH:mm" or "Paused · N min". */
export function ongoingText(session: { title: string; startedAt: string; pausedAt: string | null; workedSeconds: number }): {
  title: string;
  body: string;
} {
  if (session.pausedAt !== null) return { title: session.title, body: `Paused · ${Math.floor(session.workedSeconds / 60)} min` };
  const start = new Date(session.startedAt);
  return { title: session.title, body: `Running since ${pad(start.getHours())}:${pad(start.getMinutes())}` };
}
