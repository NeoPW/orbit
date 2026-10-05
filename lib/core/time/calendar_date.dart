/// A calendar date without a time of day or time zone.
///
/// Used for objective dates, deadlines, due dates, habit check dates and
/// week starts, so the same date is read back regardless of the device's
/// time zone. Timestamps use [DateTime] in UTC instead.
class CalendarDate implements Comparable<CalendarDate> {
  /// Creates a date. Out-of-range values roll over like [DateTime], so
  /// `CalendarDate(2026, 13, 1)` is 2027-01-01.
  factory CalendarDate(int year, int month, int day) {
    final normalized = DateTime.utc(year, month, day);
    return CalendarDate._(normalized.year, normalized.month, normalized.day);
  }

  const CalendarDate._(this.year, this.month, this.day);

  /// The local calendar date of [dateTime].
  factory CalendarDate.fromDateTime(DateTime dateTime) {
    final local = dateTime.toLocal();
    return CalendarDate(local.year, local.month, local.day);
  }

  /// Today's date in the device's local time zone, using [clock] for "now".
  factory CalendarDate.today(DateTime Function() clock) =>
      CalendarDate.fromDateTime(clock());

  /// Parses an ISO date (`YYYY-MM-DD`). Throws [FormatException] for any
  /// other format or for a date that does not exist (e.g. 2026-02-30).
  factory CalendarDate.parse(String iso) {
    final match = _isoPattern.firstMatch(iso);
    if (match == null) {
      throw FormatException('Expected a date as YYYY-MM-DD', iso);
    }
    final year = int.parse(match.group(1)!);
    final month = int.parse(match.group(2)!);
    final day = int.parse(match.group(3)!);
    final date = CalendarDate(year, month, day);
    if (date.year != year || date.month != month || date.day != day) {
      throw FormatException('Date does not exist', iso);
    }
    return date;
  }

  static final _isoPattern = RegExp(r'^(\d{4})-(\d{2})-(\d{2})$');

  final int year;
  final int month;
  final int day;

  /// ISO weekday: Monday = 1 … Sunday = 7.
  int get weekday => _utc.weekday;

  DateTime get _utc => DateTime.utc(year, month, day);

  CalendarDate addDays(int days) => CalendarDate(year, month, day + days);

  /// The Monday of this date's week (weeks start on Monday).
  CalendarDate get weekStart => addDays(1 - weekday);

  /// Number of days from this date to [other] (negative if [other] is earlier).
  int daysUntil(CalendarDate other) => other._utc.difference(_utc).inDays;

  /// A local [DateTime] at midnight of this date, e.g. for date pickers.
  DateTime toLocalDateTime() => DateTime(year, month, day);

  /// `YYYY-MM-DD`, the storage format.
  String toIso() =>
      '${year.toString().padLeft(4, '0')}-${_two(month)}-${_two(day)}';

  bool isBefore(CalendarDate other) => compareTo(other) < 0;
  bool isAfter(CalendarDate other) => compareTo(other) > 0;

  @override
  int compareTo(CalendarDate other) {
    if (year != other.year) return year.compareTo(other.year);
    if (month != other.month) return month.compareTo(other.month);
    return day.compareTo(other.day);
  }

  @override
  bool operator ==(Object other) =>
      other is CalendarDate &&
      other.year == year &&
      other.month == month &&
      other.day == day;

  @override
  int get hashCode => Object.hash(year, month, day);

  @override
  String toString() => toIso();
}

String _two(int value) => value.toString().padLeft(2, '0');
