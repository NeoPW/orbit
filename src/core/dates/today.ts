import { useEffect, useState } from 'react';
import { localToday } from './deadline.ts';

/** Milliseconds from `now` to the next local midnight. */
export function msUntilMidnight(now: Date): number {
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return midnight.getTime() - now.getTime();
}

/** `date` (`yyyy-mm-dd`) moved by `days` calendar days, which may be negative. */
export function addDays(date: string, days: number): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(date);
  if (!match) throw new Error(`Not a calendar date: ${date}`);
  const moved = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]) + days));
  return moved.toISOString().slice(0, 10);
}

/** Today's local date (`yyyy-mm-dd`); changes at local midnight, and on focus and visibility when the date changed. */
export function useToday(): string {
  const [today, setToday] = useState(() => localToday());

  useEffect(() => {
    const update = () => setToday(localToday());
    let timer: ReturnType<typeof setTimeout>;
    const arm = () => {
      timer = setTimeout(() => {
        update();
        arm();
      }, msUntilMidnight(new Date()) + 50);
    };
    arm();
    const onVisible = () => {
      if (document.visibilityState === 'visible') update();
    };
    window.addEventListener('focus', update);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('focus', update);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  return today;
}

/** The current time, updated every `intervalMs`. Use it only where something counts live. */
export function useNow(intervalMs: number): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);
  return now;
}
