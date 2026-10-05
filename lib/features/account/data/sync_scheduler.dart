import 'dart:async';

import 'package:flutter/widgets.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../../../core/db/database_providers.dart';
import '../../../core/sync/sync_providers.dart';
import '../../../core/sync/sync_tables.dart';
import 'account_controller.dart';

part 'sync_scheduler.g.dart';

/// How long after the last local change a sync starts.
@Riverpod(keepAlive: true)
Duration syncDebounce(Ref ref) => const Duration(seconds: 5);

/// Runs a sync while signed in (sync spec, "When sync runs"): at start and
/// sign-in, on returning to the foreground, a few seconds after changes to
/// synced data, and on demand ([syncNow]: pull-to-refresh, "Sync now").
/// Watched by `SyncScope` while the app runs.
@Riverpod(keepAlive: true)
class SyncScheduler extends _$SyncScheduler {
  Timer? _timer;

  bool get _signedIn =>
      ref.read(accountProvider).status == AccountStatus.signedIn;

  @override
  void build() {
    if (ref.watch(accountProvider).status != AccountStatus.signedIn) return;
    final service = ref.watch(syncServiceProvider);
    final db = ref.watch(appDatabaseProvider);
    final debounce = ref.watch(syncDebounceProvider);
    final synced = {for (final table in syncTables(db)) table.name};

    final updates = db.tableUpdates().listen((changes) {
      // A sync's own downloads are not local changes.
      if (service.isRunning) return;
      if (changes.any((change) => synced.contains(change.table))) {
        _timer?.cancel();
        _timer = Timer(debounce, syncNow);
      }
    });
    final lifecycle = AppLifecycleListener(onResume: syncNow);
    ref.onDispose(() {
      _timer?.cancel();
      updates.cancel();
      lifecycle.dispose();
    });
    // App start (with a restored session) or a fresh sign-in.
    Future.microtask(syncNow);
  }

  /// Syncs now if signed in; completes when the sync is done.
  Future<void> syncNow() async {
    if (!_signedIn) return;
    _timer?.cancel();
    await ref.read(syncServiceProvider).sync();
  }
}
