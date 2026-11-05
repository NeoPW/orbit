import { expect, it } from 'vitest';
import { formatDateTime } from './format.ts';

it('formats as dd-mm-yyyy HH:mm in local time', () => {
  expect(formatDateTime(new Date(2026, 9, 5, 14, 5))).toBe('05-10-2026 14:05');
});
