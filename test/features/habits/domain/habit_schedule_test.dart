import 'package:flutter_test/flutter_test.dart';
import 'package:orbit/core/db/enums.dart';
import 'package:orbit/features/habits/domain/habit_schedule.dart';

void main() {
  group('validateHabitSchedule', () {
    test('daily needs nothing else', () {
      expect(validateHabitSchedule(ScheduleType.daily), isNull);
    });

    test('weekdays need at least one day', () {
      expect(
        validateHabitSchedule(ScheduleType.weekdays, weekdays: {}),
        HabitScheduleError.noWeekday,
      );
      expect(
        validateHabitSchedule(ScheduleType.weekdays),
        HabitScheduleError.noWeekday,
      );
      expect(
        validateHabitSchedule(ScheduleType.weekdays, weekdays: {3}),
        isNull,
      );
    });

    test('times per week must be 1–7', () {
      HabitScheduleError? check(int? times) =>
          validateHabitSchedule(ScheduleType.timesPerWeek, timesPerWeek: times);
      expect(check(0), HabitScheduleError.timesPerWeekOutOfRange);
      expect(check(1), isNull);
      expect(check(7), isNull);
      expect(check(8), HabitScheduleError.timesPerWeekOutOfRange);
      expect(check(null), HabitScheduleError.timesPerWeekOutOfRange);
    });
  });

  group('scheduleSummary', () {
    test('daily', () {
      expect(scheduleSummary(ScheduleType.daily), 'Daily');
    });

    test('weekdays in Monday-first order', () {
      expect(
        scheduleSummary(ScheduleType.weekdays, weekdays: {5, 1, 3}),
        'Mon, Wed, Fri',
      );
      expect(
        scheduleSummary(ScheduleType.weekdays, weekdays: {7, 1}),
        'Mon, Sun',
      );
    });

    test('times per week', () {
      expect(
        scheduleSummary(ScheduleType.timesPerWeek, timesPerWeek: 3),
        '3× per week',
      );
    });
  });
}
