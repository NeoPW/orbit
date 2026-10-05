import 'calendar_date.dart';

/// Formats [date] for display as `dd-mm-yyyy`, independent of the locale.
String formatDate(CalendarDate date) =>
    '${_two(date.day)}-${_two(date.month)}-${date.year.toString().padLeft(4, '0')}';

/// Formats a date range for display as `dd-mm-yyyy – dd-mm-yyyy`.
String formatDateRange(CalendarDate start, CalendarDate end) =>
    '${formatDate(start)} – ${formatDate(end)}';

/// Formats the local time of day of [dateTime] as `HH:mm`.
String formatTime(DateTime dateTime) {
  final local = dateTime.toLocal();
  return '${_two(local.hour)}:${_two(local.minute)}';
}

String _two(int value) => value.toString().padLeft(2, '0');
