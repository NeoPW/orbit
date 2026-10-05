import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../../../core/async.dart';
import '../../../core/db/app_database.dart';
import '../../../core/time/today.dart';
import '../../areas/data/area_repository.dart';
import '../../habits/data/habit_check_repository.dart';
import '../../habits/data/habit_repository.dart';
import '../../key_results/data/key_result_repository.dart';
import '../../key_results/domain/kr_deadline.dart';
import '../../objectives/data/objective_repository.dart';
import '../../projects/data/project_repository.dart';
import '../../projects/domain/project_deadline.dart';
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
  final keyResults = ref.watch(keyResultsProvider);
  return combineAsync(
    [habits, checks, projects, keyResults],
    () => buildHomeHabits(
      habits: habits.requireValue,
      checks: checks.requireValue,
      projects: {for (final p in projects.requireValue) p.id: p},
      keyResults: {for (final k in keyResults.requireValue) k.id: k},
      today: today,
    ),
  );
}

/// Home's "Upcoming deadlines".
@riverpod
AsyncValue<List<UpcomingDeadline>> upcomingDeadlines(Ref ref) {
  final today = ref.watch(todayProvider);
  final tasks = ref.watch(dueTasksProvider);
  final projects = ref.watch(activeProjectsProvider);
  final keyResults = ref.watch(keyResultsProvider);
  final objectives = ref.watch(objectivesProvider);
  final checkIns = ref.watch(habitCheckInsProvider);
  return combineAsync(
    [tasks, projects, keyResults, objectives, checkIns],
    () => buildUpcomingDeadlines(
      tasks: tasks.requireValue,
      projects: projects.requireValue,
      keyResults: keyResults.requireValue,
      objectives: objectives.requireValue,
      habitCheckIns: checkIns.requireValue,
      today: today,
    ),
  );
}

/// An active project as shown on Home.
class HomeProject {
  const HomeProject({
    required this.scored,
    required this.area,
    required this.nextStep,
  });

  final ScoredProject scored;
  final Area? area;
  final Task? nextStep;

  Project get project => scored.project;
}

/// Home's "Active projects", ordered by score.
@riverpod
AsyncValue<List<HomeProject>> homeProjects(Ref ref) {
  final today = ref.watch(todayProvider);
  final projects = ref.watch(activeProjectsProvider);
  final areas = ref.watch(areasProvider);
  final keyResults = ref.watch(keyResultsProvider);
  final objectives = ref.watch(objectivesProvider);
  final tasks = ref.watch(openTasksProvider);
  return combineAsync([projects, areas, keyResults, objectives, tasks], () {
    final areasById = {for (final a in areas.requireValue) a.id: a};
    final krsById = {for (final k in keyResults.requireValue) k.id: k};
    final objectivesById = {for (final o in objectives.requireValue) o.id: o};
    final tasksById = {for (final t in tasks.requireValue) t.id: t};

    EffectiveDeadline? deadline(Project project) {
      final kr = krsById[project.keyResultId];
      final objective = kr == null ? null : objectivesById[kr.objectiveId];
      return effectiveProjectDeadline(
        project.deadline,
        kr == null || objective == null
            ? null
            : effectiveKrDeadline(kr.deadline, objective.endDate),
      );
    }

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
        ),
    ];
  });
}
