import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../../../core/db/app_database.dart';
import '../../../core/db/database_providers.dart';
import '../../../core/db/ids.dart' show idGeneratorProvider;
import '../../../core/db/repository_support.dart';
import '../../../core/time/clock.dart' show clockProvider;

part 'goal_repository.g.dart';

class GoalRepository extends Repository {
  GoalRepository(super.db, super.clock, super.newId);

  SimpleSelectStatement<$GoalsTable, Goal> _query() => db.select(db.goals)
    ..where(alive)
    ..orderBy([
      (g) => OrderingTerm(expression: g.sortOrder),
      (g) => OrderingTerm(expression: g.createdAt),
    ]);

  /// All goals, any status, in sort order.
  Stream<List<Goal>> watchAll() => _query().watch();

  Stream<List<Goal>> watchByStatus(Set<GoalStatus> statuses) =>
      (_query()..where((g) => g.status.isInValues(statuses))).watch();

  Stream<Goal?> watch(String id) =>
      (_query()..where((g) => g.id.equals(id))).watchSingleOrNull();

  Future<Goal?> get(String id) =>
      (_query()..where((g) => g.id.equals(id))).getSingleOrNull();

  /// Adds an active goal after the existing ones. A null [color] is "Auto".
  Future<Goal> create({
    required String title,
    String description = '',
    required CalendarDate startDate,
    required CalendarDate endDate,
    String? color,
  }) async {
    final now = clock();
    return db
        .into(db.goals)
        .insertReturning(
          GoalsCompanion.insert(
            id: newId(),
            createdAt: now,
            updatedAt: now,
            title: title.trim(),
            description: Value(description.trim()),
            startDate: startDate,
            endDate: endDate,
            status: GoalStatus.active,
            sortOrder: await nextSortOrder(db.goals, (g) => g.sortOrder),
            color: Value(color),
          ),
        );
  }

  Future<void> update(Goal goal) => db
      .update(db.goals)
      .replace(
        goal.copyWith(
          title: goal.title.trim(),
          description: goal.description.trim(),
          updatedAt: clock(),
        ),
      );

  /// Number of live measures of the goal (for the delete confirmation).
  Future<int> countMeasures(String goalId) async {
    final count = db.measures.id.count();
    final query = db.selectOnly(db.measures)
      ..addColumns([count])
      ..where(db.measures.goalId.equals(goalId) & alive(db.measures));
    return (await query.map((row) => row.read(count)).getSingle()) ?? 0;
  }

  /// Soft-deletes the goal and its measures. Projects, tasks and habits
  /// linked to the goal keep existing without the link; log entries stay.
  Future<void> delete(String id) => db.transaction(() async {
    await clearReference(db.projects, 'goal_id', (p) => p.goalId.equals(id));
    await clearReference(db.habits, 'goal_id', (h) => h.goalId.equals(id));
    // Its tasks stay, as standalone tasks.
    await clearReference(db.tasks, 'goal_id', (t) => t.goalId.equals(id));
    await softDeleteWhere(db.measures, (m) => m.goalId.equals(id));
    await softDeleteWhere(db.goals, (g) => g.id.equals(id));
  });
}

@Riverpod(keepAlive: true)
GoalRepository goalRepository(Ref ref) => GoalRepository(
  ref.watch(appDatabaseProvider),
  ref.watch(clockProvider),
  ref.watch(idGeneratorProvider),
);

/// All goals, any status, in sort order.
@riverpod
Stream<List<Goal>> goals(Ref ref) =>
    ref.watch(goalRepositoryProvider).watchAll();

@riverpod
Stream<Goal?> goal(Ref ref, String id) =>
    ref.watch(goalRepositoryProvider).watch(id);
