import { describe, expect, it } from 'vitest';
import { goalProgress, measureProgress, validateGoal, validateMeasure, type ProgressMeasure } from './goals.ts';

const numeric = (startValue: number, targetValue: number, currentValue: number): ProgressMeasure => ({
  measureType: 'numeric',
  startValue,
  targetValue,
  currentValue,
  habitId: null,
});

describe('measureProgress', () => {
  it('numeric: halfway', () => expect(measureProgress(numeric(0, 100, 50))).toBe(0.5));
  it('numeric: decreasing target', () => expect(measureProgress(numeric(80, 70, 75))).toBe(0.5));
  it('numeric: beyond target', () => expect(measureProgress(numeric(0, 100, 130))).toBe(1));
  it('numeric: below start', () => expect(measureProgress(numeric(10, 20, 5))).toBe(0));
  it('numeric: target equals start, reached', () => expect(measureProgress(numeric(5, 5, 5))).toBe(1));
  it('numeric: target equals start, not reached', () => expect(measureProgress(numeric(5, 5, 6))).toBe(0));

  const bool = (currentValue: number | null): ProgressMeasure => ({ measureType: 'boolean', startValue: null, targetValue: null, currentValue, habitId: null });
  it('boolean: achieved', () => expect(measureProgress(bool(1))).toBe(1));
  it('boolean: not achieved', () => expect(measureProgress(bool(0))).toBe(0));

  const habit = (habitId: string | null): ProgressMeasure => ({ measureType: 'habit', startValue: null, targetValue: 20, currentValue: null, habitId });
  it('habit: halfway', () => expect(measureProgress(habit('h'), 10)).toBe(0.5));
  it('habit: no linked habit', () => expect(measureProgress(habit(null), 10)).toBe(0));
});

describe('goalProgress', () => {
  it('averages the measures', () => expect(goalProgress([0.4, 0.8])).toBeCloseTo(0.6));
  it('is null without measures', () => expect(goalProgress([])).toBeNull());
});

describe('validateGoal', () => {
  it('accepts a valid goal', () => expect(validateGoal({ title: 'Get fit', startDate: '2026-10-01', endDate: '2026-12-31' })).toEqual({}));
  it('requires a title', () => expect(validateGoal({ title: '  ', startDate: '2026-10-01', endDate: '2026-12-31' }).title).toBeDefined());
  it('rejects an end before the start', () => expect(validateGoal({ title: 'x', startDate: '2026-10-02', endDate: '2026-10-01' }).endDate).toBeDefined());
});

describe('validateMeasure', () => {
  const base = { title: 'Run', measureType: 'numeric' as const, startValue: 0, targetValue: 100, currentValue: 0, step: 1 };
  it('accepts a numeric measure', () => expect(validateMeasure(base)).toEqual({}));
  it('requires a title', () => expect(validateMeasure({ ...base, title: '' }).title).toBeDefined());
  it('requires the target', () => expect(validateMeasure({ ...base, targetValue: null }).targetValue).toBeDefined());
  it('rejects a step of 0', () => expect(validateMeasure({ ...base, step: 0 }).step).toBeDefined());
  it('requires a positive habit target', () => {
    expect(validateMeasure({ ...base, measureType: 'habit', targetValue: 0 }).targetValue).toBeDefined();
    expect(validateMeasure({ ...base, measureType: 'habit', targetValue: 5 })).toEqual({});
  });
  it('ignores numeric fields for a boolean measure', () => {
    expect(validateMeasure({ title: 'x', measureType: 'boolean', startValue: null, targetValue: null, currentValue: null, step: null })).toEqual({});
  });
});
