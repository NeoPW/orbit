// dart format width=80
// ignore_for_file: unused_local_variable, unused_import
import 'package:drift/drift.dart' hide isNull;
import 'package:drift_dev/api/migrations_native.dart';
import 'package:orbit/core/db/app_database.dart';
import 'package:flutter_test/flutter_test.dart';

import 'generated/schema.dart';

import 'generated/schema_v1.dart' as v1;
import 'generated/schema_v2.dart' as v2;
import 'generated/schema_v3.dart' as v3;
import 'generated/schema_v4.dart' as v4;
import 'generated/schema_v5.dart' as v5;
import 'generated/schema_v6.dart' as v6;
import 'generated/schema_v7.dart' as v7;

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
        newVersion: 5,
        createOld: v1.DatabaseAtV1.new,
        createNew: v5.DatabaseAtV5.new,
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
            const v5.ProjectsData(
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
            const v5.HabitsData(
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
            const v5.LogEntriesData(
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

  test('migration from v4 to v5 adds timers and a step of 1 to KRs', () async {
    const t = '2026-10-07T12:00:00.000Z';
    await verifier.testWithDataIntegrity(
      oldVersion: 4,
      newVersion: 5,
      createOld: v4.DatabaseAtV4.new,
      createNew: v5.DatabaseAtV5.new,
      openTestedDatabase: AppDatabase.new,
      createItems: (batch, oldDb) {
        batch.insert(
          oldDb.keyResults,
          const v4.KeyResultsData(
            id: 'k1',
            createdAt: t,
            updatedAt: t,
            objectiveId: 'o1',
            title: 'Run 100 km',
            description: '',
            measureType: 'numeric',
            startValue: 0,
            targetValue: 100,
            currentValue: 40,
            unit: 'km',
            sortOrder: 0,
          ),
        );
      },
      validateItems: (newDb) async {
        expect(await newDb.select(newDb.keyResults).get(), [
          const v5.KeyResultsData(
            id: 'k1',
            createdAt: t,
            updatedAt: t,
            objectiveId: 'o1',
            title: 'Run 100 km',
            description: '',
            measureType: 'numeric',
            startValue: 0,
            targetValue: 100,
            currentValue: 40,
            unit: 'km',
            step: 1,
            sortOrder: 0,
          ),
        ]);
        expect(await newDb.select(newDb.timers).get(), isEmpty);
      },
    );
  });

  group('migration from v6 to v7', () {
    const t = '2026-10-05T12:00:00.000Z';
    const later = '2026-10-06T09:00:00.000Z';
    const deleted = '2026-10-06T10:00:00.000Z';

    Future<void> migrate(
      void Function(Batch batch, v6.DatabaseAtV6 oldDb) createItems,
      Future<void> Function(v7.DatabaseAtV7 newDb) validateItems,
    ) => verifier.testWithDataIntegrity(
      oldVersion: 6,
      newVersion: 7,
      createOld: v6.DatabaseAtV6.new,
      createNew: v7.DatabaseAtV7.new,
      openTestedDatabase: AppDatabase.new,
      createItems: createItems,
      validateItems: validateItems,
    );

    void objectiveAndKr(Batch batch, v6.DatabaseAtV6 oldDb) {
      batch.insert(
        oldDb.objectives,
        const v6.ObjectivesData(
          id: 'o1',
          createdAt: t,
          updatedAt: later,
          title: 'Get job',
          description: 'want to be employed',
          startDate: '2026-10-04',
          endDate: '2026-10-05',
          status: 'active',
          sortOrder: 0,
          color: '#FF7A9C',
        ),
      );
      batch.insert(
        oldDb.keyResults,
        const v6.KeyResultsData(
          id: 'kr1',
          createdAt: t,
          updatedAt: later,
          objectiveId: 'o1',
          title: 'Kann',
          description: '',
          measureType: 'numeric',
          startValue: 0,
          targetValue: 5,
          currentValue: 4,
          step: 1,
          deadline: '2026-10-16',
          sortOrder: 0,
          color: '#FFE066',
        ),
      );
    }

    test('objectives become goals and key results measures', () async {
      await migrate(objectiveAndKr, (newDb) async {
        expect(await newDb.select(newDb.goals).get(), [
          const v7.GoalsData(
            id: 'o1',
            createdAt: t,
            updatedAt: later,
            title: 'Get job',
            description: 'want to be employed',
            startDate: '2026-10-04',
            endDate: '2026-10-05',
            status: 'active',
            sortOrder: 0,
            color: '#FF7A9C',
          ),
        ]);
        // Deadline and color of the KR are gone.
        expect(await newDb.select(newDb.measures).get(), [
          const v7.MeasuresData(
            id: 'kr1',
            createdAt: t,
            updatedAt: later,
            goalId: 'o1',
            title: 'Kann',
            description: '',
            measureType: 'numeric',
            startValue: 0,
            targetValue: 5,
            currentValue: 4,
            step: 1,
            sortOrder: 0,
          ),
        ]);
      });
    });

    test('links to a key result or objective move to the goal', () async {
      await migrate(
        (batch, oldDb) {
          objectiveAndKr(batch, oldDb);
          batch.insert(
            oldDb.projects,
            const v6.ProjectsData(
              id: 'p1',
              createdAt: t,
              updatedAt: later,
              title: 'Create app',
              description: '',
              keyResultId: 'kr1',
              status: 'active',
              importance: 3,
              nextStepTaskId: 't1',
            ),
          );
          batch.insert(
            oldDb.projects,
            const v6.ProjectsData(
              id: 'p2',
              createdAt: t,
              updatedAt: later,
              title: 'Bier',
              description: '',
              status: 'completed',
              importance: 2,
            ),
          );
          for (final (id, kr, objective) in [
            ('t1', null, null),
            ('t2', 'kr1', null),
            ('t3', null, 'o1'),
          ]) {
            batch.insert(
              oldDb.tasks,
              v6.TasksData(
                id: id,
                createdAt: t,
                updatedAt: t,
                projectId: id == 't1' ? 'p1' : null,
                keyResultId: kr,
                objectiveId: objective,
                title: 'Task $id',
                notes: '',
                status: 'open',
              ),
            );
          }
          batch.insert(
            oldDb.habits,
            const v6.HabitsData(
              id: 'h1',
              createdAt: t,
              updatedAt: t,
              title: 'Drink',
              projectId: 'p1',
              keyResultId: 'kr1',
              scheduleType: 'daily',
              active: 1,
            ),
          );
          batch.insert(
            oldDb.logEntries,
            const v6.LogEntriesData(
              id: 'l1',
              createdAt: t,
              updatedAt: t,
              keyResultId: 'kr1',
              occurredAt: t,
              note: 'Interview',
              source: 'manual',
            ),
          );
        },
        (newDb) async {
          final projects = {
            for (final p in await newDb.select(newDb.projects).get()) p.id: p,
          };
          expect(projects['p1']!.goalId, 'o1');
          expect(projects['p1']!.nextStepTaskId, 't1');
          expect(projects['p1']!.updatedAt, later);
          expect(projects['p1']!.completedAt, isNull);
          expect(projects['p2']!.goalId, isNull);
          expect(projects['p2']!.completedAt, later);

          final tasks = {
            for (final t in await newDb.select(newDb.tasks).get()) t.id: t,
          };
          expect(tasks['t1']!.projectId, 'p1');
          expect(tasks['t1']!.goalId, isNull);
          expect(tasks['t2']!.goalId, 'o1');
          expect(tasks['t3']!.goalId, 'o1');

          final habit = (await newDb.select(newDb.habits).get()).single;
          expect(habit.projectId, 'p1');
          expect(habit.goalId, 'o1');

          final entry = (await newDb.select(newDb.logEntries).get()).single;
          expect(entry.goalId, 'o1');
          expect(entry.note, 'Interview');
        },
      );
    });

    test('review snapshots and deleted rows move along', () async {
      await migrate(
        (batch, oldDb) {
          objectiveAndKr(batch, oldDb);
          batch.insert(
            oldDb.keyResults,
            const v6.KeyResultsData(
              id: 'kr2',
              createdAt: t,
              updatedAt: deleted,
              deletedAt: deleted,
              objectiveId: 'o1',
              title: 'Old',
              description: '',
              measureType: 'boolean',
              startValue: 0,
              targetValue: 1,
              currentValue: 0,
              step: 1,
              sortOrder: 1,
            ),
          );
          batch.insert(
            oldDb.weeklyReviews,
            const v6.WeeklyReviewsData(
              id: 'r1',
              createdAt: t,
              updatedAt: t,
              weekStart: '2026-09-28',
              score: 7,
              reflection: '',
              planNextWeek: '',
              completedAt: t,
            ),
          );
          batch.insert(
            oldDb.reviewKrSnapshots,
            const v6.ReviewKrSnapshotsData(
              id: 's1',
              createdAt: t,
              updatedAt: t,
              weeklyReviewId: 'r1',
              keyResultId: 'kr1',
              progress: 0.6,
            ),
          );
        },
        (newDb) async {
          expect(await newDb.select(newDb.reviewMeasureSnapshots).get(), [
            const v7.ReviewMeasureSnapshotsData(
              id: 's1',
              createdAt: t,
              updatedAt: t,
              weeklyReviewId: 'r1',
              measureId: 'kr1',
              progress: 0.6,
            ),
          ]);
          final old = await (newDb.select(
            newDb.measures,
          )..where((m) => m.id.equals('kr2'))).getSingle();
          expect(old.deletedAt, deleted);
          expect(old.measureType, 'boolean');
        },
      );
    });
  });
}
