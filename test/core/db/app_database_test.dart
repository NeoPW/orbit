import 'dart:io';

import 'package:drift/drift.dart' hide isNull, isNotNull;
import 'package:drift/native.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:orbit/core/db/app_database.dart';

import '../../helpers/test_db.dart';

Future<List<String>> _activeAreaNames(AppDatabase db) async {
  final rows =
      await (db.select(db.areas)
            ..where((a) => a.deletedAt.isNull())
            ..orderBy([(a) => OrderingTerm(expression: a.sortOrder)]))
          .get();
  return rows.map((a) => a.name).toList();
}

void main() {
  late AppDatabase db;

  setUp(() => db = newTestDatabase());
  tearDown(() => db.close());

  test(
    'a fresh database has schema version 2, nine tables and settings',
    () async {
      expect(db.schemaVersion, 2);
      final version = await db.customSelect('PRAGMA user_version').getSingle();
      expect(version.read<int>('user_version'), 2);

      final tables = await db
          .customSelect(
            "SELECT name FROM sqlite_master WHERE type = 'table' "
            "AND name NOT LIKE 'sqlite_%'",
          )
          .map((row) => row.read<String>('name'))
          .get();
      expect(
        tables,
        unorderedEquals([
          'areas',
          'objectives',
          'key_results',
          'projects',
          'tasks',
          'habits',
          'habit_checks',
          'log_entries',
          'weekly_reviews',
          'settings',
        ]),
      );
    },
  );

  test('first launch seeds Job, Personal, Sport, Uni in order', () async {
    expect(await _activeAreaNames(db), ['Job', 'Personal', 'Sport', 'Uni']);
    final areas = await db.select(db.areas).get();
    expect(areas.map((a) => a.color).toSet(), hasLength(4));
    for (final area in areas) {
      expect(area.createdAt.isUtc, isTrue);
      expect(area.deletedAt, isNull);
    }
  });

  group('unique constraints', () {
    final now = DateTime.utc(2026, 10, 5);

    test('rejects a second habit check for the same habit and date', () async {
      HabitChecksCompanion check(String id) => HabitChecksCompanion.insert(
        id: id,
        createdAt: now,
        updatedAt: now,
        habitId: 'habit-1',
        date: CalendarDate(2026, 10, 5),
      );

      await db.into(db.habitChecks).insert(check('check-1'));
      await expectLater(
        db.into(db.habitChecks).insert(check('check-2')),
        throwsA(isA<SqliteException>()),
      );
    });

    test('allows the same habit on a different date', () async {
      for (final (id, day) in [('a', 5), ('b', 6)]) {
        await db
            .into(db.habitChecks)
            .insert(
              HabitChecksCompanion.insert(
                id: id,
                createdAt: now,
                updatedAt: now,
                habitId: 'habit-1',
                date: CalendarDate(2026, 10, day),
              ),
            );
      }
      expect(await db.select(db.habitChecks).get(), hasLength(2));
    });

    test('rejects a second weekly review for the same week', () async {
      WeeklyReviewsCompanion review(String id) => WeeklyReviewsCompanion.insert(
        id: id,
        createdAt: now,
        updatedAt: now,
        weekStart: CalendarDate(2026, 10, 5),
      );

      await db.into(db.weeklyReviews).insert(review('review-1'));
      await expectLater(
        db.into(db.weeklyReviews).insert(review('review-2')),
        throwsA(isA<SqliteException>()),
      );
    });
  });

  test('stores enums and dates as text', () async {
    final now = DateTime.utc(2026, 10, 5);
    await db
        .into(db.habits)
        .insert(
          HabitsCompanion.insert(
            id: 'habit-1',
            createdAt: now,
            updatedAt: now,
            title: 'Stretch',
            scheduleType: ScheduleType.timesPerWeek,
            timesPerWeek: const Value(3),
          ),
        );
    await db
        .into(db.projects)
        .insert(
          ProjectsCompanion.insert(
            id: 'project-1',
            createdAt: now,
            updatedAt: now,
            title: 'Thesis',
            status: ProjectStatus.backlog,
            importance: 3,
            deadline: Value(CalendarDate(2026, 12, 31)),
          ),
        );

    final habit = await db
        .customSelect("SELECT schedule_type FROM habits WHERE id = 'habit-1'")
        .getSingle();
    expect(habit.read<String>('schedule_type'), 'times_per_week');
    final project = await db
        .customSelect(
          "SELECT status, deadline FROM projects WHERE id = 'project-1'",
        )
        .getSingle();
    expect(project.read<String>('status'), 'backlog');
    expect(project.read<String>('deadline'), '2026-12-31');
  });

  test('rejects importance outside 1–5', () async {
    final now = DateTime.utc(2026, 10, 5);
    await expectLater(
      db
          .into(db.projects)
          .insert(
            ProjectsCompanion.insert(
              id: 'project-1',
              createdAt: now,
              updatedAt: now,
              title: 'Too important',
              status: ProjectStatus.active,
              importance: 6,
            ),
          ),
      throwsA(isA<SqliteException>()),
    );
  });

  test('reopening an existing database does not seed again', () async {
    final dir = await Directory.systemTemp.createTemp('orbit_db_test');
    addTearDown(() => dir.delete(recursive: true));
    final file = File('${dir.path}/orbit.sqlite');

    final first = AppDatabase(NativeDatabase(file));
    await (first.update(first.areas)..where((a) => a.name.equals('Uni'))).write(
      AreasCompanion(deletedAt: Value(DateTime.utc(2026, 10, 5))),
    );
    await first.close();

    final second = AppDatabase(NativeDatabase(file));
    addTearDown(second.close);
    expect(await _activeAreaNames(second), ['Job', 'Personal', 'Sport']);
    expect(await second.select(second.areas).get(), hasLength(4));
  });
}
