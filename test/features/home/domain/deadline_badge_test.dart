import 'package:flutter_test/flutter_test.dart';
import 'package:orbit/core/time/calendar_date.dart';
import 'package:orbit/features/home/domain/deadline_badge.dart';

void main() {
  final today = CalendarDate(2026, 10, 5);
  DeadlineBadge badge(int days) => deadlineBadge(today.addDays(days), today);

  test('overdue', () => expect(badge(-1), isA<Overdue>()));
  test('today', () => expect(badge(0), isA<DueToday>()));
  test('tomorrow', () => expect(badge(1), isA<DueTomorrow>()));
  test('in 3 days', () => expect((badge(3) as DueInDays).days, 3));
  test('in 30 days', () => expect((badge(30) as DueInDays).days, 30));
  test('beyond 30 days shows the date', () {
    expect((badge(31) as DueOn).date, CalendarDate(2026, 11, 5));
  });
}
