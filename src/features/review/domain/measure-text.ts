import type { MeasureSummary } from './week-summary.ts';

/** Avoids 0.1 + 0.2 style results. */
const tidy = (n: number) => Math.round(n * 1e9) / 1e9;

/** "+2", "−2.5". */
function signed(n: number): string {
  return n < 0 ? `−${Math.abs(n)}` : `+${n}`;
}

export interface MeasureWeekText {
  /** For example "7 → 9 / 10 km", "Achieved" or "12 → 15 / 30 check-ins". */
  text: string;
  /** The difference of a numeric measure ("+2"); null otherwise. */
  delta: string | null;
}

/** A measure's value in the week summary: start → end of the week when it changed, else only its value. */
export function measureWeekText(m: MeasureSummary): MeasureWeekText {
  const changed = m.from !== null;
  if (m.measureType === 'boolean')
    return { text: changed ? (m.value === 1 ? 'Achieved' : 'Not achieved') : m.value === 1 ? 'Done' : 'Not done', delta: null };
  const target = m.target ?? 0;
  const tail = m.measureType === 'habit' ? ' check-ins' : m.unit ? ` ${m.unit}` : '';
  const text = `${changed ? `${m.from} → ` : ''}${m.value} / ${target}${tail}`;
  return { text, delta: changed && m.measureType === 'numeric' ? signed(tidy(m.value - m.from!)) : null };
}
