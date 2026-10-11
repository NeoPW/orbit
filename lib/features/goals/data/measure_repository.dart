import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../../../core/db/app_database.dart';
import '../../../core/db/database_providers.dart';
import '../../../core/db/ids.dart' show idGeneratorProvider;
import '../../../core/db/repository_support.dart';
import '../../../core/time/clock.dart' show clockProvider;

part 'measure_repository.g.dart';

class MeasureRepository extends Repository {
  MeasureRepository(super.db, super.clock, super.newId);

  SimpleSelectStatement<$MeasuresTable, Measure> _query() =>
      db.select(db.measures)
        ..where(alive)
        ..orderBy([
          (m) => OrderingTerm(expression: m.sortOrder),
          (m) => OrderingTerm(expression: m.createdAt),
        ]);

  /// All measures of all goals, in sort order.
  Stream<List<Measure>> watchAll() => _query().watch();

  Stream<Measure?> watch(String id) =>
      (_query()..where((m) => m.id.equals(id))).watchSingleOrNull();

  Future<Measure?> get(String id) =>
      (_query()..where((m) => m.id.equals(id))).getSingleOrNull();

  /// Adds a measure after the goal's existing measures. Fields that do not
  /// apply to [measureType] are cleared (see [_normalized]).
  Future<Measure> create({
    required String goalId,
    required String title,
    String description = '',
    required MeasureType measureType,
    double? startValue,
    double? targetValue,
    double? currentValue,
    String? unit,
    double step = 1,
    String? habitId,
  }) async {
    final now = clock();
    final sortOrder = await nextSortOrder(
      db.measures,
      (m) => m.sortOrder,
      (m) => m.goalId.equals(goalId),
    );
    final measure = _normalized(
      Measure(
        id: newId(),
        createdAt: now,
        updatedAt: now,
        goalId: goalId,
        title: title,
        description: description,
        measureType: measureType,
        startValue: startValue,
        targetValue: targetValue,
        currentValue: currentValue,
        unit: unit,
        step: step,
        habitId: habitId,
        sortOrder: sortOrder,
      ),
    );
    await db.into(db.measures).insert(measure);
    return measure;
  }

  Future<void> update(Measure measure) => db
      .update(db.measures)
      .replace(_normalized(measure.copyWith(updatedAt: clock())));

  /// Sets only the current value (1 or 0 for an achieved/not achieved
  /// boolean measure), e.g. from the goal page or the weekly review.
  Future<void> setProgressValue(String id, double current) =>
      (db.update(db.measures)..where((m) => m.id.equals(id) & alive(m))).write(
        MeasuresCompanion(
          currentValue: Value(current),
          updatedAt: Value(clock()),
        ),
      );

  /// Changes a numeric measure's current value by [delta] (the − / +
  /// buttons), reading the stored value in the same transaction so quick
  /// taps add up. The value is not limited to start or target.
  Future<void> nudge(String id, double delta) => db.transaction(() async {
    final measure = await get(id);
    if (measure == null || measure.measureType != MeasureType.numeric) return;
    await setProgressValue(id, (measure.currentValue ?? 0) + delta);
  });

  /// Soft-deletes the measure.
  Future<void> delete(String id) =>
      softDeleteWhere(db.measures, (m) => m.id.equals(id));

  /// For every habit measure, the number of live check-ins of its linked
  /// habit on or after its goal's start date (measures spec, "Habit
  /// measure progress"). Habit measures without a linked habit count 0.
  Stream<Map<String, int>> watchHabitCheckIns() {
    final measure = db.measures;
    final goal = db.goals;
    final checks = db.habitChecks;
    final count = checks.id.count();
    final query =
        db.selectOnly(measure).join([
            innerJoin(
              goal,
              goal.id.equalsExp(measure.goalId),
              useColumns: false,
            ),
            leftOuterJoin(
              checks,
              checks.habitId.equalsExp(measure.habitId) &
                  checks.deletedAt.isNull() &
                  // ISO dates compare as text.
                  checks.date.isBiggerOrEqual(goal.startDate),
              useColumns: false,
            ),
          ])
          ..addColumns([measure.id, count])
          ..where(
            alive(measure) & measure.measureType.equalsValue(MeasureType.habit),
          )
          ..groupBy([measure.id]);
    return query.watch().map(
      (rows) => {
        for (final row in rows) row.read(measure.id)!: row.read(count)!,
      },
    );
  }

  /// Trims text and keeps only the fields of the measure's type: numeric
  /// uses start/target/current/unit; boolean stores achieved as current
  /// 1/0 with start 0 and target 1; habit uses target and habit.
  Measure _normalized(Measure measure) {
    final unit = measure.unit?.trim();
    final base = measure.copyWith(
      title: measure.title.trim(),
      description: measure.description.trim(),
    );
    return switch (measure.measureType) {
      MeasureType.numeric => base.copyWith(
        unit: Value(unit == null || unit.isEmpty ? null : unit),
        habitId: const Value(null),
      ),
      MeasureType.boolean => base.copyWith(
        startValue: const Value(0),
        targetValue: const Value(1),
        currentValue: Value(measure.currentValue == 1 ? 1 : 0),
        unit: const Value(null),
        habitId: const Value(null),
      ),
      MeasureType.habit => base.copyWith(
        startValue: const Value(null),
        currentValue: const Value(null),
        unit: const Value(null),
      ),
    };
  }
}

@Riverpod(keepAlive: true)
MeasureRepository measureRepository(Ref ref) => MeasureRepository(
  ref.watch(appDatabaseProvider),
  ref.watch(clockProvider),
  ref.watch(idGeneratorProvider),
);

/// All measures of all goals, in sort order.
@riverpod
Stream<List<Measure>> measures(Ref ref) =>
    ref.watch(measureRepositoryProvider).watchAll();

@riverpod
Stream<Measure?> measure(Ref ref, String id) =>
    ref.watch(measureRepositoryProvider).watch(id);

/// Check-ins counted towards each habit measure, by measure ID.
@riverpod
Stream<Map<String, int>> habitCheckIns(Ref ref) =>
    ref.watch(measureRepositoryProvider).watchHabitCheckIns();
