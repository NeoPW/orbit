import 'package:drift/drift.dart';

import '../db/app_database.dart';

/// How a stored column is translated for the server.
enum SyncColumnKind {
  /// Stored as 0/1, sent as true/false.
  boolean,

  /// Stored as ISO-8601 UTC text.
  timestamp,

  /// Passed through as stored.
  plain,
}

/// A local table that is synced, described by its stored columns.
///
/// Sync reads and writes raw rows (the values as stored in SQLite), so no
/// drift type converters run. [toRemote] and [toLocal] translate between
/// the stored values and the server's JSON.
class SyncTable {
  const SyncTable({
    required this.name,
    required this.columns,
    this.naturalKey = const [],
  });

  final String name;

  /// Column name → how it is translated.
  final Map<String, SyncColumnKind> columns;

  /// Columns that identify a record besides its ID (unique locally), e.g.
  /// habit and date of a habit check. Empty for most tables.
  final List<String> naturalKey;

  /// A stored row as JSON for the server: booleans as true/false, the rest
  /// as stored (timestamps are already ISO-8601 UTC text).
  Map<String, Object?> toRemote(Map<String, Object?> row) => {
    for (final MapEntry(key: column, value: kind) in columns.entries)
      column: switch (kind) {
        SyncColumnKind.boolean => switch (row[column]) {
          null => null,
          final value => value == 1 || value == true,
        },
        _ => row[column],
      },
  };

  /// A server row as stored locally: only local columns, booleans as 0/1,
  /// timestamps normalized to the local ISO-8601 UTC text (the server
  /// returns `+00:00`, and local queries compare this text).
  Map<String, Object?> toLocal(Map<String, Object?> remote) => {
    for (final MapEntry(key: column, value: kind) in columns.entries)
      column: switch ((kind, remote[column])) {
        (_, null) => null,
        (SyncColumnKind.boolean, final Object value) =>
          value == true || value == 1 ? 1 : 0,
        (SyncColumnKind.timestamp, final Object value) => normalizeTimestamp(
          value as String,
        ),
        (_, final Object value) => value,
      },
  };
}

/// ISO-8601 text as drift stores UTC timestamps, e.g.
/// `2026-10-05T12:00:00.000Z`.
String normalizeTimestamp(String text) =>
    DateTime.parse(text).toUtc().toIso8601String();

/// Natural keys of tables whose records must stay unique across devices.
const _naturalKeys = {
  'habit_checks': ['habit_id', 'date'],
  'weekly_reviews': ['week_start'],
};

/// Every synced table of [db]: all tables except the local settings.
List<SyncTable> syncTables(AppDatabase db) => [
  for (final table in db.allTables)
    if (table.actualTableName != db.settings.actualTableName)
      SyncTable(
        name: table.actualTableName,
        columns: {
          for (final column in table.$columns)
            column.name: switch (column.type) {
              DriftSqlType.bool => SyncColumnKind.boolean,
              DriftSqlType.dateTime => SyncColumnKind.timestamp,
              _ => SyncColumnKind.plain,
            },
        },
        naturalKey: _naturalKeys[table.actualTableName] ?? const [],
      ),
];
