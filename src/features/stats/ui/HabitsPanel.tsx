import { ChevronDown, ChevronRight, Repeat } from 'lucide-react';
import { useState } from 'react';
import { addDays } from '../../../core/dates/today.ts';
import { formatDate } from '../../../core/dates/format.ts';
import { EmptyState } from '../../../core/ui/components/EmptyState.tsx';
import { Section } from '../../../core/ui/components/Section.tsx';
import { weekStartOf } from '../../habits/domain/habits.ts';
import { habitDayStates } from '../../habits/domain/streaks.ts';
import { formatDuration } from '../../work-log/domain/work-log.ts';
import type { StatsDetail } from '../data/detail-loader.ts';
import { habitStatsRows, type HabitStatsRow } from '../domain/habit-stats.ts';
import { periodRange, type Period } from '../domain/period.ts';
import { calendarRange } from '../domain/work-calendar.ts';
import { DayCalendar, type CellInfo } from './DayCalendar.tsx';
import styles from './HabitsPanel.module.css';

const count = (n: number, unit: 'days' | 'weeks') => `${n} ${n === 1 ? unit.slice(0, -1) : unit}`;

function HabitCalendar({ row, detail, period, today }: { row: HabitStatsRow; detail: StatsDetail; period: Period; today: string }) {
  const habit = detail.habitRows.habits.find((h) => h.id === row.id);
  if (!habit) return null;
  const shown = periodRange(period, today, detail.allStart);
  const grid = period.kind === 'all' ? calendarRange(period, today) : { start: weekStartOf(shown.start), end: addDays(weekStartOf(shown.end), 6) };
  const checks = detail.habitRows.checks.filter((c) => c.habitId === row.id).map((c) => c.date);
  const states = habitDayStates(habit, checks, grid.start, grid.end, today);
  const cell = (date: string): CellInfo => {
    if (date > today) return { tone: 'blank' };
    const state = states.get(date) ?? 'neutral';
    return {
      tone: state === 'neutral' ? 'none' : state,
      title: `${formatDate(date)} · ${state === 'neutral' ? 'not counted' : state}`,
      dim: date < shown.start || date > shown.end,
    };
  };
  return <DayCalendar start={grid.start} end={grid.end} label={`Check-ins of ${row.title}`} cell={cell} />;
}

/** Every active habit with its streaks, adherence and time in the period; a habit opens its calendar. */
export function HabitsPanel({ detail, period, today }: { detail: StatsDetail; period: Period; today: string }) {
  const [open, setOpen] = useState<string | null>(null);
  const rows = habitStatsRows(detail.habitRows, period, today, detail.allStart);
  return (
    <Section tile title="Habits" count={rows.length || undefined}>
      {rows.length === 0 ? (
        <EmptyState icon={Repeat} text="No active habits" />
      ) : (
        <ul className={styles.list}>
          {rows.map((row) => {
            const expanded = open === row.id;
            return (
              <li key={row.id}>
                <button type="button" className={styles.row} aria-expanded={expanded} onClick={() => setOpen(expanded ? null : row.id)}>
                  {expanded ? <ChevronDown aria-hidden="true" /> : <ChevronRight aria-hidden="true" />}
                  <span className={styles.title}>{row.title}</span>
                  <span className={styles.figure}>{count(row.streak.current, row.streak.unit)}</span>
                  <span className={styles.note}>best {count(row.streak.best, row.streak.unit)}</span>
                  <span className={styles.figure}>{row.share === null ? '–' : `${row.kept} / ${row.expected} · ${row.share} %`}</span>
                  <span className={styles.note}>{row.minutes > 0 ? formatDuration(row.minutes) : '–'}</span>
                </button>
                {expanded && (
                  <div className={styles.calendar}>
                    <HabitCalendar row={row} detail={detail} period={period} today={today} />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Section>
  );
}
