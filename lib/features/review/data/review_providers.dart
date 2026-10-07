import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../../../core/async.dart';
import '../../../core/db/app_database.dart';
import '../../../core/time/today.dart';
import '../../habits/data/habit_check_repository.dart';
import '../../habits/data/habit_repository.dart';
import '../../key_results/data/key_result_repository.dart';
import '../../log/data/log_repository.dart';
import '../../objectives/data/objective_repository.dart';
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
  final keyResults = ref.watch(keyResultsProvider);
  final objectives = ref.watch(objectivesProvider);
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
      keyResults,
      objectives,
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
      keyResults: keyResults.requireValue,
      objectives: objectives.requireValue,
      habitCheckIns: checkIns.requireValue,
      previousSnapshots: snapshots.requireValue,
      reviewSnapshots: reviewed.requireValue,
    ),
  );
}

/// The KRs of active objectives with their current progress and the change
/// since the latest review before [weekStart], live. The weekly review
/// edits and saves these, also for a week already reviewed.
@riverpod
AsyncValue<List<KrProgressChange>> currentKrProgress(
  Ref ref,
  CalendarDate weekStart,
) {
  final keyResults = ref.watch(keyResultsProvider);
  final objectives = ref.watch(objectivesProvider);
  final checkIns = ref.watch(habitCheckInsProvider);
  final snapshots = ref.watch(latestSnapshotsBeforeProvider(weekStart));
  return combineAsync(
    [keyResults, objectives, checkIns, snapshots],
    () => krProgressChanges(
      keyResults.requireValue,
      objectives.requireValue,
      checkIns.requireValue,
      snapshots.requireValue,
    ),
  );
}
