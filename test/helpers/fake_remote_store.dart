import 'package:orbit/core/sync/remote_store.dart';

/// An in-memory server: one map of rows per table, a server clock that
/// advances by one second per write, and the same rule as the server
/// trigger (an update must have a newer `updated_at`).
class FakeRemoteStore implements RemoteStore {
  FakeRemoteStore([DateTime? start])
    : _now = start ?? DateTime.utc(2026, 10, 5, 12);

  final tables = <String, Map<String, Map<String, Object?>>>{};
  DateTime _now;

  /// Set to make the next calls fail, e.g. to simulate being offline.
  Object? failWith;

  /// Fails only uploads to this table.
  String? failUpsertFor;

  int upsertCalls = 0;

  List<Map<String, Object?>> rows(String table) =>
      (tables[table] ?? const {}).values.toList();

  @override
  Future<void> upsert(String table, List<Map<String, Object?>> rows) async {
    if (failWith case final error?) throw error;
    if (table == failUpsertFor) throw StateError('upsert failed: $table');
    upsertCalls++;
    final stored = tables.putIfAbsent(table, () => {});
    for (final row in rows) {
      final id = row['id']! as String;
      final old = stored[id];
      if (old != null &&
          !DateTime.parse(row['updated_at']! as String)
              .isAfter(DateTime.parse(old['updated_at']! as String))) {
        continue; // stale: the server keeps the newer row
      }
      _now = _now.add(const Duration(seconds: 1));
      stored[id] = {
        ...row,
        'user_id': 'user-1',
        // Like Postgres: +00:00 instead of Z.
        'server_updated_at': _now.toIso8601String().replaceFirst('Z', '+00:00'),
      };
    }
  }

  @override
  Future<List<Map<String, Object?>>> changedSince(
    String table,
    DateTime since, {
    required int limit,
    required int offset,
  }) async {
    if (failWith case final error?) throw error;
    DateTime serverTime(Map<String, Object?> row) =>
        DateTime.parse(row['server_updated_at']! as String);
    final changed =
        rows(table).where((row) => serverTime(row).isAfter(since)).toList()
          ..sort((a, b) => serverTime(a).compareTo(serverTime(b)));
    return changed.skip(offset).take(limit).toList();
  }

  @override
  Future<bool> hasAnyData() async {
    if (failWith case final error?) throw error;
    return tables.values.any((rows) => rows.isNotEmpty);
  }
}
