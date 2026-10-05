import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:orbit/core/db/app_database.dart';
import 'package:orbit/core/router/routes.dart';
import 'package:orbit/features/log/ui/log_entry_tile.dart';
import 'package:orbit/features/tasks/ui/task_tile.dart';

import '../../../helpers/pump_app.dart';
import '../../../helpers/seed.dart';
import '../../../helpers/test_db.dart';

void main() {
  late AppDatabase db;
  late Seed seed;
  setUp(() {
    db = newTestDatabase();
    seed = Seed(db);
  });

  group('route', () {
    testApp('pushing the detail route shows the project', (tester) async {
      final p = await seed.projects.create(title: 'Thesis');
      final app = await pumpApp(tester, db: db);
      app.router.push(Routes.projectDetail(p.id));
      await tester.pumpAndSettle();

      expect(find.widgetWithText(AppBar, 'Thesis'), findsOneWidget);
      expect(
        app.router.routeInformationProvider.value.uri.path,
        '/projects/${p.id}',
      );
    });

    testApp('starting at the detail URL (reload) shows it again', (
      tester,
    ) async {
      final p = await seed.projects.create(title: 'Thesis');
      await pumpApp(tester, db: db, location: Routes.projectDetail(p.id));

      expect(find.widgetWithText(AppBar, 'Thesis'), findsOneWidget);
    });
  });

  group('information', () {
    testApp('shows fields and an inherited effective deadline', (tester) async {
      final o = await seed.objective(end: CalendarDate(2026, 12, 31));
      final kr = await seed.kr(
        o.id,
        title: 'Run 100 km',
        deadline: CalendarDate(2026, 11, 15),
      );
      final p = await seed.projects.create(
        title: 'Marathon',
        description: 'Spring race',
        keyResultId: kr.id,
        importance: 4,
      );
      await pumpApp(tester, db: db, location: Routes.projectDetail(p.id));

      expect(find.text('Spring race'), findsOneWidget);
      expect(find.text('Status: Active'), findsOneWidget);
      expect(find.text('No area'), findsOneWidget);
      expect(find.text('Key result: Run 100 km'), findsOneWidget);
      expect(find.text('Importance 4'), findsOneWidget);
      expect(find.text('No own deadline'), findsOneWidget);
      expect(
        find.text('Effective: Due 15-11-2026 (from key result)'),
        findsOneWidget,
      );
    });

    testApp('edit opens the project form', (tester) async {
      final p = await seed.projects.create(title: 'Thesis');
      await pumpApp(tester, db: db, location: Routes.projectDetail(p.id));
      await tester.tap(find.byTooltip('Edit project'));
      await tester.pumpAndSettle();

      expect(find.text('Edit project'), findsOneWidget);
    });

    testApp('an unknown project shows "Project not found"', (tester) async {
      await pumpApp(tester, db: db, location: Routes.projectDetail('nope'));
      expect(find.text('Project not found'), findsOneWidget);
    });

    testApp('deleting from the edit form leaves "Project not found"', (
      tester,
    ) async {
      final p = await seed.projects.create(title: 'Thesis');
      final app = await pumpApp(tester, db: db);
      app.router.push(Routes.projectDetail(p.id));
      await tester.pumpAndSettle();
      await tester.tap(find.byTooltip('Edit project'));
      await tester.pumpAndSettle();
      await tester.tap(find.byTooltip('Delete project'));
      await tester.pumpAndSettle();
      await tester.tap(find.widgetWithText(FilledButton, 'Delete'));
      await tester.pumpAndSettle();

      expect(find.text('Project not found'), findsOneWidget);
      expect(app.router.state.uri.path, '/projects/${p.id}');
    });
  });

  group('next step and tasks', () {
    testApp('shows the next step', (tester) async {
      final p = await seed.projects.create(
        title: 'Thesis',
        nextStep: 'Write intro',
      );
      await pumpApp(tester, db: db, location: Routes.projectDetail(p.id));
      // The next-step line and the task tile.
      expect(find.widgetWithText(ListTile, 'Write intro'), findsNWidgets(2));
    });

    testApp('without next step or tasks shows that', (tester) async {
      final p = await seed.projects.create(title: 'Garden');
      await pumpApp(tester, db: db, location: Routes.projectDetail(p.id));
      expect(find.text('No next step'), findsOneWidget);
      expect(find.text('No open tasks'), findsOneWidget);
    });

    testApp('adding a task shows it without a reload', (tester) async {
      final p = await seed.projects.create(title: 'Thesis');
      await pumpApp(tester, db: db, location: Routes.projectDetail(p.id));
      await tester.tap(find.text('Add task'));
      await tester.pumpAndSettle();
      await tester.enterText(
        find.widgetWithText(TextField, 'Title'),
        'Book venue',
      );
      await tester.tap(find.text('Save'));
      await tester.pumpAndSettle();

      expect(find.widgetWithText(ListTile, 'Book venue'), findsOneWidget);
      expect(find.text('No open tasks'), findsNothing);
    });

    testApp('"Set next step" creates the next step', (tester) async {
      final p = await seed.projects.create(title: 'Thesis');
      await pumpApp(tester, db: db, location: Routes.projectDetail(p.id));
      await tester.tap(find.text('Set next step'));
      await tester.pumpAndSettle();
      expect(find.text('New next step'), findsOneWidget);
      await tester.enterText(
        find.widgetWithText(TextField, 'Title'),
        'Draft outline',
      );
      await tester.tap(find.text('Save'));
      await tester.pumpAndSettle();

      expect(find.text('No next step'), findsNothing);
      final next = await seed.projects.nextStep(
        (await seed.projects.get(p.id))!,
      );
      expect(next!.title, 'Draft outline');
    });

    testApp('completing the next step opens the prompt', (tester) async {
      final p = await seed.projects.create(title: 'Thesis', nextStep: 'Draft');
      await pumpApp(tester, db: db, location: Routes.projectDetail(p.id));
      await tester.tap(find.bySemanticsLabel('Complete Draft'));
      await tester.pumpAndSettle();
      expect(find.text("What's the next step?"), findsOneWidget);

      await tester.enterText(
        find.widgetWithText(TextField, 'New next step'),
        'Write intro',
      );
      await tester.tap(find.text('Set next step'));
      await tester.pumpAndSettle();

      expect(find.text('Task completed'), findsOneWidget);
      expect(find.widgetWithText(TaskTile, 'Draft'), findsNothing);
      expect(find.widgetWithText(TaskTile, 'Write intro'), findsOneWidget);
      // The completed step is in the log.
      expect(find.widgetWithText(LogEntryTile, 'Draft'), findsOneWidget);
    });
  });

  group('habits', () {
    testApp('lists linked habits with their schedule', (tester) async {
      final p = await seed.projects.create(title: 'Marathon');
      await seed.habits.create(
        title: 'Run',
        projectId: p.id,
        scheduleType: ScheduleType.weekdays,
        weekdays: {1, 3, 5},
      );
      await seed.habits.create(
        title: 'Stretch',
        projectId: p.id,
        scheduleType: ScheduleType.daily,
        active: false,
      );
      await seed.habits.create(title: 'Read', scheduleType: ScheduleType.daily);
      await pumpApp(tester, db: db, location: Routes.projectDetail(p.id));
      await tester.scrollUntilVisible(find.text('Stretch'), 100);

      expect(find.text('Run'), findsOneWidget);
      expect(find.text('Mon, Wed, Fri'), findsOneWidget);
      expect(find.text('Daily · Inactive'), findsOneWidget);
      expect(find.text('Read'), findsNothing);
    });

    testApp('without habits shows "No habits"', (tester) async {
      final p = await seed.projects.create(title: 'Thesis');
      await pumpApp(tester, db: db, location: Routes.projectDetail(p.id));
      await tester.scrollUntilVisible(find.text('No habits'), 100);
      expect(find.text('No habits'), findsOneWidget);
    });
  });

  group('status actions', () {
    testApp('an active project offers all but Activate', (tester) async {
      final p = await seed.projects.create(title: 'Thesis');
      await pumpApp(tester, db: db, location: Routes.projectDetail(p.id));

      expect(find.text('Activate'), findsNothing);
      expect(find.text('Pause'), findsOneWidget);
      expect(find.text('Move to backlog'), findsOneWidget);
      expect(find.text('Complete'), findsOneWidget);
    });

    testApp('pause sets the status and shows it in the Backlog', (
      tester,
    ) async {
      final p = await seed.projects.create(title: 'Thesis');
      final app = await pumpApp(tester, db: db, location: Routes.plan);
      app.router.push(Routes.projectDetail(p.id));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Pause'));
      await tester.pumpAndSettle();

      expect(find.text('Status: Paused'), findsOneWidget);
      expect((await seed.projects.get(p.id))!.status, ProjectStatus.paused);

      app.router.pop();
      await tester.pumpAndSettle();
      await tester.tap(find.text('Backlog'));
      await tester.pumpAndSettle();
      expect(find.text('Thesis'), findsOneWidget);
    });

    testApp('complete puts the project in the Archive', (tester) async {
      final p = await seed.projects.create(title: 'Thesis');
      final app = await pumpApp(tester, db: db, location: Routes.archive);
      expect(find.text('Thesis'), findsNothing);
      app.router.push(Routes.projectDetail(p.id));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Complete'));
      await tester.pumpAndSettle();

      expect(find.text('Status: Completed'), findsOneWidget);
      expect(find.text('Activate'), findsOneWidget);
      app.router.pop();
      await tester.pumpAndSettle();
      expect(find.text('Thesis'), findsOneWidget);
    });
  });
}
