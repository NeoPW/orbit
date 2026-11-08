import { useEffect, useRef } from 'react';
import { useServices } from '../../../app/services.ts';
import { localToday } from '../../../core/dates/deadline.ts';
import { msUntilMidnight } from '../../../core/dates/today.ts';
import { useLiveQuery } from '../../../core/db/live.ts';
import { SCHEMA_VERSION } from '../../../core/db/version.ts';
import {
  clearOngoingNotification,
  notificationsAllowed,
  requestNotificationPermission,
  scheduleAndroidReminders,
  showOngoingNotification,
} from '../../../platform/notify.ts';
import { useSettings } from '../../settings/data/settings.ts';
import { readState } from '../../sync/data/state.ts';
import { useSync } from '../../sync/ui/SyncRunner.tsx';
import { getTimerView } from '../../timer/data/timer-view.ts';
import { loadReminderInput } from '../data/reminder-input.ts';
import { ANDROID_PLAN_DAYS, ongoingText, phoneReminders } from '../domain/android-plan.ts';
import { planReminders } from '../domain/plan-reminders.ts';
import { notifyPermissionChanged } from './notification-permission.ts';

const DEBOUNCE_MS = 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * On Android: hands the reminders of the next 7 days to the system (replacing the earlier ones) whenever something
 * changes, asks for the notification permission while reminders are on, and keeps the ongoing focus notification.
 * Renders nothing.
 */
export function AndroidReminderRunner(): null {
  const { db, driver, onWrite } = useServices();
  const { settings, loaded } = useSettings();
  const { dataVersion } = useSync();
  const run = useRef<() => void>(() => {});

  useEffect(() => {
    if (!loaded) return;
    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const plan = async () => {
      const now = new Date();
      const [input, sync, allowed] = await Promise.all([loadReminderInput(db, localToday(now)), readState(driver), notificationsAllowed()]);
      if (!active) return;
      const server = sync.url && sync.token ? { url: sync.url, token: sync.token, schemaVersion: SCHEMA_VERSION } : null;
      const list = allowed ? phoneReminders(planReminders(input, settings, now, new Date(now.getTime() + ANDROID_PLAN_DAYS * DAY_MS))) : [];
      await scheduleAndroidReminders(list, server);
    };
    run.current = () => {
      clearTimeout(timer);
      timer = setTimeout(() => void plan().catch(() => {}), DEBOUNCE_MS);
    };
    run.current();
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [db, driver, settings, loaded, dataVersion]);

  // Ask for the permission at start and whenever reminders are switched on; then plan again.
  const remindersOn = loaded && settings.remindersOn;
  useEffect(() => {
    if (!remindersOn) return;
    void requestNotificationPermission()
      .then(() => {
        notifyPermissionChanged();
        run.current();
      })
      .catch(() => {});
  }, [remindersOn]);

  useEffect(() => {
    const stopWrites = onWrite(() => run.current());
    const onVisible = () => {
      if (document.visibilityState === 'visible') run.current();
    };
    document.addEventListener('visibilitychange', onVisible);
    let midnight: ReturnType<typeof setTimeout>;
    const armMidnight = () => {
      midnight = setTimeout(
        () => {
          run.current();
          armMidnight();
        },
        msUntilMidnight(new Date()) + 50,
      );
    };
    armMidnight();
    return () => {
      stopWrites();
      document.removeEventListener('visibilitychange', onVisible);
      clearTimeout(midnight);
    };
  }, [onWrite]);

  // The ongoing focus notification follows the session (also when it changes through a sync).
  const view = useLiveQuery(getTimerView, []);
  useEffect(() => {
    if (view === undefined) return;
    if (view === null) void clearOngoingNotification().catch(() => {});
    else {
      const { title, body } = ongoingText({ ...view.timer, title: view.title });
      void showOngoingNotification(title, body).catch(() => {});
    }
  }, [view]);

  return null;
}
