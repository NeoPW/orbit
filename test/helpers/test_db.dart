import 'package:drift/drift.dart';
import 'package:drift/native.dart';
import 'package:orbit/core/db/app_database.dart';

/// A fresh in-memory database (seeded with the default areas).
AppDatabase newTestDatabase() {
  driftRuntimeOptions.dontWarnAboutMultipleDatabases = true;
  return AppDatabase(NativeDatabase.memory());
}

/// A clock that starts at [start] and advances by one second per call, so
/// every write gets a distinct, predictable timestamp.
class TestClock {
  TestClock([DateTime? start]) : _now = start ?? DateTime.utc(2026, 10, 5, 12);

  DateTime _now;

  DateTime call() {
    final current = _now;
    _now = _now.add(const Duration(seconds: 1));
    return current;
  }
}

/// Sequential IDs: `id-1`, `id-2`, …
class TestIds {
  int _next = 1;

  String call() => 'id-${_next++}';
}
