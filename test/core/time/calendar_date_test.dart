import 'package:flutter_test/flutter_test.dart';
import 'package:orbit/core/time/calendar_date.dart';

void main() {
  group('parse / toIso', () {
    test('round-trips an ISO date', () {
      final date = CalendarDate.parse('2026-12-31');
      expect(date, CalendarDate(2026, 12, 31));
      expect(date.toIso(), '2026-12-31');
    });

    test('pads month and day', () {
      expect(CalendarDate(2026, 3, 5).toIso(), '2026-03-05');
    });

    test('rejects other formats', () {
      expect(() => CalendarDate.parse('31-12-2026'), throwsFormatException);
      expect(() => CalendarDate.parse('2026-1-5'), throwsFormatException);
      expect(() => CalendarDate.parse(''), throwsFormatException);
    });

    test('rejects dates that do not exist', () {
      expect(() => CalendarDate.parse('2026-02-29'), throwsFormatException);
      expect(() => CalendarDate.parse('2026-13-01'), throwsFormatException);
    });

    test('accepts leap day in a leap year', () {
      expect(CalendarDate.parse('2028-02-29'), CalendarDate(2028, 2, 29));
    });
  });

  group('comparison', () {
    test('orders by year, month, day', () {
      final dates = [
        CalendarDate(2027, 1, 1),
        CalendarDate(2026, 12, 31),
        CalendarDate(2026, 2, 10),
        CalendarDate(2026, 2, 9),
      ]..sort();
      expect(dates.map((d) => d.toIso()), [
        '2026-02-09',
        '2026-02-10',
        '2026-12-31',
        '2027-01-01',
      ]);
    });

    test('isBefore / isAfter / equality', () {
      final a = CalendarDate(2026, 10, 1);
      final b = CalendarDate(2026, 10, 2);
      expect(a.isBefore(b), isTrue);
      expect(b.isAfter(a), isTrue);
      expect(a == CalendarDate(2026, 10, 1), isTrue);
      expect(a.hashCode, CalendarDate(2026, 10, 1).hashCode);
    });
  });

  group('addDays / daysUntil', () {
    test('crosses month and year boundaries', () {
      expect(CalendarDate(2026, 1, 31).addDays(1), CalendarDate(2026, 2, 1));
      expect(CalendarDate(2026, 12, 31).addDays(1), CalendarDate(2027, 1, 1));
      expect(CalendarDate(2027, 1, 1).addDays(-1), CalendarDate(2026, 12, 31));
    });

    test('handles leap day', () {
      expect(CalendarDate(2028, 2, 28).addDays(1), CalendarDate(2028, 2, 29));
      expect(CalendarDate(2026, 2, 28).addDays(1), CalendarDate(2026, 3, 1));
    });

    test('daysUntil counts calendar days', () {
      final start = CalendarDate(2026, 10, 25);
      expect(start.daysUntil(CalendarDate(2026, 11, 1)), 7);
      expect(start.daysUntil(CalendarDate(2026, 10, 20)), -5);
    });
  });

  test('weekday is ISO (Monday = 1)', () {
    expect(CalendarDate(2026, 10, 5).weekday, DateTime.monday);
    expect(CalendarDate(2026, 10, 11).weekday, DateTime.sunday);
  });

  test('today uses the local date of the clock', () {
    final now = DateTime(2026, 10, 5, 23, 30);
    expect(CalendarDate.today(() => now.toUtc()), CalendarDate(2026, 10, 5));
  });
}
