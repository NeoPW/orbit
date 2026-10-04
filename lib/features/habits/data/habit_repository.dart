import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../../../core/db/app_database.dart';
import '../../../core/db/database_providers.dart';
import '../../../core/db/ids.dart' show idGeneratorProvider;
import '../../../core/db/repository_support.dart';
import '../../../core/time/clock.dart' show clockProvider;

part 'habit_repository.g.dart';

class HabitRepository extends Repository {
  HabitRepository(super.db, super.clock, super.newId);

  SimpleSelectStatement<$HabitsTable, Habit> _query() => db.select(db.habits)
    ..where(alive)
    ..orderBy([
      (h) => OrderingTerm.desc(h.active),
      (h) => OrderingTerm(expression: h.title.lower()),
    ]);

  /// All habits, active first, then by title.
  Stream<List<Habit>> watchAll() => _query().watch();

  Stream<Habit?> watch(String id) =>
      (_query()..where((h) => h.id.equals(id))).watchSingleOrNull();

  Future<Habit?> get(String id) =>
      (_query()..where((h) => h.id.equals(id))).getSingleOrNull();

  /// Adds a habit. Links to a project and/or KR are optional. Schedule
  /// fields that do not apply to [scheduleType] are cleared.
  Future<Habit> create({
    required String title,
    String? projectId,
    String? keyResultId,
    required ScheduleType scheduleType,
    Set<int>? weekdays,
    int? timesPerWeek,
    String? reminderTime,
    bool active = true,
  }) async {
    final now = clock();
    final habit = _normalized(
      Habit(
        id: newId(),
        createdAt: now,
        updatedAt: now,
        title: title,
        projectId: projectId,
        keyResultId: keyResultId,
        scheduleType: scheduleType,
        weekdays: weekdays,
        timesPerWeek: timesPerWeek,
        reminderTime: reminderTime,
        active: active,
      ),
    );
    await db.into(db.habits).insert(habit);
    return habit;
  }

  Future<void> update(Habit habit) => db
      .update(db.habits)
      .replace(_normalized(habit.copyWith(updatedAt: clock())));

  /// Soft-deletes the habit; habit KRs linked to it keep existing without
  /// a linked habit.
  Future<void> delete(String id) => db.transaction(() async {
    await clearReference(
      db.keyResults,
      'habit_id',
      (k) => k.habitId.equals(id),
    );
    await softDeleteWhere(db.habits, (h) => h.id.equals(id));
  });

  Habit _normalized(Habit habit) => habit.copyWith(
    title: habit.title.trim(),
    weekdays: Value(
      habit.scheduleType == ScheduleType.weekdays ? habit.weekdays : null,
    ),
    timesPerWeek: Value(
      habit.scheduleType == ScheduleType.timesPerWeek
          ? habit.timesPerWeek
          : null,
    ),
  );
}

@Riverpod(keepAlive: true)
HabitRepository habitRepository(Ref ref) => HabitRepository(
  ref.watch(appDatabaseProvider),
  ref.watch(clockProvider),
  ref.watch(idGeneratorProvider),
);

/// All habits, active first, then by title.
@riverpod
Stream<List<Habit>> habits(Ref ref) =>
    ref.watch(habitRepositoryProvider).watchAll();

@riverpod
Stream<Habit?> habit(Ref ref, String id) =>
    ref.watch(habitRepositoryProvider).watch(id);
