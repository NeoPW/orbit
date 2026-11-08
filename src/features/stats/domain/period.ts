import { addDays } from '../../../core/dates/today.ts';
import { weekStartOf } from '../../habits/domain/habits.ts';
import { formatWeek } from '../../review/domain/review-week.ts';

export type PeriodKind = 'month' | 'quarter' | 'year' | 'all';

/** A calendar period; `key` is the address value: `2026-11`, `2026-Q4`, `2026` or `all`. */
export interface Period {
  kind: PeriodKind;
  key: string;
}

export const PERIOD_KINDS: PeriodKind[] = ['month', 'quarter', 'year', 'all'];

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const pad = (n: number) => String(n).padStart(2, '0');
const ALL: Period = { kind: 'all', key: 'all' };

const monthPeriod = (y: number, m: number): Period => ({ kind: 'month', key: `${y}-${pad(m)}` });
const quarterPeriod = (y: number, q: number): Period => ({ kind: 'quarter', key: `${y}-Q${q}` });
const yearPeriod = (y: number): Period => ({ kind: 'year', key: String(y) });

function ymd(date: string): { y: number; m: number } {
  const [y, m] = date.split('-').map(Number);
  return { y: y ?? 0, m: m ?? 1 };
}

/** The current period of a kind. */
export function currentPeriod(kind: PeriodKind, today: string): Period {
  const { y, m } = ymd(today);
  if (kind === 'month') return monthPeriod(y, m);
  if (kind === 'quarter') return quarterPeriod(y, Math.ceil(m / 3));
  if (kind === 'year') return yearPeriod(y);
  return ALL;
}

/** First and last day of a period, the first cut at the first-use date. "all" starts there. Not capped at today. */
function fullRange(period: Period, today: string, firstUse: string | null): { start: string; end: string } {
  if (period.kind === 'all') return { start: firstUse ?? today, end: today };
  const range = calendarRange(period);
  return { start: firstUse && firstUse > range.start ? firstUse : range.start, end: range.end };
}

/** First and last day of a month, quarter or year. */
function calendarRange(period: Period): { start: string; end: string } {
  const y = Number(period.key.slice(0, 4));
  if (period.kind === 'year') return { start: `${y}-01-01`, end: `${y}-12-31` };
  if (period.kind === 'quarter') {
    const q = Number(period.key.slice(-1));
    const first = (q - 1) * 3 + 1;
    return { start: `${y}-${pad(first)}-01`, end: monthEnd(y, first + 2) };
  }
  const m = Number(period.key.slice(5, 7));
  return { start: `${y}-${pad(m)}-01`, end: monthEnd(y, m) };
}

function monthEnd(y: number, m: number): string {
  return new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10);
}

/** The period of an address value; invalid or future values give the current month. */
export function parsePeriod(value: string | undefined, today: string): Period {
  const fallback = currentPeriod('month', today);
  if (!value) return fallback;
  let period: Period | null = null;
  let m: RegExpExecArray | null;
  if (value === 'all') period = ALL;
  else if ((m = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(value))) period = monthPeriod(Number(m[1]), Number(m[2]));
  else if ((m = /^(\d{4})-Q([1-4])$/.exec(value))) period = quarterPeriod(Number(m[1]), Number(m[2]));
  else if ((m = /^(\d{4})$/.exec(value))) period = yearPeriod(Number(m[1]));
  if (!period) return fallback;
  return period.kind !== 'all' && fullRange(period, today, null).start > today ? fallback : period;
}

/** "November 2026", "Q4 2026", "2026" or "All time". */
export function periodLabel(period: Period): string {
  if (period.kind === 'all') return 'All time';
  if (period.kind === 'year') return period.key;
  if (period.kind === 'quarter') return `${period.key.slice(-2)} ${period.key.slice(0, 4)}`;
  return `${MONTHS[Number(period.key.slice(5, 7)) - 1]} ${period.key.slice(0, 4)}`;
}

/** The previous (-1) or next (+1) period of the same kind; null for "all". */
export function stepPeriod(period: Period, delta: 1 | -1): Period | null {
  const y = Number(period.key.slice(0, 4));
  if (period.kind === 'year') return yearPeriod(y + delta);
  if (period.kind === 'quarter') {
    const index = y * 4 + (Number(period.key.slice(-1)) - 1) + delta;
    return quarterPeriod(Math.floor(index / 4), (index % 4) + 1);
  }
  if (period.kind === 'month') {
    const index = y * 12 + (Number(period.key.slice(5, 7)) - 1) + delta;
    return monthPeriod(Math.floor(index / 12), (index % 12) + 1);
  }
  return null;
}

