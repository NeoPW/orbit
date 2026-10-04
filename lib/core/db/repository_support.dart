import 'package:drift/drift.dart';

import '../time/clock.dart';
import 'app_database.dart';
import 'ids.dart';
import 'tables.dart';

export 'package:drift/drift.dart';

/// Shared plumbing for repositories: IDs, timestamps and soft deletes.
///
/// Inserts get a new ID and `created_at = updated_at = now`; every update
/// sets `updated_at`; deletes set `deleted_at` and keep the row. Queries use
/// [alive] to exclude soft-deleted rows.
abstract class Repository {
  Repository(this.db, this.clock, this.newId);

  final AppDatabase db;
  final Clock clock;
  final IdGenerator newId;

  /// Excludes soft-deleted rows.
  Expression<bool> alive(SyncColumns table) => table.deletedAt.isNull();

  /// Soft-deletes the rows of [table] matching [where].
  Future<void> softDeleteWhere<T extends SyncColumns, D>(
    TableInfo<T, D> table,
    Expression<bool> Function(T table) where,
  ) {
    final now = clock();
    return (db.update(table)..where((t) => where(t) & alive(t))).write(
      RawValuesInsertable({
        'deleted_at': Variable<DateTime>(now),
        'updated_at': Variable<DateTime>(now),
      }),
    );
  }

  /// Sets [column] to null (and bumps `updated_at`) on the live rows of
  /// [table] matching [where]. Used to unlink references on delete.
  Future<void> clearReference<T extends SyncColumns, D>(
    TableInfo<T, D> table,
    String column,
    Expression<bool> Function(T table) where,
  ) {
    return (db.update(table)..where((t) => where(t) & alive(t))).write(
      RawValuesInsertable({
        column: const Constant<String>(null),
        'updated_at': Variable<DateTime>(clock()),
      }),
    );
  }

  /// One more than the highest `sort_order` among the live rows matching
  /// [where], or 0 when there are none.
  Future<int> nextSortOrder<T extends SyncColumns, D>(
    TableInfo<T, D> table,
    Expression<int> Function(T table) sortOrder, [
    Expression<bool> Function(T table)? where,
  ]) async {
    final max = sortOrder(table.asDslTable).max();
    final query = db.selectOnly(table)
      ..addColumns([max])
      ..where(
        where == null
            ? alive(table.asDslTable)
            : where(table.asDslTable) & alive(table.asDslTable),
      );
    final result = await query.map((row) => row.read(max)).getSingle();
    return result == null ? 0 : result + 1;
  }
}
