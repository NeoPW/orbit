import 'package:orbit/core/db/app_database.dart';
import 'package:orbit/features/habits/data/habit_check_repository.dart';
import 'package:orbit/features/habits/data/habit_repository.dart';
import 'package:orbit/features/goals/data/goal_repository.dart';
import 'package:orbit/features/goals/data/measure_repository.dart';
import 'package:orbit/features/log/data/log_repository.dart';
import 'package:orbit/features/projects/data/project_repository.dart';
import 'package:orbit/features/tasks/data/task_repository.dart';
import 'package:orbit/core/db/ids.dart';

/// Writes test data straight through the repositories (real clock and IDs).
class Seed {
  Seed(AppDatabase db)
    : goals = GoalRepository(db, _now, uuidV4),
      measures = MeasureRepository(db, _now, uuidV4),
      projects = ProjectRepository(db, _now, uuidV4),
      habits = HabitRepository(db, _now, uuidV4),
      tasks = TaskRepository(db, _now, uuidV4),
      logs = LogRepository(db, _now, uuidV4),
      habitChecks = HabitCheckRepository(db, _now, uuidV4);

  static DateTime _now() => DateTime.now().toUtc();

  final GoalRepository goals;
  final MeasureRepository measures;
  final ProjectRepository projects;
  final HabitRepository habits;
  final TaskRepository tasks;
  final LogRepository logs;
  final HabitCheckRepository habitChecks;

  Future<Goal> goal({
    String title = 'Get fit',
    CalendarDate? start,
    CalendarDate? end,
    String? color,
  }) => goals.create(
    title: title,
    startDate: start ?? CalendarDate(2026, 10, 1),
    endDate: end ?? CalendarDate(2026, 12, 31),
    color: color,
  );

  Future<Measure> measure(
    String goalId, {
    String title = 'Run 100 km',
    MeasureType type = MeasureType.numeric,
    double? start = 0,
    double? target = 100,
    double? current = 20,
    String? unit = 'km',
    double step = 1,
    String? habitId,
  }) => measures.create(
    goalId: goalId,
    title: title,
    measureType: type,
    startValue: start,
    targetValue: target,
    currentValue: current,
    unit: unit,
    step: step,
    habitId: habitId,
  );
}
