import 'package:drift/drift.dart';

import '../theme/area_palette.dart';
import '../time/calendar_date.dart';
import 'converters.dart';
import 'enums.dart';
import 'ids.dart';
import 'tables.dart';

export 'package:drift/drift.dart' show Value;

export 'enums.dart';
export '../time/calendar_date.dart';

part 'app_database.drift.dart';

@DriftDatabase(
  tables: [
    Areas,
    Objectives,
    KeyResults,
    Projects,
    Tasks,
    Habits,
    HabitChecks,
    LogEntries,
    WeeklyReviews,
  ],
)
class AppDatabase extends _$AppDatabase {
  AppDatabase(super.executor);

  @override
  int get schemaVersion => 1;

  @override
  MigrationStrategy get migration => MigrationStrategy(
    onCreate: (m) async {
      await m.createAll();
      await _seedDefaultAreas();
    },
  );

  /// Runs once, when the database file is created.
  Future<void> _seedDefaultAreas() async {
    final now = DateTime.now().toUtc();
    await batch((batch) {
      for (final (index, area) in defaultAreas.indexed) {
        batch.insert(
          areas,
          AreasCompanion.insert(
            id: uuidV4(),
            createdAt: now,
            updatedAt: now,
            name: area.name,
            color: area.color,
            sortOrder: index,
          ),
        );
      }
    });
  }
}
