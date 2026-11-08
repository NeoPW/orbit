import { Section } from '../../../core/ui/components/Section.tsx';
import styles from './StatsScreen.module.css';

export interface ChartPoint {
  /** Axis label of the week or month. */
  label: string;
  /** Null: no point, and the line breaks there. */
  value: number | null;
  /** The current, unfinished week or month. */
  soFar: boolean;
  /** Hover text. */
  title: string;
}

const W = 440;
const H = 150;
const LEFT = 8;
const RIGHT = 8;
const TOP = 12;
const BASE = 104;

/** Runs of consecutive points with a value, each drawn as its own line. */
function segments(points: { x: number; y: number | null }[]): { x: number; y: number }[][] {
  const runs: { x: number; y: number }[][] = [];
  let run: { x: number; y: number }[] = [];
  for (const p of points) {
    if (p.y === null) {
      if (run.length > 0) runs.push(run);
      run = [];
    } else run.push({ x: p.x, y: p.y });
  }
  if (run.length > 0) runs.push(run);
  return runs;
}

/** A small line chart over weeks or months: gaps break the line, the current week or month is marked "so far". */
export function TrendChart({
  title,
  points,
  max,
  format,
}: {
  title: string;
  points: ChartPoint[];
  /** Top of the scale; the highest value when missing. */
  max?: number;
  format: (value: number) => string;
}) {
  const top = max ?? Math.max(1, ...points.map((p) => p.value ?? 0));
  const slot = (W - LEFT - RIGHT) / Math.max(1, points.length);
  const xs = points.map((_, i) => LEFT + i * slot + slot / 2);
  const y = (value: number) => BASE - (Math.min(value, top) / top) * (BASE - TOP);
  const placed = points.map((p, i) => ({ x: xs[i] ?? 0, y: p.value === null ? null : y(p.value) }));
  const every = Math.ceil(points.length / 13);
  const hasValue = points.some((p) => p.value !== null);
  return (
    <Section tile title={title}>
      <svg className={styles.chart} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={title}>
        <line x1={LEFT} x2={W - RIGHT} y1={BASE} y2={BASE} className={styles.axis} />
        <line x1={LEFT} x2={W - RIGHT} y1={TOP} y2={TOP} className={styles.grid} />
        <text x={W - RIGHT} y={TOP - 3} textAnchor="end" className={styles.labelFaint}>
          {format(top)}
        </text>
        {segments(placed).map((run) => (
          <polyline key={run[0]?.x} points={run.map((p) => `${p.x},${p.y}`).join(' ')} className={styles.line} />
        ))}
        {points.map((p, i) => (
          <g key={i}>
            {p.value !== null && (
              <circle cx={xs[i]} cy={y(p.value)} r="3.5" className={p.soFar ? styles.dotSoFar : styles.dot}>
                <title>{p.title}</title>
              </circle>
            )}
            {i % every === 0 && (
              <text x={xs[i]} y={BASE + 16} textAnchor="middle" className={styles.label}>
                {p.label}
              </text>
            )}
            {p.soFar && (
              <text x={xs[i]} y={BASE + 30} textAnchor="middle" className={styles.labelFaint}>
                so far
              </text>
            )}
          </g>
        ))}
      </svg>
      {!hasValue && <p className={styles.chartEmpty}>Nothing to show</p>}
    </Section>
  );
}
