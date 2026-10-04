import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../../../core/db/app_database.dart';
import '../../../core/db/database_providers.dart';
import '../../../core/db/ids.dart' show idGeneratorProvider;
import '../../../core/db/repository_support.dart';
import '../../../core/time/clock.dart' show clockProvider;

part 'key_result_repository.g.dart';

class KeyResultRepository extends Repository {
  KeyResultRepository(super.db, super.clock, super.newId);

  SimpleSelectStatement<$KeyResultsTable, KeyResult> _query() =>
      db.select(db.keyResults)
        ..where(alive)
        ..orderBy([
          (k) => OrderingTerm(expression: k.sortOrder),
          (k) => OrderingTerm(expression: k.createdAt),
        ]);

  /// All KRs of all objectives, in sort order.
  Stream<List<KeyResult>> watchAll() => _query().watch();

  Stream<List<KeyResult>> watchForObjectives(Iterable<String> objectiveIds) =>
      (_query()..where((k) => k.objectiveId.isIn(objectiveIds))).watch();

  Stream<KeyResult?> watch(String id) =>
      (_query()..where((k) => k.id.equals(id))).watchSingleOrNull();

  Future<KeyResult?> get(String id) =>
      (_query()..where((k) => k.id.equals(id))).getSingleOrNull();

  /// Adds a KR after the objective's existing KRs. Fields that do not apply
  /// to [measureType] are cleared (see [_normalized]).
  Future<KeyResult> create({
    required String objectiveId,
    required String title,
    String description = '',
    required MeasureType measureType,
    double? startValue,
    double? targetValue,
    double? currentValue,
    String? unit,
    String? habitId,
    CalendarDate? deadline,
  }) async {
    final now = clock();
    final sortOrder = await nextSortOrder(
      db.keyResults,
      (k) => k.sortOrder,
      (k) => k.objectiveId.equals(objectiveId),
    );
    final kr = _normalized(
      KeyResult(
        id: newId(),
        createdAt: now,
        updatedAt: now,
        objectiveId: objectiveId,
        title: title,
        description: description,
        measureType: measureType,
        startValue: startValue,
        targetValue: targetValue,
        currentValue: currentValue,
        unit: unit,
        habitId: habitId,
        deadline: deadline,
        sortOrder: sortOrder,
      ),
    );
    await db.into(db.keyResults).insert(kr);
    return kr;
  }

  Future<void> update(KeyResult kr) => db
      .update(db.keyResults)
      .replace(_normalized(kr.copyWith(updatedAt: clock())));

  /// Soft-deletes the KR; its projects and habits keep existing without it.
  Future<void> delete(String id) => db.transaction(() async {
    await clearReference(
      db.projects,
      'key_result_id',
      (p) => p.keyResultId.equals(id),
    );
    await clearReference(
      db.habits,
      'key_result_id',
      (h) => h.keyResultId.equals(id),
    );
    await softDeleteWhere(db.keyResults, (k) => k.id.equals(id));
  });

  /// Trims text and keeps only the measure fields of the KR's type:
  /// numeric uses start/target/current/unit; boolean stores achieved as
  /// current 1/0 with start 0 and target 1; habit uses target and habit.
  KeyResult _normalized(KeyResult kr) {
    final unit = kr.unit?.trim();
    final base = kr.copyWith(
      title: kr.title.trim(),
      description: kr.description.trim(),
    );
    return switch (kr.measureType) {
      MeasureType.numeric => base.copyWith(
        unit: Value(unit == null || unit.isEmpty ? null : unit),
        habitId: const Value(null),
      ),
      MeasureType.boolean => base.copyWith(
        startValue: const Value(0),
        targetValue: const Value(1),
        currentValue: Value(kr.currentValue == 1 ? 1 : 0),
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
KeyResultRepository keyResultRepository(Ref ref) => KeyResultRepository(
  ref.watch(appDatabaseProvider),
  ref.watch(clockProvider),
  ref.watch(idGeneratorProvider),
);

/// All KRs of all objectives, in sort order.
@riverpod
Stream<List<KeyResult>> keyResults(Ref ref) =>
    ref.watch(keyResultRepositoryProvider).watchAll();

@riverpod
Stream<KeyResult?> keyResult(Ref ref, String id) =>
    ref.watch(keyResultRepositoryProvider).watch(id);
