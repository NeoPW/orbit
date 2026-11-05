const two = (n: number) => String(n).padStart(2, '0');

/** `dd-mm-yyyy HH:mm` in the device's local time. */
export function formatDateTime(value: Date | string): string {
  const d = typeof value === 'string' ? new Date(value) : value;
  return `${two(d.getDate())}-${two(d.getMonth() + 1)}-${d.getFullYear()} ${two(d.getHours())}:${two(d.getMinutes())}`;
}
