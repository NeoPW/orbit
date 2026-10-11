import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../../../core/async.dart';
import '../../../core/db/app_database.dart';
import '../../../core/time/today.dart';
import '../../habits/data/habit_check_repository.dart';
import '../../habits/data/habit_repository.dart';
import '../../goals/data/goal_repository.dart';
import '../../goals/data/measure_repository.dart';
import '../../log/data/log_repository.dart';
import '../../projects/data/project_repository.dart';
import '../../tasks/data/task_repository.dart';
import '../domain/week_summary.dart';
import 'review_repository.dart';

part 'review_providers.g.dart';

/// The Monday of the current week (weekly-review spec, "Review tab").
@riverpod
CalendarDate currentWeek(Ref ref) => ref.watch(todayProvider).weekStart;

/// The Monday of the week a review made today is about.
@riverpod
CalendarDate reviewWeek(Ref ref) => reviewWeekStart(ref.watch(todayProvider));

@riverpod
Stream<List<LogEntry>> weekLogEntries(Ref ref, CalendarDate weekStart) {
  final range = weekRange(weekStart);
  return ref.watch(logRepositoryProvider).watchBetween(range.from, range.to);
}

@riverpod
Stream<List<Task>> weekCompletedTasks(Ref ref, CalendarDate weekStart) {
  final range = weekRange(weekStart);
  return ref
      .watch(taskRepositoryProvider)
      .watchCompletedBetween(range.from, range.to);
}

/// The summary of the week starting [weekStart], updated live.
@riverpod
AsyncValue<WeekSummary> weekSummary(Ref ref, CalendarDate weekStart) {
  final entries = ref.watch(weekLogEntriesProvider(weekStart));
  final habits = ref.watch(habitsProvider);
  final checks = ref.watch(habitChecksSinceProvider(weekStart));
  final tasks = ref.watch(weekCompletedTasksProvider(weekStart));
  final projects = ref.watch(allProjectsProvider);
  final goals = ref.watch(goalsProvider);
  final measures = ref.watch(measuresProvider);
  final checkIns = ref.watch(habitCheckInsProvider);
  final snapshots = ref.watch(latestSnapshotsBeforeProvider(weekStart));
  final reviewed = ref.watch(weekReviewSnapshotsProvider(weekStart));
  return combineAsync(
    [
      entries,
      habits,
      checks,
      tasks,
      projects,
      goals,
      measures,
      checkIns,
      snapshots,
      reviewed,
    ],
    () => buildWeekSummary(
      weekStart: weekStart,
      entries: entries.requireValue,
      habits: habits.requireValue,
      checks: checks.requireValue,
      completedTasks: tasks.requireValue,
      projects: projects.requireValue,
      goals: goals.requireValue,
      measures: measures.requireValue,
      habitCheckIns: checkIns.requireValue,
      previousSnapshots: snapshots.requireValue,
      reviewSnapshots: reviewed.requireValue,
    ),
  );
}

/// The active goals with the current progress of their measures and the
/// change since the latest review before [weekStart], live. The weekly
/// review edits and saves these, also for a week already reviewed.
@riverpod
AsyncValue<List<GoalProgressChange>> currentGoalProgress(
  Ref ref,
  CalendarDate weekStart,
) {
  final goals = ref.watch(goalsProvider);
  final measures = ref.watch(measuresProvider);
  final checkIns = ref.watch(habitCheckInsProvider);
  final snapshots = ref.watch(latestSnapshotsBeforeProvider(weekStart));
  return combineAsync(
    [goals, measures, checkIns, snapshots],
    () => goalProgressChanges(
      goals.requireValue,
      measures.requireValue,
      checkIns.requireValue,
      snapshots.requireValue,
    ),
  );
}
