import 'package:flutter_test/flutter_test.dart';
import 'package:orbit/core/db/app_database.dart';
import 'package:orbit/features/habits/domain/habit_due.dart';

import '../../../helpers/fixtures.dart';

void main() {
  // 2026-10-05 is a Monday.
  final monday = CalendarDate(2026, 10, 5);
  final tuesday = CalendarDate(2026, 10, 6);
  final thursday = CalendarDate(2026, 10, 8);

  test('daily habits are due every day', () {
    final daily = habit('h');
    for (var i = 0; i < 7; i++) {
      expect(isHabitDue(daily, monday.addDays(i), checksInWeek: 0), isTrue);
    }
  });

  group('weekdays', () {
    final monWedFri = habit(
      'h',
      scheduleType: ScheduleType.weekdays,
      weekdays: {1, 3, 5},
    );

    test('due on a selected weekday', () {
      expect(isHabitDue(monWedFri, monday, checksInWeek: 0), isTrue);
    });

    test('not due on a weekday that is not selected', () {
      expect(isHabitDue(monWedFri, tuesday, checksInWeek: 0), isFalse);
    });
  });

  group('times per week', () {
    final threeTimes = habit(
      'h',
      scheduleType: ScheduleType.timesPerWeek,
      timesPerWeek: 3,
    );

    test('due while the week has fewer check-ins than the target', () {
      expect(isHabitDue(threeTimes, thursday, checksInWeek: 2), isTrue);
    });

    test('not due once the target is reached', () {
      expect(isHabitDue(threeTimes, thursday, checksInWeek: 3), isFalse);
    });

    test('due again on Monday of a new week', () {
      // Last week's three check-ins are not in the new week's count.
      expect(isHabitDue(threeTimes, monday, checksInWeek: 0), isTrue);
    });
  });

  test('inactive habits are never due', () {
    final inactive = habit('h', active: false);
    expect(isHabitDue(inactive, monday, checksInWeek: 0), isFalse);
  });
}
