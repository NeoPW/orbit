import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../../../core/async.dart';
import '../../../core/db/app_database.dart';
import '../../../core/time/today.dart';
import '../../areas/data/area_repository.dart';
import '../../habits/data/habit_check_repository.dart';
import '../../habits/data/habit_repository.dart';
import '../../goals/data/goal_repository.dart';
import '../../projects/data/project_repository.dart';
import '../../projects/domain/project_deadline.dart';
import '../../settings/data/settings_repository.dart';
import '../../tasks/data/task_repository.dart';
import '../domain/home_habits.dart';
import '../domain/project_score.dart';
import '../domain/upcoming_deadlines.dart';

part 'home_providers.g.dart';

/// Home's "Habits due today".
@riverpod
AsyncValue<List<HomeHabit>> homeHabits(Ref ref) {
  final today = ref.watch(todayProvider);
  final habits = ref.watch(habitsProvider);
  final checks = ref.watch(habitChecksSinceProvider(today.weekStart));
  final projects = ref.watch(allProjectsProvider);
  final goals = ref.watch(goalsProvider);
  return combineAsync(
    [habits, checks, projects, goals],
    () => buildHomeHabits(
      habits: habits.requireValue,
      checks: checks.requireValue,
      projects: {for (final p in projects.requireValue) p.id: p},
      goals: {for (final g in goals.requireValue) g.id: g},
      today: today,
    ),
  );
}

/// Home's "Upcoming deadlines".
@riverpod
AsyncValue<List<UpcomingDeadline>> upcomingDeadlines(Ref ref) {
  final today = ref.watch(todayProvider);
  final tasks = ref.watch(dueTasksProvider);
  final outside = ref.watch(tasksOutsideProjectsProvider);
  final projects = ref.watch(activeProjectsProvider);
  final settings = ref.watch(appSettingsProvider);
  return combineAsync(
    [tasks, outside, projects, settings],
    () => buildUpcomingDeadlines(
      tasks: tasks.requireValue,
      tasksOutsideProjects: outside.requireValue,
      projects: projects.requireValue,
      today: today,
      leadDays: settings.requireValue.deadlineLeadDays,
    ),
  );
}

/// An active project as shown on Home.
class HomeProject {
  const HomeProject({
    required this.scored,
    required this.area,
    required this.nextStep,
    this.goal,
  });

  final ScoredProject scored;
  final Area? area;
  final Task? nextStep;

  /// The goal the project serves, if any.
  final Goal? goal;

  Project get project => scored.project;
}

/// Home's "Active projects", ordered by score.
@riverpod
AsyncValue<List<HomeProject>> homeProjects(Ref ref) {
  final today = ref.watch(todayProvider);
  final projects = ref.watch(activeProjectsProvider);
  final areas = ref.watch(areasProvider);
  final goals = ref.watch(goalsProvider);
  final tasks = ref.watch(openTasksProvider);
  return combineAsync([projects, areas, goals, tasks], () {
    final areasById = {for (final a in areas.requireValue) a.id: a};
    final goalsById = {for (final g in goals.requireValue) g.id: g};
    final tasksById = {for (final t in tasks.requireValue) t.id: t};

    EffectiveDeadline? deadline(Project project) => effectiveProjectDeadline(
      project.deadline,
      goalsById[project.goalId]?.endDate,
    );

    final scored = [
      for (final project in projects.requireValue)
        ScoredProject(project, deadline(project), today: today),
    ]..sort(compareProjectsForHome);
    return [
      for (final s in scored)
        HomeProject(
          scored: s,
          area: areasById[s.project.areaId],
          nextStep: tasksById[s.project.nextStepTaskId],
          goal: goalsById[s.project.goalId],
        ),
    ];
  });
}

/// The today header's numbers (home spec, "Today header").
typedef TodayProgress = ({int habitsDone, int habitsDue, int tasksDue});

/// Habits checked of due today, and open tasks due today or overdue.
@riverpod
AsyncValue<TodayProgress> todayProgress(Ref ref) {
  final today = ref.watch(todayProvider);
  final habits = ref.watch(homeHabitsProvider);
  final tasks = ref.watch(openTasksProvider);
  return combineAsync([habits, tasks], () {
    final listed = habits.requireValue;
    return (
      habitsDone: listed.where((h) => h.checkedToday).length,
      habitsDue: listed.length,
      tasksDue: tasks.requireValue
          .where((t) => t.dueDate != null && !t.dueDate!.isAfter(today))
          .length,
    );
  });
}

/// A task on Home with the title of what it is assigned to.
typedef HomeTask = ({Task task, String? assignedTo});

/// Home's "Tasks": open tasks outside projects, by deadline (overdue first,
/// none last), then by creation (home spec, "Tasks on Home").
@riverpod
AsyncValue<List<HomeTask>> homeTasks(Ref ref) {
  final tasks = ref.watch(tasksOutsideProjectsProvider);
  final goals = ref.watch(goalsProvider);
  return combineAsync([tasks, goals], () {
    final titles = {for (final g in goals.requireValue) g.id: g.title};
    return [
      for (final task in tasks.requireValue)
        (task: task, assignedTo: titles[task.goalId]),
    ];
  });
}
