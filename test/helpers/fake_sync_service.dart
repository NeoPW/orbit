import 'package:orbit/core/sync/sync_engine.dart';
import 'package:orbit/core/sync/sync_service.dart';
import 'package:orbit/core/sync/sync_state.dart';
import 'package:orbit/core/time/clock.dart';

/// Counts syncs; [running] simulates a sync in progress.
class FakeSyncService implements SyncService {
  int calls = 0;
  bool running = false;

  @override
  bool get isRunning => running;

  @override
  Future<bool> sync() async {
    calls++;
    return true;
  }

  @override
  SyncEngine get engine => throw UnimplementedError();

  @override
  Clock get clock => throw UnimplementedError();

  @override
  SyncState get state => throw UnimplementedError();
}
