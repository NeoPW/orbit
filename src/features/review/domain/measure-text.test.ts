import { describe, expect, it } from 'vitest';
import { measureWeekText } from './measure-text.ts';
import type { MeasureSummary } from './week-summary.ts';

const measure = (extra: Partial<MeasureSummary>): MeasureSummary => ({
  measureId: 'm1',
  title: 'Run',
  progress: 0.5,
  measureType: 'numeric',
  unit: 'km',
  target: 10,
  value: 9,
  from: null,
  gain: 0,
  ...extra,
});

describe('measureWeekText', () => {
  it('shows start and end of a numeric measure with the difference', () => {
    expect(measureWeekText(measure({ from: 7 }))).toEqual({ text: '7 → 9 / 10 km', delta: '+2' });
  });
  it('shows a decrease with a minus sign', () => {
    expect(measureWeekText(measure({ from: 9.5, value: 9, unit: null }))).toEqual({ text: '9.5 → 9 / 10', delta: '−0.5' });
  });
  it('shows only the value of an unchanged measure', () => {
    expect(measureWeekText(measure({}))).toEqual({ text: '9 / 10 km', delta: null });
  });
  it('shows a yes/no measure achieved in the week', () => {
    expect(measureWeekText(measure({ measureType: 'boolean', value: 1, from: 0 })).text).toBe('Achieved');
  });
  it('shows the check-ins of a habit measure', () => {
    expect(measureWeekText(measure({ measureType: 'habit', value: 15, from: 12, target: 30 }))).toEqual({
      text: '12 → 15 / 30 check-ins',
      delta: null,
    });
  });
});
