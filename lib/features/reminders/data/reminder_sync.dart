import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../../../core/async.dart';
import '../../../core/db/app_database.dart';
import '../../../core/notifications/notification_scheduler.dart';
import '../../../core/notifications/planned_reminder.dart';
import '../../../core/time/clock.dart';
import '../../../core/time/today.dart';
import '../../habits/data/habit_check_repository.dart';
import '../../habits/data/habit_repository.dart';
import '../../home/domain/upcoming_deadlines.dart';
import '../../key_results/data/key_result_repository.dart';
import '../../objectives/data/objective_repository.dart';
import '../../projects/data/project_repository.dart';
import '../../review/data/review_repository.dart';
import '../../settings/data/settings_repository.dart';
import '../../settings/domain/app_settings.dart';
import '../../tasks/data/task_repository.dart';
import '../domain/plan_reminders.dart';

part 'reminder_sync.g.dart';

/// Everything the reminder plan depends on.
class ReminderInputs {
  const ReminderInputs({
    required this.settings,
    required this.habits,
    required this.checks,
    required this.projects,
    required this.keyResults,
    required this.deadlines,
    required this.completedReviewWeeks,
  });

  final AppSettings settings;
  final List<Habit> habits;
  final List<HabitCheck> checks;
  final Map<String, Project> projects;
  final Map<String, KeyResult> keyResults;
  final List<UpcomingDeadline> deadlines;

  /// Weeks (Monday) whose review is completed.
  final Set<CalendarDate> completedReviewWeeks;
}

/// The current [ReminderInputs], updated after every relevant write.
@riverpod
AsyncValue<ReminderInputs> reminderInputs(Ref ref) {
  final today = ref.watch(todayProvider);
  final settings = ref.watch(appSettingsProvider);
  final habits = ref.watch(habitsProvider);
  final checks = ref.watch(habitChecksSinceProvider(today.weekStart));
  final projects = ref.watch(allProjectsProvider);
  final keyResults = ref.watch(keyResultsProvider);
  final objectives = ref.watch(objectivesProvider);
  final tasks = ref.watch(dueTasksProvider);
  final outside = ref.watch(tasksOutsideProjectsProvider);
  final checkIns = ref.watch(habitCheckInsProvider);
  final reviews = ref.watch(completedReviewsProvider);
  return combineAsync(
    [
      settings,
      habits,
      checks,
      projects,
      keyResults,
      objectives,
      tasks,
      outside,
      checkIns,
      reviews,
    ],
    () {
      final allProjects = projects.requireValue;
      return ReminderInputs(
        settings: settings.requireValue,
        habits: habits.requireValue,
        checks: checks.requireValue,
        projects: {for (final p in allProjects) p.id: p},
        keyResults: {for (final k in keyResults.requireValue) k.id: k},
        deadlines: deadlineCandidates(
          tasks: tasks.requireValue,
          tasksOutsideProjects: outside.requireValue,
          projects: allProjects,
          keyResults: keyResults.requireValue,
          objectives: objectives.requireValue,
          habitCheckIns: checkIns.requireValue,
          today: today,
        ),
        completedReviewWeeks: {
          for (final review in reviews.requireValue) review.weekStart,
        },
      );
    },
  );
}

/// Keeps the scheduled reminders equal to the current plan (notifications
/// spec, "Reminders stay up to date"): re-plans after changes (debounced),
/// and when the app returns to the foreground. Watched by
/// `ReminderSyncScope` while the app runs.
@Riverpod(keepAlive: true)
class ReminderSync extends _$ReminderSync {
  static const debounce = Duration(milliseconds: 500);

  Timer? _timer;
  List<PlannedReminder>? _lastSent;

  @override
  void build() {
    ref.listen(
      reminderInputsProvider,
      (_, next) => _scheduleSoon(),
      fireImmediately: true,
    );
    final lifecycle = AppLifecycleListener(onResume: _scheduleSoon);
    ref.onDispose(() {
      _timer?.cancel();
      lifecycle.dispose();
    });
  }

  void _scheduleSoon() {
    _timer?.cancel();
    _timer = Timer(debounce, _send);
  }

  Future<void> _send() async {
    final inputs = ref.read(reminderInputsProvider);
    if (!inputs.hasValue) return;
    final value = inputs.requireValue;
    final plan = planReminders(
      settings: value.settings,
      habits: value.habits,
      checks: value.checks,
      projects: value.projects,
      keyResults: value.keyResults,
      deadlines: value.deadlines,
      completedReviewWeeks: value.completedReviewWeeks,
      now: ref.read(clockProvider)().toLocal(),
    );
    if (listEquals(plan, _lastSent)) return;
    _lastSent = plan;
    await ref.read(notificationSchedulerProvider).replaceAll(plan);
  }
}
