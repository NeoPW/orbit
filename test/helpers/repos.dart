import 'package:orbit/core/db/app_database.dart';
import 'package:orbit/features/areas/data/area_repository.dart';
import 'package:orbit/features/goals/data/goal_repository.dart';
import 'package:orbit/features/goals/data/measure_repository.dart';
import 'package:orbit/features/habits/data/habit_check_repository.dart';
import 'package:orbit/features/habits/data/habit_repository.dart';
import 'package:orbit/features/log/data/log_repository.dart';
import 'package:orbit/features/projects/data/project_repository.dart';
import 'package:orbit/features/review/data/review_repository.dart';
import 'package:orbit/features/tasks/data/task_repository.dart';

import 'test_db.dart';

/// All repositories on one in-memory database with a test clock and IDs.
class Repos {
  Repos() : db = newTestDatabase() {
    clock = TestClock();
    final ids = TestIds();
    areas = AreaRepository(db, clock.call, ids.call);
    goals = GoalRepository(db, clock.call, ids.call);
    measures = MeasureRepository(db, clock.call, ids.call);
    tasks = TaskRepository(db, clock.call, ids.call);
    projects = ProjectRepository(db, clock.call, ids.call);
    habits = HabitRepository(db, clock.call, ids.call);
    logs = LogRepository(db, clock.call, ids.call);
    habitChecks = HabitCheckRepository(db, clock.call, ids.call);
    reviews = ReviewRepository(db, clock.call, ids.call);
  }

  final AppDatabase db;
  late final TestClock clock;
  late final AreaRepository areas;
  late final GoalRepository goals;
  late final MeasureRepository measures;
  late final TaskRepository tasks;
  late final ProjectRepository projects;
  late final HabitRepository habits;
  late final LogRepository logs;
  late final HabitCheckRepository habitChecks;
  late final ReviewRepository reviews;

  Future<void> close() => db.close();

  /// Reads a row regardless of soft delete.
  Future<Project> rawProject(String id) =>
      (db.select(db.projects)..where((p) => p.id.equals(id))).getSingle();
  Future<Habit> rawHabit(String id) =>
      (db.select(db.habits)..where((h) => h.id.equals(id))).getSingle();
  Future<Measure> rawMeasure(String id) =>
      (db.select(db.measures)..where((m) => m.id.equals(id))).getSingle();
  Future<Task> rawTask(String id) =>
      (db.select(db.tasks)..where((t) => t.id.equals(id))).getSingle();
  Future<LogEntry> rawLogEntry(String id) =>
      (db.select(db.logEntries)..where((e) => e.id.equals(id))).getSingle();
  Future<List<HabitCheck>> rawHabitChecks() => db.select(db.habitChecks).get();
  Future<Goal> rawGoal(String id) =>
      (db.select(db.goals)..where((g) => g.id.equals(id))).getSingle();

  Future<Goal> goal({String title = 'Get fit'}) => goals.create(
    title: title,
    startDate: CalendarDate(2026, 10, 1),
    endDate: CalendarDate(2026, 12, 31),
  );

  Future<Measure> numericMeasure(String goalId, {String title = 'Run'}) =>
      measures.create(
        goalId: goalId,
        title: title,
        measureType: MeasureType.numeric,
        startValue: 0,
        targetValue: 100,
        currentValue: 0,
      );
}
