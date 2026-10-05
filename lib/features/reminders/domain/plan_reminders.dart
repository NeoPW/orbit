import '../../../core/db/app_database.dart';
import '../../../core/notifications/planned_reminder.dart';
import '../../../core/router/routes.dart';
import '../../habits/domain/habit_due.dart';
import '../../home/domain/upcoming_deadlines.dart';
import '../../settings/domain/app_settings.dart';

/// How many days ahead reminders are scheduled, today included.
const reminderHorizonDays = 14;

/// Android allows about 500 pending alarms per app; leave headroom.
const maxScheduledReminders = 400;

/// All reminders to schedule from [now] (local time) on (notifications
/// spec): habit reminders for due, unchecked days and deadline reminders
/// on the lead date and the due date. Sorted by time and capped at
/// [maxScheduledReminders]. Empty when reminders are switched off.
///
/// [checks] must contain at least the checks since the start of the
/// current week. [deadlines] are the [deadlineCandidates].
List<PlannedReminder> planReminders({
  required AppSettings settings,
  required List<Habit> habits,
  required List<HabitCheck> checks,
  required Map<String, Project> projects,
  required Map<String, KeyResult> keyResults,
  required List<UpcomingDeadline> deadlines,
  required DateTime now,
  int horizonDays = reminderHorizonDays,
}) {
  if (!settings.remindersEnabled) return const [];

  final today = CalendarDate(now.year, now.month, now.day);
  final lastDay = today.addDays(horizonDays - 1);
  DateTime at(CalendarDate date, TimeOfDayValue time) =>
      DateTime(date.year, date.month, date.day, time.hour, time.minute);
  bool inRange(CalendarDate date, DateTime time) =>
      !date.isAfter(lastDay) && time.isAfter(now);

  final checkedOn = <(String, CalendarDate)>{};
  final checksPerWeek = <(String, CalendarDate), int>{};
  for (final check in checks) {
    checkedOn.add((check.habitId, check.date));
    checksPerWeek.update(
      (check.habitId, check.date.weekStart),
      (n) => n + 1,
      ifAbsent: () => 1,
    );
  }

  final reminders = <PlannedReminder>[];

  for (final habit in habits) {
    if (!habit.active) continue;
    final time =
        parseTimeOfDay(habit.reminderTime ?? '') ??
        settings.defaultReminderTime;
    final label =
        projects[habit.projectId]?.title ??
        keyResults[habit.keyResultId]?.title;
    for (var day = today; !day.isAfter(lastDay); day = day.addDays(1)) {
      final when = at(day, time);
      if (!when.isAfter(now) || checkedOn.contains((habit.id, day))) continue;
      final due = isHabitDue(
        habit,
        day,
        checksInWeek: checksPerWeek[(habit.id, day.weekStart)] ?? 0,
      );
      if (!due) continue;
      reminders.add(
        PlannedReminder(
          at: when,
          kind: ReminderKind.habit,
          title: habit.title,
          body: label == null ? 'Habit due today' : 'Habit · $label',
          route: Routes.home,
        ),
      );
    }
  }

  final leadDays = settings.deadlineLeadDays;
  for (final item in deadlines) {
    final kind = switch (item.kind) {
      DeadlineKind.task => 'Task',
      DeadlineKind.project => 'Project',
      DeadlineKind.keyResult => 'Key result',
    };
    final context = [kind, ?item.projectTitle].join(' · ');
    final route = item.kind == DeadlineKind.keyResult
        ? Routes.keyResult(item.id)
        : Routes.projectDetail(item.projectId!);

    for (final (date, text) in [
      (item.date.addDays(-leadDays), 'Due in $leadDays days'),
      (item.date, 'Due today'),
    ]) {
      final when = at(date, settings.defaultReminderTime);
      if (!inRange(date, when)) continue;
      reminders.add(
        PlannedReminder(
          at: when,
          kind: ReminderKind.deadline,
          title: item.title,
          body: '$context · $text',
          route: route,
        ),
      );
    }
  }

  reminders.sort((a, b) {
    final byTime = a.at.compareTo(b.at);
    return byTime != 0 ? byTime : a.title.compareTo(b.title);
  });
  return reminders.length > maxScheduledReminders
      ? reminders.sublist(0, maxScheduledReminders)
      : reminders;
}
