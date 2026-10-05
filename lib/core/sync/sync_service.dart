import 'dart:async';

import '../time/clock.dart';
import 'sync_engine.dart';
import 'sync_state.dart';

/// Runs push then pull, one sync at a time, and records the outcome. Never
/// throws: failures are stored and retried at the next trigger (sync spec,
/// "Failures and status").
class SyncService {
  SyncService(this.engine, this.clock);

  final SyncEngine engine;
  final Clock clock;

  SyncState get state => engine.state;

  Future<bool>? _running;

  /// Whether a sync is in progress (its own writes are not local changes).
  bool get isRunning => _running != null;

  /// Syncs, or joins the sync already running. Returns whether it
  /// succeeded. Does nothing before this device's first sign-in is done.
  Future<bool> sync() =>
      _running ??= _run().whenComplete(() => _running = null);

  Future<bool> _run() async {
    try {
      if (await state.read(SyncKeys.userId) == null) return false;
      await engine.push();
      await engine.pull();
      await state.writeTime(SyncKeys.lastSuccessAt, clock());
      await state.write(SyncKeys.lastError, null);
      return true;
    } on Object catch (error) {
      await state.write(SyncKeys.lastError, error.toString());
      return false;
    }
  }
}
