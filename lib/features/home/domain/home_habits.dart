import '../../../core/db/app_database.dart';
import '../../habits/domain/habit_due.dart';

/// A habit as listed on Home.
class HomeHabit {
  const HomeHabit({
    required this.habit,
    required this.checkedToday,
    required this.label,
  });

  final Habit habit;
  final bool checkedToday;

  /// The linked project's title, else the KR's title, else null.
  final String? label;
}

/// The habits for Home's "Habits due today": active habits that are due
/// [today] or already checked today, in the order of [habits].
///
/// [checks] must contain at least the checks of [today]'s week.
List<HomeHabit> buildHomeHabits({
  required List<Habit> habits,
  required List<HabitCheck> checks,
  required Map<String, Project> projects,
  required Map<String, KeyResult> keyResults,
  required CalendarDate today,
}) {
  final weekStart = today.weekStart;
  final weekEnd = weekStart.addDays(6);
  final checksInWeek = <String, int>{};
  final checkedToday = <String>{};
  for (final check in checks) {
    if (check.date.isBefore(weekStart) || check.date.isAfter(weekEnd)) {
      continue;
    }
    checksInWeek.update(check.habitId, (n) => n + 1, ifAbsent: () => 1);
    if (check.date == today) checkedToday.add(check.habitId);
  }

  return [
    for (final habit in habits)
      if (habit.active &&
          (checkedToday.contains(habit.id) ||
              isHabitDue(
                habit,
                today,
                checksInWeek: checksInWeek[habit.id] ?? 0,
              )))
        HomeHabit(
          habit: habit,
          checkedToday: checkedToday.contains(habit.id),
          label:
              projects[habit.projectId]?.title ??
              keyResults[habit.keyResultId]?.title,
        ),
  ];
}
