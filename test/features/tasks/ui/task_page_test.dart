import 'package:drift/drift.dart' hide isNull, isNotNull, Column;
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:orbit/core/db/app_database.dart';
import 'package:orbit/core/router/routes.dart';
import 'package:orbit/core/time/today.dart';
import 'package:orbit/features/tasks/domain/task_assignment.dart';

import '../../../helpers/pump_app.dart';
import '../../../helpers/seed.dart';
import '../../../helpers/test_db.dart';

final today = CalendarDate(2026, 10, 5);

void main() {
  late AppDatabase db;
  late Seed seed;
  setUp(() {
    db = newTestDatabase();
    seed = Seed(db);
  });

  Future<({AppDatabase db, GoRouter router})> openTask(
    WidgetTester tester,
    String id,
  ) => pumpApp(
    tester,
    db: db,
    location: Routes.task(id),
    overrides: [todayProvider.overrideWithValue(today)],
  );

  Future<List<LogEntry>> entries(String taskId) => (db.select(
    db.logEntries,
  )..where((e) => e.taskId.equals(taskId) & e.deletedAt.isNull())).get();

  testApp('shows deadline, status and assignment', (tester) async {
    final o = await seed.objective();
    final kr = await seed.kr(o.id, title: 'Run 100 km');
    final task = await seed.tasks.create(
      title: 'Book physio',
      assignment: ForKeyResult(kr.id),
      dueDate: today.addDays(3),
      notes: 'Ask about knee',
    );
    await openTask(tester, task.id);

    expect(find.text('Book physio'), findsOneWidget);
    expect(find.text('Open'), findsOneWidget);
    expect(find.text('Due in 3 days'), findsOneWidget);
    expect(find.text('Key result · Run 100 km'), findsOneWidget);
    expect(find.text('Ask about knee'), findsOneWidget);
  });

  testApp('a standalone task says so', (tester) async {
    final task = await seed.tasks.create(title: 'Tax return');
    await openTask(tester, task.id);
    expect(find.text('Standalone'), findsOneWidget);
  });

  testApp('tapping the assigned project opens it', (tester) async {
    final p = await seed.projects.create(title: 'Thesis');
    final task = await seed.tasks.create(projectId: p.id, title: 'Draft');
    final app = await openTask(tester, task.id);
    await tester.tap(find.text('Project · Thesis'));
    await tester.pumpAndSettle();
    expect(
      app.router.routeInformationProvider.value.uri.path,
      Routes.projectDetail(p.id),
    );
  });

  testApp('a deleted task is not found', (tester) async {
    final task = await seed.tasks.create(title: 'Gone');
    await seed.tasks.delete(task.id);
    await openTask(tester, task.id);
    expect(find.text('Task not found'), findsOneWidget);
  });

  testApp('complete, undo, complete again and reopen', (tester) async {
    final task = await seed.tasks.create(title: 'Tax return');
    await openTask(tester, task.id);

    await tester.tap(find.text('Complete'));
    await tester.pumpAndSettle();
    expect(find.text('Done'), findsOneWidget);
    await tester.tap(find.text('Undo'));
    await tester.pumpAndSettle();
    expect(find.text('Open'), findsOneWidget);
    expect(await entries(task.id), isEmpty);

    await tester.tap(find.text('Complete'));
    await tester.pumpAndSettle();
    expect(await entries(task.id), hasLength(1));
    await tester.tap(find.text('Reopen'));
    await tester.pumpAndSettle();
    expect(find.text('Open'), findsOneWidget);
    // The earlier log entry stays.
    expect(await entries(task.id), hasLength(1));
  });

  testApp('log work on a standalone task', (tester) async {
    final task = await seed.tasks.create(title: 'Tax return');
    await openTask(tester, task.id);
    expect(find.text('Nothing logged yet'), findsOneWidget);

    await tester.tap(find.text('Log work'));
    await tester.pumpAndSettle();
    await tester.enterText(
      find.widgetWithText(TextField, 'Minutes (optional)'),
      '30',
    );
    await tester.tap(find.text('Save'));
    await tester.pumpAndSettle();

    expect(find.textContaining('30 min · Manual'), findsOneWidget);
    expect((await entries(task.id)).single.durationMinutes, 30);
  });

  group('make next step', () {
    testApp('a project task becomes the next step from its page', (
      tester,
    ) async {
      final p = await seed.projects.create(
        title: 'Wedding',
        nextStep: 'Draft outline',
      );
      final venue = await seed.tasks.create(
        projectId: p.id,
        title: 'Book venue',
      );
      await openTask(tester, venue.id);
      expect(find.text('Next step'), findsNothing);

      await tester.tap(find.text('Make next step'));
      await tester.pumpAndSettle();
      expect((await seed.projects.get(p.id))!.nextStepTaskId, venue.id);
      expect(find.text('Next step'), findsOneWidget);
      expect(find.text('Make next step'), findsNothing);
    });

    testApp('a standalone task offers no Make next step', (tester) async {
      final task = await seed.tasks.create(title: 'Tax return');
      await openTask(tester, task.id);
      expect(find.text('Make next step'), findsNothing);
    });
  });

  testApp('delete from the page asks first and leaves the page', (
    tester,
  ) async {
    final p = await seed.projects.create(title: 'Thesis');
    final task = await seed.tasks.create(projectId: p.id, title: 'Book venue');
    final app = await pumpApp(
      tester,
      db: db,
      overrides: [todayProvider.overrideWithValue(today)],
    );
    app.router.push(Routes.task(task.id));
    await tester.pumpAndSettle();

    await tester.tap(find.byTooltip('Delete task'));
    await tester.pumpAndSettle();
    expect(find.text('Delete task?'), findsOneWidget);
    await tester.tap(find.widgetWithText(FilledButton, 'Delete'));
    await tester.pumpAndSettle();

    expect(app.router.state.uri.path, Routes.home);
    final alive = await (db.select(
      db.tasks,
    )..where((t) => t.deletedAt.isNull())).get();
    expect(alive, isEmpty);
  });
}
