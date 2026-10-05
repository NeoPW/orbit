import 'package:supabase_flutter/supabase_flutter.dart';

import 'remote_store.dart';

/// The signed-in user's rows in Supabase, through PostgREST. Row-level
/// security limits every query to the user's own rows.
class SupabaseRemoteStore implements RemoteStore {
  SupabaseRemoteStore(this.client, {required this.tables});

  final SupabaseClient client;

  /// The synced tables, checked by [hasAnyData].
  final List<String> tables;

  @override
  Future<void> upsert(String table, List<Map<String, Object?>> rows) async {
    if (rows.isEmpty) return;
    await client.from(table).upsert(rows, onConflict: 'id');
  }

  @override
  Future<List<Map<String, Object?>>> changedSince(
    String table,
    DateTime since, {
    required int limit,
    required int offset,
  }) => client
      .from(table)
      .select()
      .gt('server_updated_at', since.toUtc().toIso8601String())
      .order('server_updated_at', ascending: true)
      .order('id', ascending: true)
      .range(offset, offset + limit - 1);

  @override
  Future<bool> hasAnyData() async {
    for (final table in tables) {
      final rows = await client.from(table).select('id').limit(1);
      if (rows.isNotEmpty) return true;
    }
    return false;
  }
}