/** Whether ‹ is available: the previous period does not end before the first-use date. */
export function canStepBack(period: Period, firstUse: string | null): boolean {
  const previous = stepPeriod(period, -1);
  return previous !== null && (firstUse === null || calendarRange(previous).end >= firstUse);
}

/** Whether › is available: there is a later period that has started. */
export function canStepForward(period: Period, today: string): boolean {
  const next = stepPeriod(period, 1);
  return next !== null && fullRange(next, today, null).start <= today;
}

/** The period of `kind` that contains the start of `period`, or the current one when `period` is the current period. */
export function switchKind(period: Period, kind: PeriodKind, today: string): Period {
  if (kind === 'all') return ALL;
  if (period.kind === 'all') return currentPeriod(kind, today);
  const { start, end } = fullRange(period, today, null);
  if (start <= today && today <= end) return currentPeriod(kind, today);
  const { y, m } = ymd(start);
  if (kind === 'month') return monthPeriod(y, m);
  if (kind === 'quarter') return quarterPeriod(y, Math.ceil(m / 3));
  return yearPeriod(y);
}

/** First and last day of the period, the last capped at today. `firstUse` is the start of "all". */
export function periodRange(period: Period, today: string, firstUse: string | null = null): { start: string; end: string } {
  const { start, end } = fullRange(period, today, firstUse);
  return { start, end: end < today ? end : today };
}

/** Days of the period up to and including today. */
export function periodDays(period: Period, today: string, firstUse: string | null = null): number {
  const { start, end } = periodRange(period, today, firstUse);
  return Math.max(0, Math.round((Date.parse(end) - Date.parse(start)) / 86_400_000) + 1);
}

/**
 * Mondays of the weeks whose Thursday falls in the period, up to the current week. Weeks before the week of the
 * first-use date are left out; the week of first use stays even when it was entered after its Thursday.
 */
export function periodWeeks(period: Period, today: string, firstUse: string | null = null): string[] {
  const all = period.kind === 'all';
  const { start, end } = all ? fullRange(period, today, firstUse) : calendarRange(period);
  const floor = firstUse ? weekStartOf(firstUse) : null;
  let monday = weekStartOf(start);
  if (!all && addDays(monday, 3) < start) monday = addDays(monday, 7);
  const weeks: string[] = [];
  for (; (all || addDays(monday, 3) <= end) && monday <= (all ? end : today); monday = addDays(monday, 7)) {
    if (floor === null || monday >= floor) weeks.push(monday);
  }
  return weeks;
}

/** The period holding a week: the one containing its Thursday. */
export function periodOfWeek(weekStart: string, kind: Exclude<PeriodKind, 'all'>): Period {
  return currentPeriod(kind, addDays(weekStart, 3));
}

export interface Bucket {
  key: string;
  /** First and last day it covers (a week Monday–Sunday, or a month). */
  start: string;
  end: string;
  label: string;
  /** The bucket holds today and is not over yet. */
  soFar: boolean;
}

const SHORT_MONTHS = MONTHS.map((n) => n.slice(0, 3));

/** Points of the trends: weeks for a month or quarter, months for a year or all time; none after today. */
export function periodBuckets(period: Period, today: string, firstUse: string | null = null): Bucket[] {
  if (period.kind === 'month' || period.kind === 'quarter') {
    return periodWeeks(period, today, firstUse).map((monday) => {
      const end = addDays(monday, 6);
      return { key: monday, start: monday, end, label: formatWeek(monday), soFar: end >= today };
    });
  }
  const { start, end } = periodRange(period, today, firstUse);
  const first = ymd(start);
  const last = ymd(end);
  const buckets: Bucket[] = [];
  for (let index = first.y * 12 + first.m - 1; index <= last.y * 12 + last.m - 1; index += 1) {
    const y = Math.floor(index / 12);
    const m = (index % 12) + 1;
    const monthLast = monthEnd(y, m);
    const label = period.kind === 'all' ? `${SHORT_MONTHS[m - 1]} ${String(y).slice(2)}` : (SHORT_MONTHS[m - 1] ?? '');
    buckets.push({ key: `${y}-${pad(m)}`, start: `${y}-${pad(m)}-01`, end: monthLast, label, soFar: monthLast >= today });
  }
  return buckets;
}

