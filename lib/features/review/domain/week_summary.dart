import '../../../core/db/app_database.dart';
import '../../key_results/domain/kr_progress.dart';

/// The Monday of the week a review is about (weekly-review spec, "Review
/// week"): the week ending today on a Sunday, otherwise the previous week.
CalendarDate reviewWeekStart(CalendarDate today) =>
    today.weekday == DateTime.sunday
    ? today.weekStart
    : today.weekStart.addDays(-7);

/// The UTC timestamps from Monday 00:00 to the next Monday 00:00 local
/// time of the week starting [weekStart]; the end is exclusive.
({DateTime from, DateTime to}) weekRange(CalendarDate weekStart) => (
  from: weekStart.toLocalDateTime().toUtc(),
  to: weekStart.addDays(7).toLocalDateTime().toUtc(),
);

bool _inWeek(CalendarDate date, CalendarDate weekStart) =>
    !date.isBefore(weekStart) && !date.isAfter(weekStart.addDays(6));

/// Work logged on one project (or without project) in a week.
class ProjectWork {
  const ProjectWork({
    required this.projectId,
    required this.title,
    required this.count,
    required this.minutes,
  });

  /// Null for entries without a project.
  final String? projectId;
  final String title;
  final int count;
  final int minutes;
}

/// Log entries of the week per project, most time first, then most entries,
/// then title. Entries without a project are grouped as "No project".
List<ProjectWork> workPerProject(
  List<LogEntry> entries,
  Map<String, Project> projects,
  CalendarDate weekStart,
) {
  final counts = <String?, int>{};
  final minutes = <String?, int>{};
  for (final entry in entries) {
    if (!_inWeek(CalendarDate.fromDateTime(entry.occurredAt), weekStart)) {
      continue;
    }
    final key = entry.projectId;
    counts.update(key, (n) => n + 1, ifAbsent: () => 1);
    minutes.update(
      key,
      (n) => n + (entry.durationMinutes ?? 0),
      ifAbsent: () => entry.durationMinutes ?? 0,
    );
  }
  final work = [
    for (final id in counts.keys)
      ProjectWork(
        projectId: id,
        title: id == null
            ? 'No project'
            : projects[id]?.title ?? 'Deleted project',
        count: counts[id]!,
        minutes: minutes[id]!,
      ),
  ];
  return work..sort((a, b) {
    final byMinutes = b.minutes.compareTo(a.minutes);
    if (byMinutes != 0) return byMinutes;
    final byCount = b.count.compareTo(a.count);
    if (byCount != 0) return byCount;
    return a.title.toLowerCase().compareTo(b.title.toLowerCase());
  });
}

/// How often a habit was done in a week compared with its schedule.
class HabitAdherence {
  const HabitAdherence({
    required this.habit,
    required this.done,
    required this.expected,
  });

  final Habit habit;
  final int done;
  final int expected;
}

/// Check-ins and expected check-ins of every active habit in the week.
/// Days before a habit was created are not expected; habits created after
/// the week are left out.
List<HabitAdherence> habitAdherence(
  List<Habit> habits,
  List<HabitCheck> checks,
  CalendarDate weekStart,
) {
  final weekEnd = weekStart.addDays(6);
  final done = <String, int>{};
  for (final check in checks) {
    if (_inWeek(check.date, weekStart)) {
      done.update(check.habitId, (n) => n + 1, ifAbsent: () => 1);
    }
  }
  return [
    for (final habit in habits)
      if (habit.active &&
          !CalendarDate.fromDateTime(habit.createdAt).isAfter(weekEnd))
        HabitAdherence(
          habit: habit,
          done: done[habit.id] ?? 0,
          expected: _expected(habit, weekStart),
        ),
  ];
}

int _expected(Habit habit, CalendarDate weekStart) {
  final created = CalendarDate.fromDateTime(habit.createdAt);
  final from = created.isAfter(weekStart) ? created : weekStart;
  final days = [
    for (var d = from; !d.isAfter(weekStart.addDays(6)); d = d.addDays(1)) d,
  ];
  return switch (habit.scheduleType) {
    ScheduleType.daily => days.length,
    ScheduleType.weekdays =>
      days.where((d) => habit.weekdays?.contains(d.weekday) ?? false).length,
    ScheduleType.timesPerWeek => habit.timesPerWeek ?? 0,
  };
}

/// A task completed in the week, with its project if it still exists.
typedef CompletedTask = ({Task task, Project? project});

/// Done tasks whose local completion date is in the week, newest first.
List<CompletedTask> completedTasksInWeek(
  List<Task> tasks,
  Map<String, Project> projects,
  CalendarDate weekStart,
) {
  final done = [
    for (final task in tasks)
      if (task.status == TaskStatus.done &&
          task.completedAt != null &&
          _inWeek(CalendarDate.fromDateTime(task.completedAt!), weekStart))
        (task: task, project: projects[task.projectId]),
  ];
  return done
    ..sort((a, b) => b.task.completedAt!.compareTo(a.task.completedAt!));
}

/// A KR's current progress and its change since the previous review.
class KrProgressChange {
  const KrProgressChange({
    required this.keyResult,
    required this.progress,
    required this.change,
  });

  final KeyResult keyResult;

  /// 0–1.
  final double progress;

  /// Percentage points since the most recent earlier snapshot, or null
  /// without one.
  final int? change;
}

/// The KRs of active objectives, in the order given, with progress and
/// change since [previousSnapshots] (progress by KR ID).
List<KrProgressChange> krProgressChanges(
  List<KeyResult> keyResults,
  List<Objective> objectives,
  Map<String, int> habitCheckIns,
  Map<String, double> previousSnapshots,
) {
  final active = {
    for (final o in objectives)
      if (o.status == ObjectiveStatus.active) o.id,
  };
  return [
    for (final kr in keyResults)
      if (active.contains(kr.objectiveId))
        _change(kr, habitCheckIns[kr.id] ?? 0, previousSnapshots[kr.id]),
  ];
}

KrProgressChange _change(KeyResult kr, int checkIns, double? previous) {
  final progress = krProgress(
    kr.measureType,
    start: kr.startValue,
    target: kr.targetValue,
    current: kr.currentValue,
    habitCheckIns: checkIns,
  );
  return KrProgressChange(
    keyResult: kr,
    progress: progress,
    change: previous == null ? null : ((progress - previous) * 100).round(),
  );
}

/// Everything the Review tab and the look-back step show about a week.
class WeekSummary {
  const WeekSummary({
    required this.weekStart,
    required this.work,
    required this.habits,
    required this.tasks,
    required this.keyResults,
  });

  final CalendarDate weekStart;
  final List<ProjectWork> work;
  final List<HabitAdherence> habits;
  final List<CompletedTask> tasks;
  final List<KrProgressChange> keyResults;
}

WeekSummary buildWeekSummary({
  required CalendarDate weekStart,
  required List<LogEntry> entries,
  required List<Habit> habits,
  required List<HabitCheck> checks,
  required List<Task> completedTasks,
  required List<Project> projects,
  required List<KeyResult> keyResults,
  required List<Objective> objectives,
  required Map<String, int> habitCheckIns,
  required Map<String, double> previousSnapshots,
}) {
  final projectsById = {for (final p in projects) p.id: p};
  return WeekSummary(
    weekStart: weekStart,
    work: workPerProject(entries, projectsById, weekStart),
    habits: habitAdherence(habits, checks, weekStart),
    tasks: completedTasksInWeek(completedTasks, projectsById, weekStart),
    keyResults: krProgressChanges(
      keyResults,
      objectives,
      habitCheckIns,
      previousSnapshots,
    ),
  );
}
