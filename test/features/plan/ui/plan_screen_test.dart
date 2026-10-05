import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:orbit/core/db/app_database.dart';
import 'package:orbit/core/router/routes.dart';
import 'package:orbit/features/key_results/ui/key_result_tile.dart';
import 'package:orbit/features/projects/ui/project_tile.dart';

import '../../../helpers/pump_app.dart';
import '../../../helpers/seed.dart';
import '../../../helpers/test_db.dart';

/// The URL the router reports to the browser.
String location(WidgetTester tester, ({AppDatabase db, GoRouter router}) app) =>
    app.router.routeInformationProvider.value.uri.path;

void main() {
  late AppDatabase db;
  late Seed seed;

  setUp(() {
    db = newTestDatabase();
    seed = Seed(db);
  });

  group('scaffold', () {
    for (final (entry, route) in [
      ('Archive', Routes.archive),
      ('Habits', Routes.habits),
      ('Areas', Routes.areas),
      ('Settings', Routes.settings),
    ]) {
      testApp('menu entry $entry opens $route', (tester) async {
        final app = await pumpApp(tester, db: db, location: Routes.plan);
        await tester.tap(find.byTooltip('More'));
        await tester.pumpAndSettle();
        await tester.tap(find.text(entry));
        await tester.pumpAndSettle();
        expect(location(tester, app), route);
        expect(find.widgetWithText(AppBar, entry), findsOneWidget);
      });
    }

    for (final (entry, route) in [
      ('New objective', Routes.newObjective),
      ('New project', Routes.newProject),
      ('New habit', Routes.newHabit),
    ]) {
      testApp('create menu entry $entry opens $route', (tester) async {
        final app = await pumpApp(tester, db: db, location: Routes.plan);
        await tester.tap(find.byTooltip('Create'));
        await tester.pumpAndSettle();
        await tester.tap(find.text(entry));
        await tester.pumpAndSettle();
        expect(location(tester, app), route);
      });
    }
  });

  group('Overview', () {
    testApp('shows objective → KR → project', (tester) async {
      final o = await seed.objective(title: 'Get fit');
      final kr = await seed.kr(o.id, title: 'Run 100 km');
      await seed.kr(o.id, title: 'Swim 10 km');
      await seed.projects.create(title: 'Marathon plan', keyResultId: kr.id);
      await seed.projects.create(title: 'Tax return');
      await pumpApp(tester, db: db, location: Routes.plan);

      expect(find.text('Get fit'), findsOneWidget);
      expect(find.text('01-10-2026 – 31-12-2026'), findsOneWidget);
      expect(find.byType(KeyResultTile), findsNWidgets(2));
      expect(find.text('20 / 100 km · 20%'), findsNWidgets(2));

      // The project is listed right after its KR, before the next KR.
      final run = tester.getTopLeft(find.text('Run 100 km')).dy;
      final marathon = tester.getTopLeft(find.text('Marathon plan')).dy;
      final swim = tester.getTopLeft(find.text('Swim 10 km')).dy;
      expect(run < marathon && marathon < swim, isTrue);

      final withoutKr = tester
          .getTopLeft(find.text('Projects without a KR'))
          .dy;
      final tax = tester.getTopLeft(find.text('Tax return')).dy;
      expect(withoutKr < tax, isTrue);
      expect(find.byType(ProjectTile), findsNWidgets(2));
    });

    testApp('empty state offers to create an objective', (tester) async {
      final app = await pumpApp(tester, db: db, location: Routes.plan);
      expect(find.text('No active objectives.'), findsOneWidget);
      await tester.tap(find.text('Create objective'));
      await tester.pumpAndSettle();
      expect(location(tester, app), Routes.newObjective);
    });

    testApp('objective without KRs shows a hint and Add key result', (
      tester,
    ) async {
      final o = await seed.objective();
      final app = await pumpApp(tester, db: db, location: Routes.plan);
      expect(find.text('No key results yet.'), findsOneWidget);
      await tester.tap(find.text('Add key result'));
      await tester.pumpAndSettle();
      expect(location(tester, app), Routes.newKeyResult(o.id));
    });

    testApp('tapping a KR opens its edit form', (tester) async {
      final o = await seed.objective();
      final kr = await seed.kr(o.id, title: 'Run 100 km');
      final app = await pumpApp(tester, db: db, location: Routes.plan);
      await tester.tap(find.text('Run 100 km'));
      await tester.pumpAndSettle();
      expect(location(tester, app), Routes.keyResult(kr.id));
      expect(find.text('Edit key result'), findsOneWidget);
    });

    testApp('tapping a project opens its detail', (tester) async {
      final o = await seed.objective();
      final kr = await seed.kr(o.id);
      final p = await seed.projects.create(
        title: 'Marathon plan',
        keyResultId: kr.id,
      );
      final app = await pumpApp(tester, db: db, location: Routes.plan);
      await tester.tap(find.text('Marathon plan'));
      await tester.pumpAndSettle();
      expect(location(tester, app), Routes.projectDetail(p.id));
      expect(find.text('Status: Active'), findsOneWidget);
    });

    testApp('saving a form updates the Overview without reload', (
      tester,
    ) async {
      final o = await seed.objective();
      final kr = await seed.kr(o.id);
      final p = await seed.projects.create(
        title: 'Marathon plan',
        keyResultId: kr.id,
      );
      final app = await pumpApp(tester, db: db, location: Routes.plan);
      app.router.push(Routes.project(p.id));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Backlog').last);
      await tester.tap(find.text('Save'));
      await tester.pumpAndSettle();

      expect(find.widgetWithText(AppBar, 'Plan'), findsOneWidget);
      expect(find.text('Marathon plan'), findsNothing);
      await tester.tap(find.widgetWithText(Tab, 'Backlog'));
      await tester.pumpAndSettle();
      expect(find.text('Marathon plan'), findsOneWidget);
      expect((await seed.projects.get(p.id))!.status, ProjectStatus.backlog);
    });
  });

  group('Backlog', () {
    testApp('tapping a project opens its detail', (tester) async {
      final p = await seed.projects.create(
        title: 'Garden',
        status: ProjectStatus.backlog,
      );
      final app = await pumpApp(tester, db: db, location: Routes.plan);
      await tester.tap(find.widgetWithText(Tab, 'Backlog'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Garden'));
      await tester.pumpAndSettle();
      expect(location(tester, app), Routes.projectDetail(p.id));
      expect(find.text('Status: Backlog'), findsOneWidget);
    });

    testApp('activating moves the project to Overview', (tester) async {
      final o = await seed.objective();
      final kr = await seed.kr(o.id, title: 'Run 100 km');
      await seed.projects.create(
        title: 'Marathon plan',
        keyResultId: kr.id,
        status: ProjectStatus.backlog,
      );
      await seed.projects.create(title: 'Active one');
      await pumpApp(tester, db: db, location: Routes.plan);
      expect(find.text('Marathon plan'), findsNothing);

      await tester.tap(find.widgetWithText(Tab, 'Backlog'));
      await tester.pumpAndSettle();
      expect(find.text('Marathon plan'), findsOneWidget);
      expect(find.text('Backlog'), findsWidgets);
      expect(find.text('Active one'), findsNothing);

      await tester.tap(find.text('Activate'));
      await tester.pumpAndSettle();
      expect(find.text('Marathon plan'), findsNothing);

      await tester.tap(find.widgetWithText(Tab, 'Overview'));
      await tester.pumpAndSettle();
      final run = tester.getTopLeft(find.text('Run 100 km')).dy;
      final marathon = tester.getTopLeft(find.text('Marathon plan')).dy;
      expect(marathon > run, isTrue);
    });

    testApp('filters by area and by no area', (tester) async {
      final areas = await (db.select(db.areas)).get();
      final uni = areas.firstWhere((a) => a.name == 'Uni');
      final job = areas.firstWhere((a) => a.name == 'Job');
      await seed.projects.create(
        title: 'Seminar paper',
        areaId: uni.id,
        status: ProjectStatus.backlog,
      );
      await seed.projects.create(
        title: 'Career plan',
        areaId: job.id,
        status: ProjectStatus.paused,
      );
      await seed.projects.create(
        title: 'Loose idea',
        status: ProjectStatus.backlog,
      );
      await pumpApp(tester, db: db, location: Routes.plan);
      await tester.tap(find.widgetWithText(Tab, 'Backlog'));
      await tester.pumpAndSettle();

      expect(find.byType(ProjectTile), findsNWidgets(3));
      expect(find.text('Paused'), findsOneWidget);

      await tester.ensureVisible(find.widgetWithText(ChoiceChip, 'Uni'));
      await tester.tap(find.widgetWithText(ChoiceChip, 'Uni'));
      await tester.pumpAndSettle();
      expect(find.byType(ProjectTile), findsOneWidget);
      expect(find.text('Seminar paper'), findsOneWidget);

      await tester.ensureVisible(find.widgetWithText(ChoiceChip, 'No area'));
      await tester.tap(find.widgetWithText(ChoiceChip, 'No area'));
      await tester.pumpAndSettle();
      expect(find.byType(ProjectTile), findsOneWidget);
      expect(find.text('Loose idea'), findsOneWidget);
    });
  });

  group('Archive', () {
    testApp('restoring a project to active removes it from the Archive', (
      tester,
    ) async {
      final p = await seed.projects.create(
        title: 'Old project',
        status: ProjectStatus.completed,
      );
      final o = await seed.objective(title: 'Old goal');
      await seed.objectives.update(
        o.copyWith(status: ObjectiveStatus.archived),
      );
      await seed.objective(title: 'Current goal');
      await pumpApp(tester, db: db, location: Routes.archive);

      expect(find.text('Old project'), findsOneWidget);
      expect(find.text('Old goal'), findsOneWidget);
      expect(find.text('Current goal'), findsNothing);

      await tester.tap(find.text('Old project'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Active'));
      await tester.tap(find.text('Save'));
      await tester.pumpAndSettle();

      expect(find.widgetWithText(AppBar, 'Archive'), findsOneWidget);
      expect(find.text('Old project'), findsNothing);
      expect((await seed.projects.get(p.id))!.status, ProjectStatus.active);
    });
  });
}
