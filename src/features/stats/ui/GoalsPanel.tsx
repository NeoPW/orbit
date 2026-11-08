import { Target } from 'lucide-react';
import { useMemo, type CSSProperties } from 'react';
import { formatDate } from '../../../core/dates/format.ts';
import { navigate } from '../../../core/routing/useRoute.ts';
import { EmptyState } from '../../../core/ui/components/EmptyState.tsx';
import { Section } from '../../../core/ui/components/Section.tsx';
import { goalColor } from '../../../core/ui/colors.ts';
import type { StatsDetail } from '../data/detail-loader.ts';
import { goalStatsRows, type GoalStatsRow, type Projection } from '../domain/goal-stats.ts';
import type { Period } from '../domain/period.ts';
import styles from './GoalsPanel.module.css';

const W = 120;
const H = 28;

/** Progress over the period as a small line, 0–100 % from bottom to top. */
function Sparkline({ series, title }: { series: GoalStatsRow['series']; title: string }) {
  const points = series.flatMap((p, i) =>
    p.value === null ? [] : [{ x: series.length === 1 ? W / 2 : 3 + (i / (series.length - 1)) * (W - 6), y: H - 3 - (p.value / 100) * (H - 6), label: p.bucket.label, value: p.value }],
  );
  return (
    <svg className={styles.spark} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Progress of ${title}`}>
      {points.length > 1 && <polyline className={styles.line} points={points.map((p) => `${p.x},${p.y}`).join(' ')} />}
      {points.map((p) => (
        <circle key={p.label} className={styles.dot} cx={p.x} cy={p.y} r="2">
          <title>{`${p.label}: ${p.value} %`}</title>
        </circle>
      ))}
    </svg>
  );
}

const days = (n: number) => `${n} ${n === 1 ? 'day' : 'days'}`;

function projectionText(projection: Projection): { text: string; behind: boolean } {
  switch (projection.kind) {
    case 'complete':
      return { text: 'Complete', behind: false };
    case 'early':
      return { text: 'Too early to tell', behind: false };
    case 'stalled':
      return { text: 'No progress lately', behind: false };
    case 'date': {
      const { date, daysVsDeadline: d } = projection;
      const against = d === null ? '' : d < 0 ? ` · ${days(-d)} before the deadline` : d === 0 ? ' · on the deadline' : ` · ${days(d)} after the deadline`;
      return { text: `Projected ${formatDate(date)}${against}`, behind: d !== null && d > 0 };
    }
  }
}

/** Active goals with their progress, change, progress over the period and projected finish. */
export function GoalsPanel({ detail, period, today }: { detail: StatsDetail; period: Period; today: string }) {
  const rows = useMemo(() => goalStatsRows(detail.goalRows, period, today, detail.firstUse), [detail, period, today]);
  const order = detail.goalRows.goals;
  return (
    <Section tile title="Goals" count={rows.length || undefined}>
      {rows.length === 0 ? (
        <EmptyState icon={Target} text="No active goals" />
      ) : (
        <ul className={styles.list}>
          {rows.map((row) => {
            const projection = row.projection ? projectionText(row.projection) : null;
            const color = goalColor({ color: row.color }, order.findIndex((g) => g.id === row.id));
            return (
              <li key={row.id}>
                <button type="button" className={styles.row} onClick={() => navigate({ name: 'goal', id: row.id })}>
                  <span className={styles.title}>
                    <span className={styles.swatch} style={{ '--item-color': color } as CSSProperties} />
                    {row.title}
                  </span>
                  {row.hasMeasures ? (
                    <>
                      <span className={styles.progress}>{row.progress === null ? '–' : `${row.progress} %`}</span>
                      <span className={styles.change}>{row.change === null ? '' : `${row.change > 0 ? '+' : '−'}${Math.abs(row.change)} pp`}</span>
                      <Sparkline series={row.series} title={row.title} />
                      <span className={`${styles.projection} ${projection?.behind ? styles.behind : ''}`}>{projection?.text}</span>
                    </>
                  ) : (
                    <span className={styles.none}>No measures</span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </Section>
  );
}
