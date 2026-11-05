import { describe, expect, it } from 'vitest';
import { chunkItems } from './chunks.ts';

describe('chunkItems', () => {
  it('splits 1200 rows into 500, 500 and 200 in order', () => {
    const rows = Array.from({ length: 1200 }, (_, i) => ({ i }));
    const chunks = chunkItems(rows);
    expect(chunks.map((c) => c.length)).toEqual([500, 500, 200]);
    expect(chunks.flat()).toEqual(rows);
  });

  it('splits by size when rows are large', () => {
    const rows = Array.from({ length: 5 }, (_, i) => ({ i, text: 'x'.repeat(400_000) }));
    expect(chunkItems(rows).map((c) => c.length)).toEqual([2, 2, 1]);
  });

  it('gives no parts for no rows', () => {
    expect(chunkItems([])).toEqual([]);
  });
});
