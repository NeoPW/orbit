import '../../../core/db/app_database.dart';
import '../../goals/domain/goal_progress.dart';
import '../../goals/domain/goal_work.dart';
import '../../goals/domain/measure_progress.dart';

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
    this.goalId,
  });

  /// Null for entries without a project.
  final String? projectId;

  /// The goal the project serves now, if any.
  final String? goalId;
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
        goalId: projects[id]?.goalId,
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

/// A task completed in the week, with its project or goal if it still
/// exists.
typedef CompletedTask = ({Task task, Project? project, Goal? goal});

/// Done tasks whose local completion date is in the week, newest first.
List<CompletedTask> completedTasksInWeek(
  List<Task> tasks,
  Map<String, Project> projects,
  CalendarDate weekStart, {
  Map<String, Goal> goals = const {},
}) {
  final done = [
    for (final task in tasks)
      if (task.status == TaskStatus.done &&
          task.completedAt != null &&
          _inWeek(CalendarDate.fromDateTime(task.completedAt!), weekStart))
        (
          task: task,
          project: projects[task.projectId],
          goal: goals[task.goalId],
        ),
  ];
  return done
    ..sort((a, b) => b.task.completedAt!.compareTo(a.task.completedAt!));
}

/// Projects whose local completion date is in the week, newest first, with
/// the goal they serve (week-summary spec, "Finished projects").
typedef FinishedProject = ({Project project, Goal? goal});

List<FinishedProject> finishedProjectsInWeek(
  List<Project> projects,
  Map<String, Goal> goals,
  CalendarDate weekStart,
) {
  final finished = [
    for (final project in projects)
      if (project.status == ProjectStatus.completed &&
          project.completedAt != null &&
          _inWeek(
            CalendarDate.fromDateTime(project.completedAt!.toLocal()),
            weekStart,
          ))
        (project: project, goal: goals[project.goalId]),
  ];
  return finished
    ..sort((a, b) => b.project.completedAt!.compareTo(a.project.completedAt!));
}

/// The work of a week under one goal, or without a goal ([goal] null).
class WorkGroup {
  const WorkGroup({required this.goal, required this.projects});

  final Goal? goal;
  final List<ProjectWork> projects;
}

/// [work] grouped by the goal each project serves: goals in [goals] order,
/// then the projects without a goal (and "No project").
List<WorkGroup> workByGoal(List<ProjectWork> work, List<Goal> goals) {
  final byGoal = {for (final g in goals) g.id: g};
  final groups = <String?, List<ProjectWork>>{};
  for (final item in work) {
    final key = byGoal.containsKey(item.goalId) ? item.goalId : null;
    groups.putIfAbsent(key, () => []).add(item);
  }
  return [
    for (final goal in goals)
      if (groups[goal.id] case final projects?)
        WorkGroup(goal: goal, projects: projects),
    if (groups[null] case final projects?)
      WorkGroup(goal: null, projects: projects),
  ];
}

/// A measure's progress and its change since the previous review.
class MeasureChange {
  const MeasureChange({
    required this.measure,
    required this.progress,
    required this.change,
  });

  final Measure measure;

  /// 0–1.
  final double progress;

  /// Percentage points since the most recent earlier snapshot, or null
  /// without one.
  final int? change;
}

/// A goal's progress, its change since the previous review, its measures
/// and the work on it in the week (week-summary spec, "Goals in the
/// summary").
class GoalProgressChange {
  const GoalProgressChange({
    required this.goal,
    required this.measures,
    this.work = WorkTotal.none,
  });

  final Goal goal;
  final List<MeasureChange> measures;
  final WorkTotal work;

  /// The average of the measures, null without measures.
  double? get progress => goalProgress(measures.map((m) => m.progress));

  /// Percentage points since the previous review, over the measures that
  /// had an earlier snapshot; null when none had one.
  int? get change {
    final compared = [
      for (final m in measures)
        if (m.change != null) m,
    ];
    if (compared.isEmpty) return null;
    final now = compared.fold(0.0, (sum, m) => sum + m.progress);
    final before = compared.fold(
      0.0,
      (sum, m) => sum + (m.progress - m.change! / 100),
    );
    return ((now - before) / compared.length * 100).round();
  }
}

int? _changeOf(double progress, double? previous) =>
    previous == null ? null : ((progress - previous) * 100).round();

int Function(T, T) _bySortOrder<T>(
  int Function(T) sortOrder,
  DateTime Function(T) createdAt,
) => (a, b) {
  final bySortOrder = sortOrder(a).compareTo(sortOrder(b));
  return bySortOrder != 0 ? bySortOrder : createdAt(a).compareTo(createdAt(b));
};

