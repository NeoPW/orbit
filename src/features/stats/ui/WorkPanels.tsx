import { formatDate } from '../../../core/dates/format.ts';
import { Section } from '../../../core/ui/components/Section.tsx';
import { WEEKDAY_NAMES } from '../../habits/domain/habits.ts';
import { formatDuration } from '../../work-log/domain/work-log.ts';
import type { StatsDetail } from '../data/detail-loader.ts';
import { periodRange, type Period } from '../domain/period.ts';
import { dailyMinutes, intensity, weekdayHourMinutes } from '../domain/work-calendar.ts';
import { DayCalendar, type CellInfo } from './DayCalendar.tsx';
import styles from './WorkPanels.module.css';

const duration = (minutes: number) => (minutes > 0 ? formatDuration(Math.round(minutes)) : 'no work');

/** A full year of days shaded by the time worked; the shown period is emphasised. */
export function WorkCalendarPanel({ detail, period, today }: { detail: StatsDetail; period: Period; today: string }) {
  const { start, end } = detail.range;
  const days = dailyMinutes(detail.entries, start, end);
  const max = Math.max(0, ...days.values());
  const shown = periodRange(period, today, detail.firstUse);
  const cell = (date: string): CellInfo => {
    if (date > today) return { tone: 'blank' };
    const minutes = days.get(date) ?? 0;
    const step = intensity(minutes, max);
    return {
      tone: step === 0 ? 'none' : (`s${step}` as 's1' | 's2' | 's3' | 's4'),
      title: `${formatDate(date)} · ${duration(minutes)}`,
      dim: date < shown.start || date > shown.end,
    };
  };
  return (
    <Section tile title="Work calendar">
      <DayCalendar start={start} end={end} label="Time worked on each day of the year" cell={cell} />
    </Section>
  );
}

/** Weekdays by hours of the day, shaded by the time worked in the shown period. */
export function HeatmapPanel({ detail, period, today }: { detail: StatsDetail; period: Period; today: string }) {
  const { start, end } = periodRange(period, today, detail.firstUse);
  const grid = weekdayHourMinutes(detail.entries, start, end);
  const max = Math.max(0, ...grid.flat());
  return (
    <Section tile title="When you work">
      <div className={styles.heatmap} role="img" aria-label="Time worked by weekday and hour of the day">
        <span />
        {Array.from({ length: 24 }, (_, hour) => (
          <span key={hour} className={styles.hour}>
            {hour % 3 === 0 ? hour : ''}
          </span>
        ))}
        {grid.map((row, day) => [
          <span key={`d${day}`} className={styles.day}>
            {WEEKDAY_NAMES[day]}
          </span>,
          ...row.map((minutes, hour) => (
            <span
              key={`${day}-${hour}`}
              className={`${styles.cell} ${styles[`s${intensity(minutes, max)}`]}`}
              title={`${WEEKDAY_NAMES[day]} ${String(hour).padStart(2, '0')}:00 · ${duration(minutes)}`}
            />
          )),
        ])}
      </div>
    </Section>
  );
}
