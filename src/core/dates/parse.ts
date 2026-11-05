export type ParseResult = { ok: true; value: string } | { ok: false; error: string };

/** Parses `dd-mm-yyyy` (one-digit day and month allowed) into `yyyy-mm-dd`; rejects dates that do not exist. */
export function parseDate(text: string): ParseResult {
  const match = /^(\d{1,2})-(\d{1,2})-(\d{4})$/.exec(text.trim());
  const error = { ok: false, error: 'Enter a date as dd-mm-yyyy' } as const;
  if (!match) return error;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const check = new Date(Date.UTC(year, month - 1, day));
  if (check.getUTCFullYear() !== year || check.getUTCMonth() !== month - 1 || check.getUTCDate() !== day) return error;
  const two = (n: number) => String(n).padStart(2, '0');
  return { ok: true, value: `${match[3]}-${two(month)}-${two(day)}` };
}

/** `HH:mm` from hours (0–23) and minutes (0–59). */
export function formatTime(hours: number, minutes: number): string {
  const two = (n: number) => String(n).padStart(2, '0');
  return `${two(hours)}:${two(minutes)}`;
}

/** Parses `HH:mm` (one-digit hour allowed) into `HH:mm`. */
export function parseTime(text: string): ParseResult {
  const match = /^(\d{1,2}):(\d{2})$/.exec(text.trim());
  if (!match) return { ok: false, error: 'Enter a time as HH:mm' };
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return { ok: false, error: 'Enter a time as HH:mm' };
  return { ok: true, value: formatTime(hours, minutes) };
}
