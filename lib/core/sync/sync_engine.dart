import 'package:drift/drift.dart';

import '../db/app_database.dart';
import '../time/clock.dart';
import 'remote_store.dart';
import 'sync_state.dart';
import 'sync_tables.dart';

/// Uploads local changes and applies server changes (sync spec, "Push and
/// pull" and "Last write wins").
class SyncEngine {
  SyncEngine(this.db, this.remote, this.clock)
    : state = SyncState(db),
      tables = syncTables(db),
      _tableInfos = {for (final t in db.allTables) t.actualTableName: t};

  final AppDatabase db;
  final RemoteStore remote;
  final Clock clock;
  final SyncState state;
  final List<SyncTable> tables;
  final Map<String, TableInfo<Table, Object?>> _tableInfos;

  static const pushBatchSize = 500;
  static const pullPageSize = 1000;

  /// Re-reads server changes this long before the last pull, so rows
  /// committed late with an earlier server time are not missed.
  static const pullOverlap = Duration(minutes: 2);

  static final _epoch = DateTime.utc(2000);

  /// Removes every synced row from this device (settings stay), before the
  /// account's data replaces it.
  Future<void> wipeLocalData() => db.transaction(() async {
    for (final table in tables) {
      await db.customUpdate(
        'DELETE FROM "${table.name}"',
        updates: {_tableInfos[table.name]!},
        updateKind: UpdateKind.delete,
      );
    }
  });

  /// Uploads every row changed since the last complete upload. The
  /// watermark only advances when every table succeeded.
  Future<void> push() async {
    final since = await state.readTime(SyncKeys.lastPushedAt) ?? _epoch;
    final started = clock();
    for (final table in tables) {
      // julianday() compares the ISO text as time, whatever its precision.
      final rows = await db
          .customSelect(
            'SELECT * FROM "${table.name}" '
            'WHERE julianday(updated_at) > julianday(?)',
            variables: [Variable<String>(since.toUtc().toIso8601String())],
          )
          .get();
      for (var i = 0; i < rows.length; i += pushBatchSize) {
        await remote.upsert(table.name, [
          for (final row in rows.skip(i).take(pushBatchSize))
            table.toRemote(row.data),
        ]);
      }
    }
    await state.writeTime(SyncKeys.lastPushedAt, started);
  }

  /// Applies every server row changed since the last complete download
  /// when it is newer than the local copy.
  Future<void> pull() async {
    final last = await state.readTime(SyncKeys.lastPulledAt);
    final since = last == null ? _epoch : last.subtract(pullOverlap);
    var newest = last;
    for (final table in tables) {
      for (var offset = 0; ; offset += pullPageSize) {
        final page = await remote.changedSince(
          table.name,
          since,
          limit: pullPageSize,
          offset: offset,
        );
        await db.transaction(() async {
          for (final row in page) {
            await _apply(table, row);
          }
        });
        for (final row in page) {
          final serverTime = DateTime.parse(
            row['server_updated_at']! as String,
          );
          if (newest == null || serverTime.isAfter(newest)) newest = serverTime;
        }
        if (page.length < pullPageSize) break;
      }
    }
    if (newest != null) await state.writeTime(SyncKeys.lastPulledAt, newest);
  }

  Future<void> _apply(SyncTable table, Map<String, Object?> remoteRow) async {
    final row = table.toLocal(remoteRow);
    final id = row['id']! as String;
    final updatedAt = DateTime.parse(row['updated_at']! as String);
    final info = _tableInfos[table.name]!;

    final local = await db
        .customSelect(
          'SELECT updated_at FROM "${table.name}" WHERE id = ?',
          variables: [Variable<String>(id)],
        )
        .getSingleOrNull();
    if (local != null &&
        !updatedAt.isAfter(DateTime.parse(local.read<String>('updated_at')))) {
      return; // the local copy is as new or newer
    }

    if (table.naturalKey.isNotEmpty) {
      // A record with the same natural key under another ID (made before
      // IDs were derived from the key): the newer one wins.
      final duplicate = await db
          .customSelect(
            'SELECT id, updated_at FROM "${table.name}" WHERE '
            '${[for (final c in table.naturalKey) '"$c" = ?'].join(' AND ')} '
            'AND id <> ?',
            variables: [
              for (final column in table.naturalKey) _variable(row[column]),
              Variable<String>(id),
            ],
          )
          .getSingleOrNull();
      if (duplicate != null) {
        final duplicateTime = DateTime.parse(
          duplicate.read<String>('updated_at'),
        );
        if (!updatedAt.isAfter(duplicateTime)) return;
        await db.customUpdate(
          'DELETE FROM "${table.name}" WHERE id = ?',
          variables: [Variable<String>(duplicate.read<String>('id'))],
          updates: {info},
          updateKind: UpdateKind.delete,
        );
      }
    }

    final columns = table.columns.keys.toList();
    await db.customInsert(
      'INSERT INTO "${table.name}" '
      '(${columns.map((c) => '"$c"').join(', ')}) '
      'VALUES (${List.filled(columns.length, '?').join(', ')}) '
      'ON CONFLICT(id) DO UPDATE SET '
      '${columns.where((c) => c != 'id').map((c) => '"$c" = excluded."$c"').join(', ')}',
      variables: [for (final column in columns) _variable(row[column])],
      updates: {info},
    );
  }

  static Variable<Object> _variable(Object? value) => switch (value) {
    null => const Variable(null),
    final int value => Variable<int>(value),
    final double value => Variable<double>(value),
    final bool value => Variable<int>(value ? 1 : 0),
    _ => Variable<String>(value.toString()),
  };
}
