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

function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className={styles.stat}>
      <span className={styles.statLabel}>{label}</span>
      <span className={styles.statValue}>{value}</span>
      {note && <span className={styles.statNote}>{note}</span>}
    </div>
  );
}

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
const H = 190;
const BASE = 130;
const TOP = 16;

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

export interface TimeSectionProps {
  time: WeekTime;
  trend: RecentWeeks;
}

/** The week's time: the three figures, the time by area, goal or project, and the recent weeks. */
export function TimeSection({ time, trend }: TimeSectionProps) {
  const [grouping, setGrouping] = useState<TimeGrouping>('area');
  const items = grouping === 'area' ? time.byArea : grouping === 'goal' ? time.byGoal : time.byProject;
  return (
    <Section tile title="Time">
      <div className={styles.section}>
        <div className={styles.stats}>
          <Stat
            label="Time worked"
            value={
              time.targetMinutes === null ? duration(time.totalMinutes) : `${duration(time.totalMinutes)} / ${duration(time.targetMinutes)}`
            }
            note={time.targetShare === null ? undefined : `${time.targetShare} % of target`}
          />
          <Stat label="Daily average" value={duration(time.dailyAverageMinutes)} />
          {time.goalShare !== null && (
            <Stat
              label="Time on goals"
              value={`${time.goalShare} %`}
              note={`${duration(time.goalMinutes)} of ${duration(time.totalMinutes)}`}
            />
          )}
        </div>
        <div className={styles.group}>
          <SegmentedControl label="Group time by" options={GROUPINGS} value={grouping} onChange={setGrouping} />
          <Bars items={items} grouping={grouping} />
        </div>
        <div className={styles.group}>
          <div className={styles.trendHead}>
            <span className={styles.statLabel}>Recent weeks</span>
            <span className={styles.statNote}>
              <strong className={styles.headline}>{duration(trend.headline)}</strong> 4-week average per week
            </span>
          </div>
          <TrendChart trend={trend} />
        </div>
      </div>
    </Section>
  );
}
