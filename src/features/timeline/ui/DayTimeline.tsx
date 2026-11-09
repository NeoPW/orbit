import { useOpenTask } from '../../tasks/ui/TaskPopup.tsx';
import { NotebookPen } from 'lucide-react';
import { useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { navigate } from '../../../core/routing/useRoute.ts';
import { EmptyState } from '../../../core/ui/components/EmptyState.tsx';
import { axisFor, layoutDay, type Placed } from '../domain/day-timeline.ts';
import type { TimelineItem, TimelineTarget } from '../data/timeline-loader.ts';
import styles from './DayTimeline.module.css';

export interface TimelineDay {
  /** Local date, `yyyy-mm-dd`. */
  date: string;
  /** Heading above the column (the week view); the one-day view has none. */
  heading?: string;
  items: TimelineItem[];
}

export interface DayTimelineProps {
  days: TimelineDay[];
  /** The current time: moves the now line and the end of the running block. */
  now: Date;
  /** Today's local date, to place the now line; no line when none of the days is today. */
  today: string;
  /** Pixels per hour: about 48 for Home, 28 for the week. */
  hourHeight: number;
  /** Accessible name. */
  label: string;
  /** Shown over the axis when no day has any work (the Home tile). */
  emptyText?: string;
  emptyAction?: ReactNode;
  /** Height of the scrolling area in pixels; the whole axis when omitted. */
  maxHeight?: number;
}

/** Width of the strip at a column's left edge that holds the dots. */
const DOT_STRIP = 12;
/** Height of one line of block text; a block is never lower. */
const LINE_PX = 20;
/** A block this high also has room for its project and times. */
const TWO_LINES_PX = 34;
const pad = (n: number) => String(n).padStart(2, '0');
const clockText = (date: Date) => `${pad(date.getHours())}:${pad(date.getMinutes())}`;

function openTarget(target: TimelineTarget, openTask: (id: string) => void) {
  if ('taskId' in target) openTask(target.taskId);
  else if ('projectId' in target) navigate({ name: 'project', id: target.projectId });
  else navigate({ name: 'goal', id: target.goalId });
}

function describe(item: TimelineItem): string {
  if (item.kind === 'marker')
    return `${item.label}, ${clockText(item.start)}${item.note && item.note !== item.label ? `, ${item.note}` : ''}`;
  const times = `${clockText(item.start)}–${clockText(item.end)}`;
  return `${item.label}, ${times}, ${item.minutes} min${item.running ? ', running' : ''}${item.note ? `, ${item.note}` : ''}`;
}

interface Tip {
  item: TimelineItem;
  top: number;
  left: number;
}

/**
 * The work of one day (Home) or of several days on a shared hour axis (the review), as blocks
 * tinted in their project's colour. A view only: clicking a block opens what it belongs to.
 */
export function DayTimeline({ days, now, today, hourHeight, label, emptyText, emptyAction, maxHeight }: DayTimelineProps) {
  const openTask = useOpenTask();
  const [tip, setTip] = useState<Tip | null>(null);
  const scroller = useRef<HTMLDivElement>(null);

  const pxPerMin = hourHeight / 60;
  const minBlockMinutes = Math.ceil(LINE_PX / pxPerMin);
  const placedDays = useMemo(
    () =>
      days.map((day) => {
        // A running block grows with the clock.
        const items = day.items.map((item) => (item.running ? { ...item, end: now > item.start ? now : item.start } : item));
        return { day, placed: layoutDay(items, day.date, minBlockMinutes) };
      }),
    [days, now, minBlockMinutes],
  );
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const hasToday = days.some((d) => d.date === today);
  const axis = useMemo(() => {
    const base = axisFor(placedDays.map((d) => d.placed));
    // The now line must be on the axis.
    return hasToday
      ? {
          startHour: Math.min(base.startHour, Math.floor(nowMin / 60)),
          endHour: Math.max(base.endHour, Math.ceil((nowMin + 1) / 60)),
        }
      : base;
  }, [placedDays, hasToday, nowMin]);

  const hours = Array.from({ length: axis.endHour - axis.startHour }, (_, i) => axis.startHour + i);
  const height = hours.length * hourHeight;
  const y = (minutes: number) => (minutes - axis.startHour * 60) * pxPerMin;
  const empty = placedDays.every((d) => d.placed.length === 0);

  // Bring the first work (or now, without work) into view once the data is there.
  const firstItemMin = Math.min(...placedDays.flatMap((d) => d.placed.map((p) => p.startMin)));
  const scrollTo = Number.isFinite(firstItemMin) ? firstItemMin : hasToday ? nowMin : null;
  const scrollKey = Number.isFinite(firstItemMin) ? firstItemMin : -1;
  useLayoutEffect(() => {
    const el = scroller.current;
    if (!el || scrollTo === null) return;
    el.scrollTop = Math.max(0, y(scrollTo) - hourHeight);
    // Only when the first item or the axis changes, not on every minute.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [axis.startHour, axis.endHour, hourHeight, scrollKey]);

  function showTip(item: TimelineItem, element: HTMLElement) {
    const rect = element.getBoundingClientRect();
    setTip({
      item,
      top: rect.top,
      left: Math.min(rect.right + 8, window.innerWidth - 240),
    });
  }

  function renderBlock(p: Placed<TimelineItem>) {
    const { item } = p;
    const color = item.color ?? 'var(--color-text-muted)';
    const isDot = item.kind === 'marker';
    const height = Math.max(LINE_PX, (p.endMin - p.startMin) * pxPerMin - 1);
    const usable = `(100% - ${DOT_STRIP}px)`;
    const style = {
      '--c': color,
      top: y(p.startMin),
      ...(isDot
        ? {}
        : { height, left: `calc(${DOT_STRIP}px + ${usable} * ${p.lane / p.lanes})`, width: `calc(${usable} / ${p.lanes} - 1px)` }),
    } as CSSProperties;
    const detail = [`${clockText(item.start)}–${clockText(item.end)}`, item.projectName !== item.label ? item.projectName : null]
      .filter(Boolean)
      .join(' · ');
    const content = isDot ? null : (
      <>
        <span className={styles.blockLabel}>{item.label}</span>
        {height >= TWO_LINES_PX && <span className={styles.blockDetail}>{detail}</span>}
        {item.running && <span className="visually-hidden">(running)</span>}
      </>
    );
    const className = [isDot ? styles.dot : styles.block, item.running ? styles.running : '', item.target ? styles.clickable : ''].join(
      ' ',
    );
    const events = {
      onMouseEnter: (e: React.MouseEvent<HTMLElement>) => showTip(item, e.currentTarget),
      onMouseLeave: () => setTip(null),
    };
    if (!item.target) {
      return (
        <div
          key={item.id}
          className={className}
          style={style}
          tabIndex={0}
          aria-label={describe(item)}
          {...events}
          onFocus={(e) => showTip(item, e.currentTarget)}
          onBlur={() => setTip(null)}
        >
          {content}
        </div>
      );
    }
    const target = item.target;
    return (
      <button
        key={item.id}
        type="button"
        className={className}
        style={style}
        aria-label={describe(item)}
        {...events}
        onFocus={(e) => showTip(item, e.currentTarget)}
        onBlur={() => setTip(null)}
        onClick={() => openTarget(target, openTask)}
      >
        {content}
      </button>
    );
  }

  return (
    <div className={styles.timeline} role="group" aria-label={label}>
      {placedDays.some((d) => d.day.heading) && (
        <div className={styles.headings}>
          <span className={styles.gutter} aria-hidden="true" />
          {placedDays.map(({ day }) => (
            <span key={day.date} className={`${styles.heading} ${day.date === today ? styles.todayHeading : ''}`}>
              {day.heading}
            </span>
          ))}
        </div>
      )}
      <div ref={scroller} className={styles.scroller} style={maxHeight ? { maxHeight } : undefined}>
        <div className={styles.body} style={{ height }}>
          <div className={styles.axis} aria-hidden="true">
            {hours.map((hour) => (
              <span key={hour} className={styles.hour} style={{ top: (hour - axis.startHour) * hourHeight }}>
                {pad(hour)}:00
              </span>
            ))}
          </div>
          <div className={styles.columns}>
            {hours.map((hour) => (
              <span key={hour} className={styles.gridLine} style={{ top: (hour - axis.startHour) * hourHeight }} aria-hidden="true" />
            ))}
            {placedDays.map(({ day, placed }) => {
              return (
                <div key={day.date} className={styles.column} data-date={day.date}>
                  {placed.map(renderBlock)}
                  {day.date === today && (
                    <span className={styles.nowLine} style={{ top: y(nowMin) }} role="img" aria-label={`Now, ${clockText(now)}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
        {empty && emptyText && (
          <div className={styles.empty}>
            <EmptyState icon={NotebookPen} text={emptyText} action={emptyAction} />
          </div>
        )}
      </div>
      {tip && (
        <div role="tooltip" className={styles.tip} style={{ top: tip.top, left: tip.left }}>
          <strong>{tip.item.label}</strong>
          <span>
            {tip.item.kind === 'block'
              ? `${clockText(tip.item.start)}–${clockText(tip.item.end)} · ${tip.item.minutes} min`
              : clockText(tip.item.start)}
            {tip.item.running ? ' · running' : ''}
          </span>
          {tip.item.note && tip.item.note !== tip.item.label && <span>{tip.item.note}</span>}
        </div>
      )}
    </div>
  );
}
