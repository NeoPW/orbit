import 'package:flutter_test/flutter_test.dart';
import 'package:orbit/core/time/calendar_date.dart';
import 'package:orbit/core/time/date_format.dart';

void main() {
  test('formats a single date as dd-mm-yyyy', () {
    expect(formatDate(CalendarDate(2026, 12, 31)), '31-12-2026');
  });

  test('pads day and month with leading zeros', () {
    expect(formatDate(CalendarDate(2026, 3, 5)), '05-03-2026');
  });

  test('formats a date range', () {
    expect(
      formatDateRange(CalendarDate(2026, 10, 1), CalendarDate(2026, 12, 31)),
      '01-10-2026 – 31-12-2026',
    );
  });

  test('formats a local time as HH:mm with leading zeros', () {
    expect(formatTime(DateTime(2026, 10, 5, 7, 5)), '07:05');
    expect(formatTime(DateTime(2026, 10, 5, 23, 59)), '23:59');
  });

  test('formats a UTC timestamp in local time', () {
    final local = DateTime(2026, 10, 5, 7, 5);
    expect(formatTime(local.toUtc()), '07:05');
  });
}
