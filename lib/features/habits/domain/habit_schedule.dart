import '../../../core/db/enums.dart';

enum HabitScheduleError { noWeekday, timesPerWeekOutOfRange }

/// Checks the schedule fields for [type]; returns null when valid.
HabitScheduleError? validateHabitSchedule(
  ScheduleType type, {
  Set<int>? weekdays,
  int? timesPerWeek,
}) {
  switch (type) {
    case ScheduleType.daily:
      return null;
    case ScheduleType.weekdays:
      return (weekdays == null || weekdays.isEmpty)
          ? HabitScheduleError.noWeekday
          : null;
    case ScheduleType.timesPerWeek:
      return (timesPerWeek == null || timesPerWeek < 1 || timesPerWeek > 7)
          ? HabitScheduleError.timesPerWeekOutOfRange
          : null;
  }
}

/// Short weekday names, Monday first (ISO weekday 1–7).
const weekdayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/// A human-readable schedule, e.g. "Daily", "Mon, Wed, Fri", "3× per week".
String scheduleSummary(
  ScheduleType type, {
  Set<int>? weekdays,
  int? timesPerWeek,
}) {
  switch (type) {
    case ScheduleType.daily:
      return 'Daily';
    case ScheduleType.weekdays:
      final days = (weekdays ?? const <int>{}).toList()..sort();
      return days.map((day) => weekdayNames[day - 1]).join(', ');
    case ScheduleType.timesPerWeek:
      return '${timesPerWeek ?? 0}× per week';
  }
}
