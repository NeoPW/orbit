import { describe, expect, it } from 'vitest';
import { formatDate, formatDateRange } from './format.ts';

describe('formatDate', () => {
  it('shows dd-mm-yyyy with leading zeros', () => {
    expect(formatDate('2026-03-05')).toBe('05-03-2026');
  });
});

describe('formatDateRange', () => {
  it('joins two dates with an en dash', () => {
    expect(formatDateRange('2026-10-01', '2026-12-31')).toBe('01-10-2026 – 31-12-2026');
  });
});
