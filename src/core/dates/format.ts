/**
 * Calendar dates are stored as `yyyy-mm-dd` text and shown as `dd-mm-yyyy`,
 * whatever the device locale or time zone.
 */
export function formatDate(date: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(date);
  if (!match) throw new Error(`Not a calendar date: ${date}`);
  return `${match[3]}-${match[2]}-${match[1]}`;
}

export function formatDateRange(start: string, end: string): string {
  return `${formatDate(start)} – ${formatDate(end)}`;
}
