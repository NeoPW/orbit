import '../db/app_database.dart';

/// Sync bookkeeping, kept in the local settings table (never synced).
abstract final class SyncKeys {
  /// Local time before the last complete upload; rows updated later are
  /// uploaded next time.
  static const lastPushedAt = 'sync_last_pushed_at';

  /// Newest `server_updated_at` seen by the last complete download.
  static const lastPulledAt = 'sync_last_pulled_at';
  static const lastSuccessAt = 'sync_last_success_at';

  /// Set after a failed sync, cleared by the next successful one.
  static const lastError = 'sync_last_error';

  /// The account this device's data belongs to; null until the first
  /// sign-in on this device is done.
  static const userId = 'sync_user_id';

  static const all = [
    lastPushedAt,
    lastPulledAt,
    lastSuccessAt,
    lastError,
    userId,
  ];
}

/// What Settings shows about sync.
class SyncStatus {
  const SyncStatus({this.lastSuccessAt, this.lastError, this.userId});

  final DateTime? lastSuccessAt;
  final String? lastError;
  final String? userId;

  bool get lastFailed => lastError != null;
}

/// Reads and writes the sync keys of the settings table.
class SyncState {
  SyncState(this.db);

  final AppDatabase db;

  Future<String?> read(String key) async => (await (db.select(
    db.settings,
  )..where((s) => s.key.equals(key))).getSingleOrNull())?.value;

  Future<DateTime?> readTime(String key) async {
    final value = await read(key);
    return value == null ? null : DateTime.parse(value);
  }

  /// Stores [value], or removes the key when null.
  Future<void> write(String key, String? value) => value == null
      ? (db.delete(db.settings)..where((s) => s.key.equals(key))).go()
      : db
            .into(db.settings)
            .insertOnConflictUpdate(
              SettingsCompanion.insert(key: key, value: value),
            );

  Future<void> writeTime(String key, DateTime time) =>
      write(key, time.toUtc().toIso8601String());

  /// Forgets all sync bookkeeping (e.g. after signing out).
  Future<void> clear() =>
      (db.delete(db.settings)..where((s) => s.key.isIn(SyncKeys.all))).go();

  Stream<SyncStatus> watch() =>
      (db.select(
        db.settings,
      )..where((s) => s.key.isIn(SyncKeys.all))).watch().map((rows) {
        final values = {for (final row in rows) row.key: row.value};
        final success = values[SyncKeys.lastSuccessAt];
        return SyncStatus(
          lastSuccessAt: success == null ? null : DateTime.parse(success),
          lastError: values[SyncKeys.lastError],
          userId: values[SyncKeys.userId],
        );
      });
}
