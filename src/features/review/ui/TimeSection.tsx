import { useState, type CSSProperties } from 'react';
import { navigate } from '../../../core/routing/useRoute.ts';
import { SegmentedControl } from '../../../core/ui/components/SegmentedControl.tsx';
import { Section } from '../../../core/ui/components/Section.tsx';
import { formatDuration } from '../../work-log/domain/work-log.ts';
import { formatWeek, formatWeekRange } from '../domain/review-week.ts';
import type { RecentWeeks, TimeGrouping, TimeItem, WeekTime } from '../domain/week-time.ts';
import styles from './TimeSection.module.css';

const GROUPINGS: { value: TimeGrouping; label: string }[] = [
  { value: 'area', label: 'Area' },
  { value: 'goal', label: 'Goal' },
  { value: 'project', label: 'Project' },
];

const duration = (minutes: number) => (minutes > 0 ? formatDuration(minutes) : '0 min');

function Bars({ items, grouping }: { items: TimeItem[]; grouping: TimeGrouping }) {
  if (items.length === 0) return <p className={styles.empty}>No time logged</p>;
  const max = Math.max(...items.map((i) => i.minutes));
  return (
    <ul className={styles.bars}>
      {items.map((item) => (
        <li key={item.id ?? 'other'} style={{ '--item-color': item.color ?? 'var(--color-text-faint)' } as CSSProperties}>
          {item.id !== null && grouping !== 'area' ? (
            <button type="button" className={styles.link} onClick={() => navigate({ name: grouping, id: item.id! })}>
              {item.title}
            </button>
          ) : (
            <span className={styles.itemTitle}>{item.title}</span>
          )}
          <div className={styles.track}>
            <div className={styles.fill} style={{ width: `${(item.minutes / max) * 100}%` }} />
          </div>
          <span className={styles.itemTime}>{duration(item.minutes)}</span>
        </li>
      ))}
    </ul>
  );
}

const W = 640;
const H = 168;
const BASE = 116;
const TOP = 10;

function TrendChart({ trend }: { trend: RecentWeeks }) {
  const max = Math.max(1, ...trend.weeks.map((w) => Math.max(w.minutes, w.average ?? 0)));
  const slot = W / trend.weeks.length;
  const y = (minutes: number) => BASE - (minutes / max) * (BASE - TOP);
  const points = trend.weeks.flatMap((w, i) => (w.average === null ? [] : [{ x: i * slot + slot / 2, y: y(w.average) }]));
  return (
    <svg className={styles.chart} viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Time worked in the recent weeks">
      <line x1="0" x2={W} y1={BASE} y2={BASE} className={styles.axis} />
      {trend.weeks.map((w, i) => {
        const x = i * slot + slot / 2;
        return (
          <g key={w.weekStart}>
            <rect
              x={x - 20}
              y={y(w.minutes)}
              width="40"
              height={BASE - y(w.minutes)}
              rx="3"
              className={w.shown ? styles.barShown : styles.barOther}
            >
              <title>{`${formatWeek(w.weekStart)} (${formatWeekRange(w.weekStart)}): ${duration(w.minutes)}`}</title>
            </rect>
            <text x={x} y={BASE + 16} textAnchor="middle" className={w.shown ? styles.labelStrong : styles.label}>
              {duration(w.minutes)}
            </text>
            <text x={x} y={BASE + 31} textAnchor="middle" className={styles.labelFaint}>
              {formatWeek(w.weekStart)}
            </text>
            {w.current && (
              <text x={x} y={BASE + 45} textAnchor="middle" className={styles.labelFaint}>
                so far
              </text>
            )}
          </g>
        );
      })}
      {points.length > 1 && <polyline points={points.map((p) => `${p.x},${p.y}`).join(' ')} className={styles.line} />}
      {points.map((p) => (
        <circle key={p.x} cx={p.x} cy={p.y} r="3" className={styles.dot} />
      ))}
    </svg>
  );
}

/** "Time by": the week's time grouped by area, goal or project. */
export function TimeByPanel({ time, title = 'Time by' }: { time: Pick<WeekTime, 'byArea' | 'byGoal' | 'byProject'>; title?: string }) {
  const [grouping, setGrouping] = useState<TimeGrouping>('area');
  const items = grouping === 'area' ? time.byArea : grouping === 'goal' ? time.byGoal : time.byProject;
  return (
    <Section
      tile
      title={title}
      actions={<SegmentedControl label="Group time by" options={GROUPINGS} value={grouping} onChange={setGrouping} />}
    >
      <Bars items={items} grouping={grouping} />
    </Section>
  );
}

/** "Recent weeks": the 8 weeks up to the shown one with the 4-week average. */
export function TrendPanel({ trend }: { trend: RecentWeeks }) {
  return (
    <Section
      tile
      title="Recent weeks"
      actions={
        <span className={styles.statNote}>
          4-week average <strong className={styles.headline}>{duration(trend.headline)}</strong>
        </span>
      }
    >
      <TrendChart trend={trend} />
    </Section>
  );
}
