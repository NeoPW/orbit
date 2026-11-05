import { useEffect, useRef } from 'react';
import { localToday } from '../../../core/dates/deadline.ts';
import { msUntilMidnight } from '../../../core/dates/today.ts';
import { showNotification } from '../../../platform/notify.ts';
import { useServices } from '../../../app/services.ts';
import { useSettings } from '../../settings/data/settings.ts';
import { useSync } from '../../sync/ui/SyncRunner.tsx';
import { loadReminderInput } from '../data/reminder-input.ts';
import { clockJumped, delayUntil, planFrom, splitDue } from '../domain/next-reminder.ts';
import { planReminders } from '../domain/plan-reminders.ts';
import { playChime } from '../sound.ts';

const WAKE_CHECK_MS = 30_000;

/** Plans the reminders of the day, keeps one timer for the next one and shows it when due. Renders nothing. */
export function ReminderRunner(): null {
  const { db, onWrite } = useServices();
  const { settings, loaded } = useSettings();
  const { dataVersion } = useSync();
  const run = useRef<() => void>(() => {});

  useEffect(() => {
    if (!loaded) return;
    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let sequence = 0;
    let lastRun = new Date();
    let shownDay = localToday();
    const shown = new Set<string>();

    const plan = async () => {
      const mine = ++sequence;
      const now = new Date();
      const today = localToday();
      if (today !== shownDay) {
        shown.clear();
        shownDay = today;
      }
      const from = planFrom(lastRun, now);
      lastRun = now;
      const until = new Date(now.getTime() + msUntilMidnight(now));
      const input = await loadReminderInput(db, today);
      if (!active || mine !== sequence) return;
      const { due, next } = splitDue(planReminders(input, settings, from, until), new Date(), shown);
      for (const reminder of due) {
        shown.add(reminder.key);
        void showNotification(reminder).catch(() => {});
        if (reminder.key.startsWith('focus:')) playChime();
      }
      clearTimeout(timer);
      if (next) timer = setTimeout(() => void plan(), delayUntil(next, new Date()));
    };

    run.current = () => void plan();
    void plan();
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [db, settings, loaded, dataVersion]);

  useEffect(() => {
    const stopWrites = onWrite(() => run.current());
    let midnight: ReturnType<typeof setTimeout>;
    const armMidnight = () => {
      midnight = setTimeout(() => {
        run.current();
        armMidnight();
      }, msUntilMidnight(new Date()) + 50);
    };
    armMidnight();
    let lastCheck = Date.now();
    const wake = setInterval(() => {
      const now = Date.now();
      if (clockJumped(lastCheck, now, WAKE_CHECK_MS)) {
        run.current();
        clearTimeout(midnight);
        armMidnight();
      }
      lastCheck = now;
    }, WAKE_CHECK_MS);
    return () => {
      stopWrites();
      clearTimeout(midnight);
      clearInterval(wake);
    };
  }, [onWrite]);

  return null;
}
