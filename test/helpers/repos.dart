import 'package:orbit/core/db/app_database.dart';
import 'package:orbit/features/areas/data/area_repository.dart';
import 'package:orbit/features/habits/data/habit_check_repository.dart';
import 'package:orbit/features/habits/data/habit_repository.dart';
import 'package:orbit/features/key_results/data/key_result_repository.dart';
import 'package:orbit/features/log/data/log_repository.dart';
import 'package:orbit/features/objectives/data/objective_repository.dart';
import 'package:orbit/features/projects/data/project_repository.dart';
import 'package:orbit/features/tasks/data/task_repository.dart';

import 'test_db.dart';

/// All repositories on one in-memory database with a test clock and IDs.
class Repos {
  Repos() : db = newTestDatabase() {
    clock = TestClock();
    final ids = TestIds();
    areas = AreaRepository(db, clock.call, ids.call);
    objectives = ObjectiveRepository(db, clock.call, ids.call);
    keyResults = KeyResultRepository(db, clock.call, ids.call);
    tasks = TaskRepository(db, clock.call, ids.call);
    projects = ProjectRepository(db, clock.call, ids.call);
    habits = HabitRepository(db, clock.call, ids.call);
    logs = LogRepository(db, clock.call, ids.call);
    habitChecks = HabitCheckRepository(db, clock.call, ids.call);
  }

  final AppDatabase db;
  late final TestClock clock;
  late final AreaRepository areas;
  late final ObjectiveRepository objectives;
  late final KeyResultRepository keyResults;
  late final TaskRepository tasks;
  late final ProjectRepository projects;
  late final HabitRepository habits;
  late final LogRepository logs;
  late final HabitCheckRepository habitChecks;

  Future<void> close() => db.close();

  /// Reads a row regardless of soft delete.
  Future<Project> rawProject(String id) =>
      (db.select(db.projects)..where((p) => p.id.equals(id))).getSingle();
  Future<Habit> rawHabit(String id) =>
      (db.select(db.habits)..where((h) => h.id.equals(id))).getSingle();
  Future<KeyResult> rawKeyResult(String id) =>
      (db.select(db.keyResults)..where((k) => k.id.equals(id))).getSingle();
  Future<Task> rawTask(String id) =>
      (db.select(db.tasks)..where((t) => t.id.equals(id))).getSingle();
  Future<LogEntry> rawLogEntry(String id) =>
      (db.select(db.logEntries)..where((e) => e.id.equals(id))).getSingle();
  Future<List<HabitCheck>> rawHabitChecks() => db.select(db.habitChecks).get();
  Future<Objective> rawObjective(String id) =>
      (db.select(db.objectives)..where((o) => o.id.equals(id))).getSingle();

  Future<Objective> objective({String title = 'Get fit'}) => objectives.create(
    title: title,
    startDate: CalendarDate(2026, 10, 1),
    endDate: CalendarDate(2026, 12, 31),
  );

  Future<KeyResult> numericKr(String objectiveId, {String title = 'Run'}) =>
      keyResults.create(
        objectiveId: objectiveId,
        title: title,
        measureType: MeasureType.numeric,
        startValue: 0,
        targetValue: 100,
        currentValue: 0,
      );
}
