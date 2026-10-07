// dart format width=80
// ignore_for_file: unused_local_variable, unused_import
import 'package:drift/drift.dart';
import 'package:drift_dev/api/migrations_native.dart';
import 'package:orbit/core/db/app_database.dart';
import 'package:flutter_test/flutter_test.dart';

import 'generated/schema.dart';

import 'generated/schema_v1.dart' as v1;
import 'generated/schema_v2.dart' as v2;
import 'generated/schema_v3.dart' as v3;
import 'generated/schema_v4.dart' as v4;

void main() {
  driftRuntimeOptions.dontWarnAboutMultipleDatabases = true;
  late SchemaVerifier verifier;

  setUpAll(() {
    verifier = SchemaVerifier(GeneratedHelper());
  });

  group('simple database migrations', () {
    // These simple tests verify all possible schema updates with a simple (no
    // data) migration. This is a quick way to ensure that written database
    // migrations properly alter the schema.
    const versions = GeneratedHelper.versions;
    for (final (i, fromVersion) in versions.indexed) {
      group('from $fromVersion', () {
        for (final toVersion in versions.skip(i + 1)) {
          test('to $toVersion', () async {
            final schema = await verifier.schemaAt(fromVersion);
            final db = AppDatabase(schema.newConnection());
            await verifier.migrateAndValidate(db, toVersion);
            await db.close();
          });
        }
      });
    }
  });

  test(
    'migration from v1 to the current version keeps existing rows',
    () async {
      const t = '2026-10-01T10:00:00.000Z';
      await verifier.testWithDataIntegrity(
        oldVersion: 1,
        newVersion: 4,
        createOld: v1.DatabaseAtV1.new,
        createNew: v4.DatabaseAtV4.new,
        openTestedDatabase: AppDatabase.new,
        createItems: (batch, oldDb) {
          batch.insert(
            oldDb.projects,
            const v1.ProjectsData(
              id: 'p1',
              createdAt: t,
              updatedAt: t,
              title: 'Thesis',
              description: '',
              status: 'active',
              importance: 4,
              deadline: '2026-12-31',
            ),
          );
          batch.insert(
            oldDb.habits,
            const v1.HabitsData(
              id: 'h1',
              createdAt: t,
              updatedAt: t,
              title: 'Run',
              projectId: 'p1',
              scheduleType: 'weekdays',
              weekdays: '1,3,5',
              reminderTime: '07:30',
              active: 1,
            ),
          );
          batch.insert(
            oldDb.logEntries,
            const v1.LogEntriesData(
              id: 'l1',
              createdAt: t,
              updatedAt: t,
              projectId: 'p1',
              occurredAt: t,
              durationMinutes: 45,
              note: 'Chapter 2',
              source: 'manual',
            ),
          );
        },
        validateItems: (newDb) async {
          expect(await newDb.select(newDb.projects).get(), [
            const v4.ProjectsData(
              id: 'p1',
              createdAt: t,
              updatedAt: t,
              title: 'Thesis',
              description: '',
              status: 'active',
              importance: 4,
              deadline: '2026-12-31',
            ),
          ]);

          expect(await newDb.select(newDb.habits).get(), [
            const v4.HabitsData(
              id: 'h1',
              createdAt: t,
              updatedAt: t,
              title: 'Run',
              projectId: 'p1',
              scheduleType: 'weekdays',
              weekdays: '1,3,5',
              reminderTime: '07:30',
              active: 1,
            ),
          ]);

          expect(await newDb.select(newDb.logEntries).get(), [
            const v4.LogEntriesData(
              id: 'l1',
              createdAt: t,
              updatedAt: t,
              projectId: 'p1',
              occurredAt: t,
              durationMinutes: 45,
              note: 'Chapter 2',
              source: 'manual',
            ),
          ]);

          // The new tables exist and start empty.
          expect(await newDb.select(newDb.settings).get(), isEmpty);
          expect(await newDb.select(newDb.reviewKrSnapshots).get(), isEmpty);
        },
      );
    },
  );

  test('migration from v2 to v3 keeps settings and reviews', () async {
    const t = '2026-10-04T18:00:00.000Z';
    await verifier.testWithDataIntegrity(
      oldVersion: 2,
      newVersion: 3,
      createOld: v2.DatabaseAtV2.new,
      createNew: v3.DatabaseAtV3.new,
      openTestedDatabase: AppDatabase.new,
      createItems: (batch, oldDb) {
        batch.insert(
          oldDb.settings,
          const v2.SettingsData(key: 'deadline_lead_days', value: '3'),
        );
        batch.insert(
          oldDb.weeklyReviews,
          const v2.WeeklyReviewsData(
            id: 'r1',
            createdAt: t,
            updatedAt: t,
            weekStart: '2026-09-28',
            score: 7,
            reflection: 'Good week',
            planNextWeek: 'Chapter 3',
            completedAt: t,
          ),
        );
      },
      validateItems: (newDb) async {
        expect(await newDb.select(newDb.settings).get(), [
          const v3.SettingsData(key: 'deadline_lead_days', value: '3'),
        ]);
        expect(await newDb.select(newDb.weeklyReviews).get(), [
          const v3.WeeklyReviewsData(
            id: 'r1',
            createdAt: t,
            updatedAt: t,
            weekStart: '2026-09-28',
            score: 7,
            reflection: 'Good week',
            planNextWeek: 'Chapter 3',
            completedAt: t,
          ),
        ]);
        expect(await newDb.select(newDb.reviewKrSnapshots).get(), isEmpty);
      },
    );
  });

  test('migration from v3 to v4 keeps tasks and log entries', () async {
    const t = '2026-10-05T12:00:00.000Z';
    await verifier.testWithDataIntegrity(
      oldVersion: 3,
      newVersion: 4,
      createOld: v3.DatabaseAtV3.new,
      createNew: v4.DatabaseAtV4.new,
      openTestedDatabase: AppDatabase.new,
      createItems: (batch, oldDb) {
        batch.insert(
          oldDb.tasks,
          const v3.TasksData(
            id: 't1',
            createdAt: t,
            updatedAt: t,
            projectId: 'p1',
            title: 'Draft',
            notes: 'ch. 1',
            dueDate: '2026-10-20',
            status: 'open',
          ),
        );
        batch.insert(
          oldDb.logEntries,
          const v3.LogEntriesData(
            id: 'l1',
            createdAt: t,
            updatedAt: t,
            projectId: 'p1',
            occurredAt: t,
            note: 'Draft',
            source: 'task',
          ),
        );
      },
      validateItems: (newDb) async {
        expect(await newDb.select(newDb.tasks).get(), [
          const v4.TasksData(
            id: 't1',
            createdAt: t,
            updatedAt: t,
            projectId: 'p1',
            title: 'Draft',
            notes: 'ch. 1',
            dueDate: '2026-10-20',
            status: 'open',
          ),
        ]);
        expect(await newDb.select(newDb.logEntries).get(), [
          const v4.LogEntriesData(
            id: 'l1',
            createdAt: t,
            updatedAt: t,
            projectId: 'p1',
            occurredAt: t,
            note: 'Draft',
            source: 'task',
          ),
        ]);
      },
    );
  });
}
