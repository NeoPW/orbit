export const MAX_CHUNK_ROWS = 500;
export const MAX_CHUNK_BYTES = 900_000;

const encoder = new TextEncoder();

/**
 * Splits items (in the given order) into parts of at most `maxRows` items and
 * about `maxBytes` of JSON, the sizes a push request must stay within.
 * A single item larger than `maxBytes` still gets a part of its own.
 */
export function chunkItems<T>(items: T[], maxRows = MAX_CHUNK_ROWS, maxBytes = MAX_CHUNK_BYTES): T[][] {
  const chunks: T[][] = [];
  let current: T[] = [];
  let bytes = 0;
  for (const item of items) {
    const size = encoder.encode(JSON.stringify(item)).length + 1;
    if (current.length > 0 && (current.length >= maxRows || bytes + size > maxBytes)) {
      chunks.push(current);
      current = [];
      bytes = 0;
    }
    current.push(item);
    bytes += size;
  }
  if (current.length > 0) chunks.push(current);
  return chunks;
}
