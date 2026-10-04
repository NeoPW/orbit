import 'calendar_date.dart';

/// Formats [date] for display as `dd-mm-yyyy`, independent of the locale.
String formatDate(CalendarDate date) =>
    '${_two(date.day)}-${_two(date.month)}-${date.year.toString().padLeft(4, '0')}';

/// Formats a date range for display as `dd-mm-yyyy – dd-mm-yyyy`.
String formatDateRange(CalendarDate start, CalendarDate end) =>
    '${formatDate(start)} – ${formatDate(end)}';

String _two(int value) => value.toString().padLeft(2, '0');