/// The active goals with the current progress of their measures and the
/// change since [previousSnapshots] (progress by measure ID).
List<GoalProgressChange> goalProgressChanges(
  List<Goal> goals,
  List<Measure> measures,
  Map<String, int> habitCheckIns,
  Map<String, double> previousSnapshots, {
  Map<String, WorkTotal> work = const {},
}) => [
  for (final goal
      in goals.where((g) => g.status == GoalStatus.active).toList()
        ..sort(_bySortOrder((g) => g.sortOrder, (g) => g.createdAt)))
    GoalProgressChange(
      goal: goal,
      work: work[goal.id] ?? WorkTotal.none,
      measures: [
        for (final measure
            in measures.where((m) => m.goalId == goal.id).toList()
              ..sort(_bySortOrder((m) => m.sortOrder, (m) => m.createdAt)))
          if (measureProgress(
                measure,
                habitCheckIns: habitCheckIns[measure.id] ?? 0,
              )
              case final progress)
            MeasureChange(
              measure: measure,
              progress: progress,
              change: _changeOf(progress, previousSnapshots[measure.id]),
            ),
      ],
    ),
];

/// The goals as stored with a week's completed review: the goals of the
/// measures in [snapshots] (progress by measure ID), with the change since
/// [previousSnapshots]. Measures deleted since the review are left out.
List<GoalProgressChange> snapshotProgressChanges(
  List<Goal> goals,
  List<Measure> measures,
  Map<String, double> snapshots,
  Map<String, double> previousSnapshots, {
  Map<String, WorkTotal> work = const {},
}) {
  final byGoal = <String, List<MeasureChange>>{};
  for (final measure
      in measures.toList()
        ..sort(_bySortOrder((m) => m.sortOrder, (m) => m.createdAt))) {
    final progress = snapshots[measure.id];
    if (progress == null) continue;
    byGoal
        .putIfAbsent(measure.goalId, () => [])
        .add(
          MeasureChange(
            measure: measure,
            progress: progress,
            change: _changeOf(progress, previousSnapshots[measure.id]),
          ),
        );
  }
  return [
    for (final goal
        in goals.toList()
          ..sort(_bySortOrder((g) => g.sortOrder, (g) => g.createdAt)))
      if (byGoal[goal.id] case final changes?)
        GoalProgressChange(
          goal: goal,
          measures: changes,
          work: work[goal.id] ?? WorkTotal.none,
        ),
  ];
}

/// Everything the Review tab and the look-back step show about a week.
class WeekSummary {
  const WeekSummary({
    required this.weekStart,
    required this.goals,
    required this.work,
    required this.workGroups,
    required this.finishedProjects,
    required this.tasks,
    required this.habits,
  });

  final CalendarDate weekStart;
  final List<GoalProgressChange> goals;
  final List<ProjectWork> work;
  final List<WorkGroup> workGroups;
  final List<FinishedProject> finishedProjects;
  final List<CompletedTask> tasks;
  final List<HabitAdherence> habits;
}

WeekSummary buildWeekSummary({
  required CalendarDate weekStart,
  required List<LogEntry> entries,
  required List<Habit> habits,
  required List<HabitCheck> checks,
  required List<Task> completedTasks,
  required List<Project> projects,
  required List<Goal> goals,
  required List<Measure> measures,
  required Map<String, int> habitCheckIns,
  required Map<String, double> previousSnapshots,
  Map<String, double>? reviewSnapshots,
}) {
  final projectsById = {for (final p in projects) p.id: p};
  final goalsById = {for (final g in goals) g.id: g};
  final weekEntries = [
    for (final entry in entries)
      if (_inWeek(CalendarDate.fromDateTime(entry.occurredAt), weekStart))
        entry,
  ];
  final goalWork = workPerGoal(
    weekEntries,
    projectGoals: {for (final p in projects) p.id: p.goalId},
    tasks: {for (final t in completedTasks) t.id: t},
  );
  final work = workPerProject(entries, projectsById, weekStart);
  final orderedGoals = goals.toList()
    ..sort(_bySortOrder((g) => g.sortOrder, (g) => g.createdAt));
  return WeekSummary(
    weekStart: weekStart,
    // A reviewed week shows the progress saved with its review.
    goals: reviewSnapshots == null
        ? goalProgressChanges(
            goals,
            measures,
            habitCheckIns,
            previousSnapshots,
            work: goalWork,
          )
        : snapshotProgressChanges(
            goals,
            measures,
            reviewSnapshots,
            previousSnapshots,
            work: goalWork,
          ),
    work: work,
    workGroups: workByGoal(work, orderedGoals),
    finishedProjects: finishedProjectsInWeek(projects, goalsById, weekStart),
    tasks: completedTasksInWeek(
      completedTasks,
      projectsById,
      weekStart,
      goals: goalsById,
    ),
    habits: habitAdherence(habits, checks, weekStart),
  );
}
