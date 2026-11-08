import { ChartNoAxesCombined, ChevronLeft, ChevronRight } from 'lucide-react';
import { useToday } from '../../../core/dates/today.ts';
import { navigate, useRoute } from '../../../core/routing/useRoute.ts';
import { IconButton } from '../../../core/ui/components/Button.tsx';
import { EmptyState } from '../../../core/ui/components/EmptyState.tsx';
import { PageHeader } from '../../../core/ui/components/PageHeader.tsx';
import { SegmentedControl } from '../../../core/ui/components/SegmentedControl.tsx';
import { formatDuration } from '../../work-log/domain/work-log.ts';
import type { PeriodStats } from '../data/period-loader.ts';
import {
  canStepForward,
  currentPeriod,
  PERIOD_KINDS,
  parsePeriod,
  periodLabel,
  stepPeriod,
  switchKind,
  type Period,
  type PeriodKind,
} from '../domain/period.ts';
import styles from './StatsScreen.module.css';
import { GoalsPanel } from './GoalsPanel.tsx';
import { HabitsPanel } from './HabitsPanel.tsx';
import { TasksPanel } from './TasksPanel.tsx';
import { TimePanels } from './TimePanels.tsx';
import { TrendChart, type ChartPoint } from './TrendChart.tsx';
import { usePeriodStats } from './usePeriodStats.ts';
import { useStatsDetail } from './useStatsDetail.ts';
import { HeatmapPanel, WorkCalendarPanel } from './WorkPanels.tsx';

const KIND_LABELS: Record<PeriodKind, string> = { month: 'Month', quarter: 'Quarter', year: 'Year', all: 'All time' };
const KINDS = PERIOD_KINDS.map((value) => ({ value, label: KIND_LABELS[value] }));

const time = (minutes: number) => (minutes > 0 ? formatDuration(Math.round(minutes)) : '0 min');
const signed = (n: number, unit: string) => `${n > 0 ? '+' : n < 0 ? '−' : '±'}${Math.abs(n)}${unit}`;

function Figure({ label, value, note, change }: { label: string; value: string; note?: string; change?: string | null }) {
  return (
    <div className={styles.figure}>
      <span className={styles.figureLabel}>{label}</span>
      <strong className={styles.figureValue}>{value}</strong>
      {note && <span className={styles.figureNote}>{note}</span>}
      {change && <span className={styles.figureNote}>{change}</span>}
    </div>
  );
}

function Figures({ stats }: { stats: PeriodStats }) {
  const { headline: h, comparison: c, period } = stats;
  const previous = stepPeriod(period, -1);
  const against = (text: string | null) => (text && previous ? `${text} vs ${periodLabel(previous)}` : null);
  return (
    <div className={styles.figures}>
      <Figure label="Time worked" value={time(h.minutes)} />
      <Figure
        label="Daily average"
        value={time(h.dailyAverageMinutes)}
        change={against(c.dailyAverage === null ? null : signed(c.dailyAverage, ' %'))}
      />
      <Figure
        label="Review score"
        value={h.score === null ? '–' : h.score.toFixed(1)}
        note={h.weeks > 0 ? `${h.reviewedWeeks} of ${h.weeks} weeks reviewed` : undefined}
        change={against(c.score === null ? null : signed(c.score, ''))}
      />
      <Figure
        label="Habits"
        value={h.habitShare === null ? '–' : `${h.habitKept} / ${h.habitExpected}`}
        note={h.habitShare === null ? undefined : `${h.habitShare} % kept`}
        change={against(c.habitShare === null ? null : signed(c.habitShare, ' pp'))}
      />
      <Figure
        label="On goals"
        value={h.goalShare === null ? '–' : `${h.goalShare} %`}
        note={h.goalShare === null ? undefined : time(h.goalMinutes)}
        change={against(c.goalShare === null ? null : signed(c.goalShare, ' pp'))}
      />
    </div>
  );
}

function Trends({ stats }: { stats: PeriodStats }) {
  const point = (p: PeriodStats['trend'][number], value: number | null, text: string): ChartPoint => ({
    label: p.bucket.label,
    value,
    soFar: p.bucket.soFar && value !== null,
    title: `${p.bucket.label}: ${text}`,
  });
  const hours = stats.trend.map((p) => point(p, p.minutes, time(p.minutes)));
  const score = stats.trend.map((p) => point(p, p.score, p.score === null ? '–' : p.score.toFixed(1)));
  const habits = stats.trend.map((p) => point(p, p.habitShare, p.habitShare === null ? '–' : `${p.habitShare} %`));
  const goals = stats.trend.map((p) => point(p, p.goalShare, p.goalShare === null ? '–' : `${p.goalShare} %`));
  const percent = (v: number) => `${v} %`;
  return (
    <div className={styles.trends}>
      <TrendChart title="Hours worked" points={hours} format={(v) => time(v)} />
      <TrendChart title="Review score" points={score} max={10} format={(v) => String(v)} />
      <TrendChart title="Habit adherence" points={habits} max={100} format={percent} />
      <TrendChart title="On goals" points={goals} max={100} format={percent} />
    </div>
  );
}

export function StatsScreen() {
  const today = useToday();
  const route = useRoute();
  const period = parsePeriod(route.name === 'stats' ? route.period : undefined, today);
  const stats = usePeriodStats(period);
  const detail = useStatsDetail(period);
  const initial = currentPeriod('month', today).key;

  function show(next: Period) {
    navigate({ name: 'stats', period: next.key === initial ? undefined : next.key });
  }
  const previous = stepPeriod(period, -1);
  const next = stepPeriod(period, 1);

  return (
    <div className={styles.page}>
      <PageHeader
        title="Stats"
        meta={<span>{periodLabel(period)}</span>}
        actions={
          <div className={styles.picker}>
            <SegmentedControl label="Period" options={KINDS} value={period.kind} onChange={(kind) => show(switchKind(period, kind, today))} />
            <IconButton label="Previous period" icon={<ChevronLeft />} disabled={previous === null} onClick={() => previous && show(previous)} />
            <IconButton
              label="Next period"
              icon={<ChevronRight />}
              disabled={!canStepForward(period, today)}
              onClick={() => next && show(next)}
            />
          </div>
        }
      />
      {stats &&
        (stats.headline.empty ? (
          <EmptyState icon={ChartNoAxesCombined} text="Nothing to show for this period yet" />
        ) : (
          <div className={styles.content}>
            <Figures stats={stats} />
            <Trends stats={stats} />
            {detail && (
              <>
                <WorkCalendarPanel detail={detail} period={period} today={today} />
                <HeatmapPanel detail={detail} period={period} today={today} />
                <TimePanels detail={detail} period={period} today={today} />
                <GoalsPanel detail={detail} period={period} today={today} />
                <TasksPanel detail={detail} period={period} today={today} />
                <HabitsPanel detail={detail} period={period} today={today} />
              </>
            )}
          </div>
        ))}
    </div>
  );
}
