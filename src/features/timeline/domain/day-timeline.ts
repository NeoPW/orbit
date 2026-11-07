/** Pure layout of a day's work on an hour axis (see openspec day-timeline). Times are the local clock. */

/** Blocks shorter than this are drawn at this length (their true times stay in the tooltip). */
/** Default shortest drawn block; the view passes the minutes that make one line of text fit. */
export const MIN_BLOCK_MINUTES = 15;
export const DEFAULT_START_HOUR = 6;
export const DEFAULT_END_HOUR = 22;

export interface TimeSpan {
  /** A marker has no duration and takes no lane. */
  kind: 'block' | 'marker';
  start: Date;
  end: Date;
}

/**
 * When the work of a log entry happened. A timer entry logs its start, so it runs from
 * `occurredAt`; any other entry is logged after the work, so it ends at `occurredAt`.
 * Without a duration both times are `occurredAt` (a marker).
 */
export function blockTimes(entry: { source: string; occurredAt: string; durationMinutes: number | null }): { start: Date; end: Date } {
  const at = new Date(entry.occurredAt);
  if (entry.durationMinutes === null || entry.durationMinutes <= 0) return { start: at, end: at };
  const length = entry.durationMinutes * 60000;
  return entry.source === 'timer'
    ? { start: at, end: new Date(at.getTime() + length) }
    : { start: new Date(at.getTime() - length), end: at };
}

/** Longest gap between two stretches of one session's work that is still drawn as one block. */
export const MERGE_GAP_MINUTES = 10;

/** What a timer stretch needs for merging; `mergeKey` is null for work that never merges (not from a timer). */
export interface Stretch extends TimeSpan {
  /** The task, habit or project the stretch is for, e.g. `task:<id>`; null when it must not merge. */
  mergeKey: string | null;
  minutes: number;
  note: string;
  running: boolean;
}

/** The merge key of a timer stretch: its task, else its habit, else its project; null without any. */
export function stretchKey(links: { taskId: string | null; habitId: string | null; projectId: string | null }): string | null {
  if (links.taskId) return `task:${links.taskId}`;
  if (links.habitId) return `habit:${links.habitId}`;
  return links.projectId ? `project:${links.projectId}` : null;
}

/**
 * Joins timer blocks of the same item that are at most `maxGapMinutes` apart (also over several pauses) into one block
 * from the first start to the last end. Minutes are summed, so the pauses are not counted. Other items stay as they are.
 */
export function mergeStretches<T extends Stretch & { id: string }>(items: T[], maxGapMinutes: number = MERGE_GAP_MINUTES): T[] {
  const sorted = [...items].sort((a, b) => a.start.getTime() - b.start.getTime());
  const result: T[] = [];
  const last = new Map<string, number>();
  for (const item of sorted) {
    const index = item.mergeKey && item.kind === 'block' ? last.get(item.mergeKey) : undefined;
    const previous = index === undefined ? undefined : result[index];
    if (previous && item.start.getTime() - previous.end.getTime() <= maxGapMinutes * 60000) {
      result[index as number] = {
        ...previous,
        end: item.end > previous.end ? item.end : previous.end,
        minutes: previous.minutes + item.minutes,
        note: [previous.note, item.note].filter((n) => n.trim() !== '').join(' \u00b7 '),
        running: item.running,
      };
      continue;
    }
    if (item.mergeKey && item.kind === 'block') last.set(item.mergeKey, result.length);
    result.push(item);
  }
  return result;
}

function localDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

const localMinutes = (date: Date) => date.getHours() * 60 + date.getMinutes() + date.getSeconds() / 60;

export interface Placed<T extends TimeSpan> {
  item: T;
  /** Minutes from local midnight of the day, cut at the day's start and end. */
  startMin: number;
  /** Visual end: at least the minimum block length after the start for a block; equal to the start for a marker. */
  endMin: number;
  /** Position among the blocks it overlaps, from 0. */
  lane: number;
  /** Number of lanes of its overlap group; the width is `1 / lanes`. */
  lanes: number;
}

/**
 * Places the items that touch the local day `day` (`yyyy-mm-dd`): minutes within the day
 * (cut at midnight) and lanes so that overlapping blocks sit side by side.
 */
export function layoutDay<T extends TimeSpan>(items: T[], day: string, minBlockMinutes: number = MIN_BLOCK_MINUTES): Placed<T>[] {
  const placed: Placed<T>[] = [];
  for (const item of items) {
    const startDay = localDate(item.start);
    const endDay = localDate(item.end);
    if (startDay > day || endDay < day) continue;
    const startMin = startDay < day ? 0 : localMinutes(item.start);
    const trueEnd = endDay > day ? 1440 : localMinutes(item.end);
    // A block that ends exactly at midnight belongs to the day before.
    if (item.kind === 'block' && startDay < day && trueEnd === 0) continue;
    const endMin = item.kind === 'marker' ? startMin : Math.min(1440, Math.max(trueEnd, startMin + minBlockMinutes));
    placed.push({ item, startMin, endMin, lane: 0, lanes: 1 });
  }
  placed.sort((a, b) => a.startMin - b.startMin || a.endMin - b.endMin);

  let group: Placed<T>[] = [];
  let groupEnd = -1;
  const laneEnds: number[] = [];
  const closeGroup = () => {
    for (const p of group) p.lanes = laneEnds.length;
    group = [];
    laneEnds.length = 0;
  };
  for (const p of placed) {
    if (p.item.kind === 'marker') continue;
    if (p.startMin >= groupEnd) {
      closeGroup();
      groupEnd = -1;
    }
    let lane = laneEnds.findIndex((end) => end <= p.startMin);
    if (lane === -1) lane = laneEnds.length;
    laneEnds[lane] = p.endMin;
    p.lane = lane;
    group.push(p);
    groupEnd = Math.max(groupEnd, p.endMin);
  }
  closeGroup();
  return placed;
}

export interface Axis {
  startHour: number;
  endHour: number;
}

/** The visible hours: 06:00–22:00, extended by whole hours to include all placed items (of one or several days). */
export function axisFor(days: Placed<TimeSpan>[][]): Axis {
  let startHour = DEFAULT_START_HOUR;
  let endHour = DEFAULT_END_HOUR;
  for (const day of days) {
    for (const p of day) {
      startHour = Math.min(startHour, Math.floor(p.startMin / 60));
      endHour = Math.max(endHour, Math.ceil(p.endMin / 60));
    }
  }
  return { startHour: Math.max(0, startHour), endHour: Math.min(24, endHour) };
}

/** UTC instants of the local days `from` (inclusive) to `to` (exclusive), both `yyyy-mm-dd`, for querying by `occurred_at`. */
export function localRange(from: string, to: string): { from: string; to: string } {
  const midnight = (date: string) => {
    const [y, m, d] = date.split('-').map(Number);
    return new Date(y ?? 0, (m ?? 1) - 1, d ?? 1).toISOString();
  };
  return { from: midnight(from), to: midnight(to) };
}

/** The day `delta` days from `day` (`yyyy-mm-dd`), never later than `today`. */
export function shiftDay(day: string, delta: number, today: string): string {
  const [y, m, d] = day.split('-').map(Number);
  const moved = new Date(Date.UTC(y ?? 1970, (m ?? 1) - 1, (d ?? 1) + delta));
  const next = moved.toISOString().slice(0, 10);
  return next > today ? today : next;
}
