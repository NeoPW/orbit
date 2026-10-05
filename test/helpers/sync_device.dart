import 'package:orbit/core/db/app_database.dart';
import 'package:orbit/core/db/ids.dart';
import 'package:orbit/core/sync/remote_store.dart';
import 'package:orbit/core/sync/sync_engine.dart';
import 'package:orbit/core/sync/sync_service.dart';
import 'package:orbit/core/sync/sync_state.dart';
import 'package:orbit/features/habits/data/habit_check_repository.dart';
import 'package:orbit/features/habits/data/habit_repository.dart';
import 'package:orbit/features/projects/data/project_repository.dart';
import 'package:orbit/features/settings/data/settings_repository.dart';
import 'package:orbit/features/tasks/data/task_repository.dart';

import 'test_db.dart';

/// A device for sync tests: its own in-memory database, a clock that can be
/// set and advances one second per call, random IDs, and a sync service
/// against [remote].
class SyncDevice {
  SyncDevice(RemoteStore remote, {DateTime? start})
    : db = newTestDatabase(),
      // Not before the real time: the default areas are seeded with it.
      now = start ?? DateTime.now().toUtc() {
    projects = ProjectRepository(db, clock, uuidV4);
    tasks = TaskRepository(db, clock, uuidV4);
    habits = HabitRepository(db, clock, uuidV4);
    habitChecks = HabitCheckRepository(db, clock, uuidV4);
    settings = SettingsRepository(db);
    engine = SyncEngine(db, remote, clock);
    service = SyncService(engine, clock);
  }

  final AppDatabase db;
  DateTime now;
  late final ProjectRepository projects;
  late final TaskRepository tasks;
  late final HabitRepository habits;
  late final HabitCheckRepository habitChecks;
  late final SettingsRepository settings;
  late final SyncEngine engine;
  late final SyncService service;

  DateTime clock() {
    final current = now;
    now = now.add(const Duration(seconds: 1));
    return current;
  }

  /// Marks the device as signed in to the account, so sync runs.
  Future<void> signIn() => engine.state.write(SyncKeys.userId, 'user-1');

  Future<bool> sync() => service.sync();

  Future<List<Map<String, Object?>>> raw(String table) async => [
    for (final row in await db.customSelect('SELECT * FROM $table').get())
      row.data,
  ];

  Future<void> close() => db.close();
}
