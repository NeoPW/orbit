/// The server side of sync: the signed-in user's rows in Supabase
/// (implemented by `SupabaseRemoteStore`; tests use an in-memory fake).
///
/// Rows are JSON maps with the local column names. The server adds
/// `server_updated_at` and ignores updates whose `updated_at` is not newer
/// than the stored row's (supabase/schema.sql, `sync_guard`).
abstract interface class RemoteStore {
  /// Inserts or updates [rows] of [table] by `id`.
  Future<void> upsert(String table, List<Map<String, Object?>> rows);

  /// Rows of [table] with `server_updated_at` after [since], oldest first,
  /// including `server_updated_at`.
  Future<List<Map<String, Object?>>> changedSince(
    String table,
    DateTime since, {
    required int limit,
    required int offset,
  });

  /// Whether the account has any synced data yet.
  Future<bool> hasAnyData();
}
