import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../../../core/db/app_database.dart';
import '../../../core/db/database_providers.dart';
import '../../../core/db/ids.dart' show idGeneratorProvider;
import '../../../core/db/repository_support.dart';
import '../../../core/time/clock.dart' show clockProvider;

part 'objective_repository.g.dart';

class ObjectiveRepository extends Repository {
  ObjectiveRepository(super.db, super.clock, super.newId);

  SimpleSelectStatement<$ObjectivesTable, Objective> _query() =>
      db.select(db.objectives)
        ..where(alive)
        ..orderBy([
          (o) => OrderingTerm(expression: o.sortOrder),
          (o) => OrderingTerm(expression: o.createdAt),
        ]);

  /// All objectives, any status, in sort order.
  Stream<List<Objective>> watchAll() => _query().watch();

  Stream<List<Objective>> watchByStatus(Set<ObjectiveStatus> statuses) =>
      (_query()..where((o) => o.status.isInValues(statuses))).watch();

  Stream<Objective?> watch(String id) =>
      (_query()..where((o) => o.id.equals(id))).watchSingleOrNull();

  Future<Objective?> get(String id) =>
      (_query()..where((o) => o.id.equals(id))).getSingleOrNull();

  /// Adds an active objective after the existing ones.
  Future<Objective> create({
    required String title,
    String description = '',
    required CalendarDate startDate,
    required CalendarDate endDate,
  }) async {
    final now = clock();
    return db
        .into(db.objectives)
        .insertReturning(
          ObjectivesCompanion.insert(
            id: newId(),
            createdAt: now,
            updatedAt: now,
            title: title.trim(),
            description: Value(description.trim()),
            startDate: startDate,
            endDate: endDate,
            status: ObjectiveStatus.active,
            sortOrder: await nextSortOrder(db.objectives, (o) => o.sortOrder),
          ),
        );
  }

  Future<void> update(Objective objective) => db
      .update(db.objectives)
      .replace(
        objective.copyWith(
          title: objective.title.trim(),
          description: objective.description.trim(),
          updatedAt: clock(),
        ),
      );

  /// Number of live KRs of the objective (for the delete confirmation).
  Future<int> countKeyResults(String objectiveId) async {
    final count = db.keyResults.id.count();
    final query = db.selectOnly(db.keyResults)
      ..addColumns([count])
      ..where(
        db.keyResults.objectiveId.equals(objectiveId) & alive(db.keyResults),
      );
    return (await query.map((row) => row.read(count)).getSingle()) ?? 0;
  }

  /// Soft-deletes the objective and its KRs. Projects and habits linked to
  /// those KRs keep existing without the KR link.
  Future<void> delete(String id) => db.transaction(() async {
    final krIds =
        await (db.selectOnly(db.keyResults)
              ..addColumns([db.keyResults.id])
              ..where(
                db.keyResults.objectiveId.equals(id) & alive(db.keyResults),
              ))
            .map((row) => row.read(db.keyResults.id)!)
            .get();
    await clearReference(
      db.projects,
      'key_result_id',
      (p) => p.keyResultId.isIn(krIds),
    );
    await clearReference(
      db.habits,
      'key_result_id',
      (h) => h.keyResultId.isIn(krIds),
    );
    // Tasks of the objective or its KRs stay, as standalone tasks.
    await clearReference(
      db.tasks,
      'key_result_id',
      (t) => t.keyResultId.isIn(krIds),
    );
    await clearReference(
      db.tasks,
      'objective_id',
      (t) => t.objectiveId.equals(id),
    );
    await softDeleteWhere(db.keyResults, (k) => k.id.isIn(krIds));
    await softDeleteWhere(db.objectives, (o) => o.id.equals(id));
  });
}

@Riverpod(keepAlive: true)
ObjectiveRepository objectiveRepository(Ref ref) => ObjectiveRepository(
  ref.watch(appDatabaseProvider),
  ref.watch(clockProvider),
  ref.watch(idGeneratorProvider),
);

/// All objectives, any status, in sort order.
@riverpod
Stream<List<Objective>> objectives(Ref ref) =>
    ref.watch(objectiveRepositoryProvider).watchAll();

@riverpod
Stream<Objective?> objective(Ref ref, String id) =>
    ref.watch(objectiveRepositoryProvider).watch(id);
