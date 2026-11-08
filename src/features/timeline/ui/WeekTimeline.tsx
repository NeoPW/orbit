import { useNow, useToday, addDays } from '../../../core/dates/today.ts';
import { formatDuration } from '../../work-log/domain/work-log.ts';
import { useLiveQuery } from '../../../core/db/live.ts';
import { loadTimeline } from '../data/timeline-loader.ts';
import { localRange } from '../domain/day-timeline.ts';
import { DayTimeline } from './DayTimeline.tsx';

const DAYS = 7;

function heading(date: string): string {
  return new Date(`${date}T12:00:00`).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' });
}

export interface WeekTimelineProps {
  weekStart: string;
  /** Minutes worked per day, Monday to Sunday, shown in each day's heading. */
  dayMinutes?: number[];
  /** Height of the scrolling area in pixels; the whole axis when left out. */
  maxHeight?: number;
}

/** The work of each day of the week starting on `weekStart` (Monday), seven columns on one hour axis. */
export function WeekTimeline({ weekStart, dayMinutes, maxHeight }: WeekTimelineProps) {
  const today = useToday();
  const now = useNow(60000);
  const items = useLiveQuery(
    (db) => {
      const { from, to } = localRange(weekStart, addDays(weekStart, DAYS));
      return loadTimeline(db, from, to);
    },
    [weekStart],
  );
  const dates = Array.from({ length: DAYS }, (_, i) => addDays(weekStart, i));
  const localDay = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const days = dates.map((date, i) => ({
    date,
    heading: dayMinutes?.[i] ? `${heading(date)} · ${formatDuration(dayMinutes[i] ?? 0)}` : heading(date),
    // An item belongs to every day it touches (a block over midnight shows in both).
    items: (items ?? []).filter((item) => localDay(item.start) <= date && localDay(item.end) >= date),
  }));
  return <DayTimeline days={days} now={now} today={today} hourHeight={28} label="Work by day" maxHeight={maxHeight} />;
}
