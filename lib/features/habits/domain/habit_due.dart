import '../../../core/db/app_database.dart';

/// Whether [habit] is due on [date] (habits spec, "Habit due today").
///
/// [checksInWeek] is the number of check-ins in [date]'s week (Monday to
/// Sunday); it only matters for [ScheduleType.timesPerWeek]. Inactive
/// habits are never due.
bool isHabitDue(Habit habit, CalendarDate date, {required int checksInWeek}) {
  if (!habit.active) return false;
  switch (habit.scheduleType) {
    case ScheduleType.daily:
      return true;
    case ScheduleType.weekdays:
      return habit.weekdays?.contains(date.weekday) ?? false;
    case ScheduleType.timesPerWeek:
      return checksInWeek < (habit.timesPerWeek ?? 0);
  }
}
