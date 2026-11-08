import type { MeasureType } from '../../../core/db/schema.ts';

export interface GoalInput {
  title: string;
  /** `yyyy-mm-dd`. */
  startDate: string | null;
  endDate: string | null;
}

export interface GoalErrors {
  title?: string;
  startDate?: string;
  endDate?: string;
}

/** Title, start and end are required and the end must not be before the start. Empty object means valid. */
export function validateGoal(input: GoalInput): GoalErrors {
  const errors: GoalErrors = {};
  if (input.title.trim() === '') errors.title = 'Enter a title';
  if (!input.startDate) errors.startDate = 'Enter a start date';
  if (!input.endDate) errors.endDate = 'Enter an end date';
  if (input.startDate && input.endDate && input.endDate < input.startDate) errors.endDate = 'The end date is before the start date';
  return errors;
}

export interface MeasureInput {
  title: string;
  measureType: MeasureType;
  startValue: number | null;
  targetValue: number | null;
  currentValue: number | null;
  step: number | null;
}

export interface MeasureErrors {
  title?: string;
  startValue?: string;
  targetValue?: string;
  currentValue?: string;
  step?: string;
}

/** Numeric fields and a positive step for numeric measures; a positive target for habit measures. */
export function validateMeasure(input: MeasureInput): MeasureErrors {
  const errors: MeasureErrors = {};
  if (input.title.trim() === '') errors.title = 'Enter a title';
  if (input.measureType === 'numeric') {
    if (input.startValue === null) errors.startValue = 'Enter a start value';
    if (input.targetValue === null) errors.targetValue = 'Enter a target value';
    if (input.currentValue === null) errors.currentValue = 'Enter the current value';
    if (input.step === null || input.step <= 0) errors.step = 'The step must be greater than 0';
  } else if (input.measureType === 'habit') {
    if (input.targetValue === null || input.targetValue <= 0) errors.targetValue = 'The target must be greater than 0';
  }
  return errors;
}

export interface ProgressMeasure {
  measureType: MeasureType;
  startValue: number | null;
  targetValue: number | null;
  currentValue: number | null;
  habitId: string | null;
}

const clamp = (n: number) => Math.min(1, Math.max(0, n));

/**
 * Progress of a measure, 0 to 1. `checkIns` counts the checks of the linked
 * habit since the goal's start date (only used for habit measures).
 */
export function measureProgress(measure: ProgressMeasure, checkIns = 0): number {
  if (measure.measureType === 'boolean') return measure.currentValue === 1 ? 1 : 0;
  if (measure.measureType === 'habit') {
    if (!measure.habitId || !measure.targetValue || measure.targetValue <= 0) return 0;
    return clamp(checkIns / measure.targetValue);
  }
  const { startValue: start, targetValue: target, currentValue: current } = measure;
  if (start === null || target === null || current === null) return 0;
  if (target === start) return current === target ? 1 : 0;
  return clamp((current - start) / (target - start));
}

/** Average progress of a goal's measures; null without measures. */
export function goalProgress(progresses: number[]): number | null {
  if (progresses.length === 0) return null;
  return progresses.reduce((sum, p) => sum + p, 0) / progresses.length;
}

/** The value to show for a measure, for example "40 / 100 km", "Done" or "10 / 20 check-ins". */
export function measureValueText(measure: ProgressMeasure & { unit: string | null }, checkIns = 0): string {
  if (measure.measureType === 'boolean') return measure.currentValue === 1 ? 'Done' : 'Not done';
  if (measure.measureType === 'habit') {
    if (!measure.habitId) return 'No habit linked';
    return `${checkIns} / ${measure.targetValue ?? 0} check-ins`;
  }
  const unit = measure.unit ? ` ${measure.unit}` : '';
  return `${measure.currentValue ?? 0} / ${measure.targetValue ?? 0}${unit}`;
}

/** A recorded value change: `at` is the ISO instant, `from` the value before it. */
export interface ValueChange {
  at: string;
  from: number | null;
}

/** A measure's value at `instant`: the value before the first change after it, or the current value when none follows. */
export function valueAt(currentValue: number | null, changes: readonly ValueChange[], instant: string): number | null {
  let first: ValueChange | undefined;
  for (const change of changes) {
    if (change.at >= instant && (!first || change.at < first.at)) first = change;
  }
  return first ? first.from : currentValue;
}

/** A measure with what its progress at a past moment needs: its recorded changes and, for a habit measure, the linked habit's check dates. */
export interface TimedMeasure extends ProgressMeasure {
  checkDates: readonly string[];
  changes: readonly ValueChange[];
}

/**
 * A measure's value and progress at `instant`. A habit measure counts the check dates for which `lastDate` holds
 * (those up to that moment); other measures use their value history.
 */
export function measureStateAt(m: TimedMeasure, instant: string, lastDate: (date: string) => boolean): { value: number; progress: number } {
  if (m.measureType === 'habit') {
    const checks = m.checkDates.filter(lastDate).length;
    return { value: checks, progress: measureProgress(m, checks) };
  }
  const value = valueAt(m.currentValue, m.changes, instant);
  return { value: value ?? 0, progress: measureProgress({ ...m, currentValue: value }) };
}
