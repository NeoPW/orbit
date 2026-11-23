import type { DistanceUnit, ExerciseKind } from '../../../core/db/schema.ts';

/** The stored values of a set; which ones are set depends on the exercise's kind. */
export interface SetValues {
  reps: number | null;
  weightKg: number | null;
  distance: number | null;
  durationSeconds: number | null;
}

/** A set's inputs as typed. */
export interface SetInput {
  reps: string;
  weight: string;
  distance: string;
  duration: string;
}

export type SetResult = { ok: true; values: SetValues } | { ok: false; error: string };

export const EMPTY_INPUT: SetInput = { reps: '', weight: '', distance: '', duration: '' };

/** A decimal number as typed; a comma counts as the decimal point. NaN when it is not a number. */
function parseDecimal(text: string): number {
  const clean = text.trim().replace(',', '.');
  return /^\d+(\.\d+)?$|^\.\d+$/.test(clean) ? Number(clean) : NaN;
}

/** `m:ss` or `h:mm:ss` in seconds, or null when the text has another form. */
export function parseSetDuration(text: string): number | null {
  const match = /^(?:(\d+):([0-5]\d)|(\d+):([0-5]\d):([0-5]\d))$/.exec(text.trim());
  if (!match) return null;
  if (match[1] !== undefined) return Number(match[1]) * 60 + Number(match[2]);
  return Number(match[3]) * 3600 + Number(match[4]) * 60 + Number(match[5]);
}

export function validateSet(kind: ExerciseKind, input: SetInput): SetResult {
  if (kind === 'endurance') {
    const distance = parseDecimal(input.distance);
    if (!(distance > 0)) return { ok: false, error: 'Enter a distance above 0' };
    const seconds = parseSetDuration(input.duration);
    if (seconds === null) return { ok: false, error: 'Enter the time as m:ss or h:mm:ss' };
    if (seconds <= 0) return { ok: false, error: 'Enter a time above 0:00' };
    return { ok: true, values: { reps: null, weightKg: null, distance, durationSeconds: seconds } };
  }
  const reps = Number(input.reps.trim());
  if (!/^\d+$/.test(input.reps.trim()) || reps < 1) return { ok: false, error: 'Enter at least 1 rep' };
  if (kind === 'bodyweight') return { ok: true, values: { reps, weightKg: null, distance: null, durationSeconds: null } };
  const weight = parseDecimal(input.weight);
  if (!(weight >= 0)) return { ok: false, error: 'Enter a weight of 0 kg or more' };
  return { ok: true, values: { reps, weightKg: weight, distance: null, durationSeconds: null } };
}

/** A number without trailing zeros: 60, 62.5, 5.25. */
function num(n: number): string {
  return String(Math.round(n * 1000) / 1000);
}

const two = (n: number) => String(n).padStart(2, '0');

/** `m:ss` under an hour, else `h:mm:ss`. */
export function formatSetDuration(seconds: number): string {
  const s = Math.round(seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h}:${two(m)}:${two(s % 60)}` : `${m}:${two(s % 60)}`;
}

/** The set as one short text: "8 × 60 kg", "12 reps", "5.2 km in 28:40". */
export function formatSet(kind: ExerciseKind, set: SetValues, unit: DistanceUnit | null): string {
  if (kind === 'endurance') return `${num(set.distance ?? 0)} ${unit ?? 'km'} in ${formatSetDuration(set.durationSeconds ?? 0)}`;
  const reps = set.reps ?? 0;
  if (kind === 'bodyweight') return `${reps} ${reps === 1 ? 'rep' : 'reps'}`;
  return `${reps} × ${num(set.weightKg ?? 0)} kg`;
}

/** Minutes and seconds per km (km exercises) or per 100 m (m exercises). */
export function pace(distance: number, seconds: number, unit: DistanceUnit): string {
  const per = unit === 'km' ? seconds / distance : seconds / (distance / 100);
  return `${formatSetDuration(per)} ${unit === 'km' ? '/km' : '/100 m'}`;
}

/** A session's length in whole minutes, rounded, at least 1. */
export function sessionMinutes(startedAt: string, endedAt: string): number {
  return Math.max(1, Math.round((new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 60000));
}

/** One set of an earlier session, as loaded for "last time". */
export interface PastSetRow extends SetValues {
  exerciseId: string;
  sessionId: string;
  startedAt: string;
  position: number;
}

export interface LastTime {
  sessionId: string;
  startedAt: string;
  sets: SetValues[];
}

/** The sets of `exerciseId` in the most recently started session among `rows`, in order; null without any. */
export function lastTime(exerciseId: string, rows: readonly PastSetRow[]): LastTime | null {
  const own = rows.filter((r) => r.exerciseId === exerciseId);
  if (own.length === 0) return null;
  const latest = own.reduce((a, b) => (b.startedAt > a.startedAt ? b : a));
  const sets = own
    .filter((r) => r.sessionId === latest.sessionId)
    .sort((a, b) => a.position - b.position)
    .map(({ reps, weightKg, distance, durationSeconds }) => ({ reps, weightKg, distance, durationSeconds }));
  return { sessionId: latest.sessionId, startedAt: latest.startedAt, sets };
}

/** The values for the next set: last time's set at that position, else this session's last set, else last time's last set. */
export function prefill(lastSets: readonly SetValues[], logged: readonly SetValues[]): SetValues | null {
  return lastSets[logged.length] ?? logged.at(-1) ?? lastSets.at(-1) ?? null;
}

/** Set values as input texts, for filling in the inputs. */
export function toInput(values: SetValues | null): SetInput {
  if (!values) return EMPTY_INPUT;
  return {
    reps: values.reps === null ? '' : String(values.reps),
    weight: values.weightKg === null ? '' : num(values.weightKg),
    distance: values.distance === null ? '' : num(values.distance),
    duration: values.durationSeconds === null ? '' : formatSetDuration(values.durationSeconds),
  };
}

/** Local `HH:mm` of an ISO instant. */
export function clockTime(iso: string): string {
  const d = new Date(iso);
  return `${two(d.getHours())}:${two(d.getMinutes())}`;
}

/** Whole minutes from `startedAt` until `now`, for a running session (0 before its start). */
export function runningMinutes(startedAt: string, now: Date): number {
  return Math.max(0, Math.floor((now.getTime() - new Date(startedAt).getTime()) / 60000));
}

/** The ISO instant of a local date (`yyyy-mm-dd`) and time (`HH:mm`). */
export function localInstant(date: string, time: string): string {
  return new Date(`${date}T${time}:00`).toISOString();
}
