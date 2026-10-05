import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../db/database_providers.dart';
import '../time/clock.dart';
import 'remote_store.dart';
import 'supabase_remote_store.dart';
import 'sync_engine.dart';
import 'sync_service.dart';
import 'sync_state.dart';
import 'sync_tables.dart';

part 'sync_providers.g.dart';

/// The server side of sync. Only used when sync is configured (Supabase is
/// initialized in `main`); tests override it.
@Riverpod(keepAlive: true)
RemoteStore remoteStore(Ref ref) => SupabaseRemoteStore(
  Supabase.instance.client,
  tables: [
    for (final table in syncTables(ref.watch(appDatabaseProvider))) table.name,
  ],
);

@Riverpod(keepAlive: true)
SyncService syncService(Ref ref) {
  final clock = ref.watch(clockProvider);
  return SyncService(
    SyncEngine(
      ref.watch(appDatabaseProvider),
      ref.watch(remoteStoreProvider),
      clock,
    ),
    clock,
  );
}

/// Last successful sync, last failure and the device's account.
@riverpod
Stream<SyncStatus> syncStatus(Ref ref) =>
    SyncState(ref.watch(appDatabaseProvider)).watch();
