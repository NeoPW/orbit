import { describe, expect, it } from 'vitest';
import { daysUntil, deadlineBadge, localToday } from './deadline.ts';

const TODAY = '2026-11-21';

describe('deadlineBadge', () => {
  it('is red "Overdue" after the deadline', () => {
    expect(deadlineBadge('2026-11-20', TODAY, 7)).toEqual({ label: 'Overdue', tone: 'overdue' });
  });

  it('is amber "Today" on the day itself', () => {
    expect(deadlineBadge(TODAY, TODAY, 7)).toEqual({ label: 'Today', tone: 'soon' });
  });

  it('is amber "Tomorrow" one day before', () => {
    expect(deadlineBadge('2026-11-22', TODAY, 7)).toEqual({ label: 'Tomorrow', tone: 'soon' });
  });

  it('is amber "In N days" within the lead time', () => {
    expect(deadlineBadge('2026-11-26', TODAY, 7)).toEqual({ label: 'In 5 days', tone: 'soon' });
  });

  it('shows the date without urgency beyond the lead time', () => {
    expect(deadlineBadge('2026-12-31', TODAY, 7)).toEqual({ label: '31-12-2026', tone: 'none' });
  });
});

describe('daysUntil', () => {
  it('counts calendar days across a daylight saving change and a year end', () => {
    expect(daysUntil('2026-10-26', '2026-10-24')).toBe(2);
    expect(daysUntil('2027-01-01', '2026-12-31')).toBe(1);
  });
});

describe('localToday', () => {
  it('uses the local calendar date', () => {
    expect(localToday(new Date(2026, 2, 5, 23, 30))).toBe('2026-03-05');
  });
});
