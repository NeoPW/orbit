import { useMemo } from 'react';
import { Section } from '../../../core/ui/components/Section.tsx';
import type { StatsDetail } from '../data/detail-loader.ts';
import type { Period } from '../domain/period.ts';
import { formatTimeToDone, taskFigures, taskTrend } from '../domain/task-stats.ts';
import styles from './StatsScreen.module.css';
import { TrendChart } from './TrendChart.tsx';

function Figure({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.figure}>
      <span className={styles.figureLabel}>{label}</span>
      <strong className={styles.figureValue}>{value}</strong>
    </div>
  );
}

/** Tasks completed and created in the period, the median time to done and tasks completed per week or month. */
export function TasksPanel({ detail, period, today }: { detail: StatsDetail; period: Period; today: string }) {
  const figures = useMemo(() => taskFigures(detail.links.tasks, period, today, detail.allStart), [detail, period, today]);
  const trend = useMemo(() => taskTrend(detail.links.tasks, period, today, detail.allStart), [detail, period, today]);
  const points = trend.map((p) => ({
    label: p.bucket.label,
    value: p.completed,
    soFar: p.bucket.soFar,
    title: `${p.bucket.label}: ${p.completed} ${p.completed === 1 ? 'task' : 'tasks'}`,
  }));
  return (
    <Section tile title="Tasks">
      <div className={styles.figures}>
        <Figure label="Completed" value={String(figures.completed)} />
        <Figure label="Created" value={String(figures.created)} />
        <Figure label="Median time to done" value={figures.medianMinutes === null ? '–' : formatTimeToDone(figures.medianMinutes)} />
      </div>
      <div className={styles.inlineChart}>
        <TrendChart bare title="Tasks completed" points={points} format={(v) => String(v)} />
      </div>
    </Section>
  );
}
