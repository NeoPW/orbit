import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:orbit/core/db/app_database.dart';
import 'package:orbit/core/router/routes.dart';
import 'package:orbit/core/space/solar_system.dart';
import 'package:orbit/core/widgets/form_sheet.dart';
import 'package:orbit/core/widgets/orbit_chips.dart';
import 'package:orbit/features/goals/ui/goal_screen.dart';
import 'package:orbit/features/goals/ui/measure_tile.dart';
import 'package:orbit/features/projects/ui/project_detail_screen.dart';
import 'package:orbit/features/projects/ui/project_tile.dart';
import 'package:orbit/features/tasks/domain/task_assignment.dart';
import 'package:orbit/features/tasks/ui/task_screen.dart';

import '../../../helpers/pump_app.dart';
import '../../../helpers/seed.dart';
import '../../../helpers/test_db.dart';

/// The URL the router reports to the browser.
String location(WidgetTester tester, ({AppDatabase db, GoRouter router}) app) =>
    app.router.routeInformationProvider.value.uri.path;

/// A goal's title on its card, not its planet's label.
Finder inCard(String text) =>
    find.descendant(of: find.byType(Card), matching: find.text(text));

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
    ]) {
      testApp('More sheet tile $entry opens $route', (tester) async {
        final app = await pumpApp(tester, db: db, location: Routes.plan);
        await tester.tap(find.byTooltip('More'));
        await tester.pumpAndSettle();
        expect(find.byType(BottomSheet), findsOneWidget);
        expect(find.byType(PopupMenuItem<String>), findsNothing);
        await tester.tap(
          find.descendant(
            of: find.byType(BottomSheet),
            matching: find.text(entry),
          ),
        );
        await tester.pumpAndSettle();
        expect(location(tester, app), route);
        expect(find.widgetWithText(AppBar, entry), findsOneWidget);
      });
    }

    for (final entry in ['New goal', 'New project', 'New habit']) {
      testApp('create menu entry $entry opens its form in a sheet', (
        tester,
      ) async {
        final app = await pumpApp(tester, db: db, location: Routes.plan);
        await tester.tap(find.byTooltip('Create'));
        await tester.pumpAndSettle();
        await tester.tap(find.text(entry));
        await tester.pumpAndSettle();
        expect(find.byType(BottomSheet), findsOneWidget);
        expect(
          find.descendant(
            of: find.byType(FormSheetFrame),
            matching: find.text(entry),
          ),
          findsOneWidget,
        );
        expect(location(tester, app), Routes.plan);
      });
    }
  });

  group('Overview', () {
    testApp('shows goal → measures → projects', (tester) async {
      final g = await seed.goal(title: 'Get fit');
      await seed.measure(g.id, title: 'Run 100 km');
      await seed.measure(g.id, title: 'Swim 10 km');
      await seed.projects.create(title: 'Marathon plan', goalId: g.id);
      await seed.projects.create(title: 'Tax return');
      await pumpApp(tester, db: db, location: Routes.plan, height: 1400);

      expect(inCard('Get fit'), findsOneWidget);
      expect(find.text('01-10-2026 – 31-12-2026'), findsOneWidget);
      expect(find.text('20 %'), findsOneWidget);
      // Measures collapsed by default.
      expect(find.byType(MeasureTile), findsNothing);
      await tester.tap(find.text('2 measures'));
      await tester.pumpAndSettle();
      expect(find.byType(MeasureTile), findsNWidgets(2));
      expect(find.text('20 / 100 km'), findsNWidgets(2));

      // The goal's projects follow its measures.
      final swim = tester.getTopLeft(find.text('Swim 10 km')).dy;
      final marathon = tester.getTopLeft(find.text('Marathon plan')).dy;
      expect(swim < marathon, isTrue);

      final withoutGoal = tester
          .getTopLeft(find.text('Projects without a goal'))
          .dy;
      final tax = tester.getTopLeft(find.text('Tax return')).dy;
      expect(withoutGoal < tax, isTrue);
      expect(find.byType(ProjectTile), findsNWidgets(2));
    });

    testApp('chips instead of text lines', (tester) async {
      await seed.projects.create(title: 'Tax return', importance: 4);
      await pumpApp(tester, db: db, location: Routes.plan);
      expect(find.byType(ImportanceDots), findsOneWidget);
      expect(find.text('No area'), findsNothing);
      expect(find.text('No deadline'), findsNothing);
      expect(find.textContaining('Importance'), findsNothing);
    });

    testApp('tasks under a goal open their page', (tester) async {
      final g = await seed.goal(title: 'Get fit');
      final physio = await seed.tasks.create(
        title: 'Book physio',
        assignment: ForGoal(g.id),
      );
      await seed.tasks.create(title: 'Standalone chore');
      final app = await pumpApp(tester, db: db, location: Routes.plan);

      final goal = tester.getTopLeft(inCard('Get fit')).dy;
      final book = tester.getTopLeft(find.text('Book physio')).dy;
      expect(goal < book, isTrue);
      expect(find.text('Standalone chore'), findsNothing);

      await tester.tap(find.text('Book physio'));
      await tester.pumpAndSettle();
      expect(location(tester, app), Routes.task(physio.id));
    });

    testApp('empty state offers to create a goal', (tester) async {
      final app = await pumpApp(tester, db: db, location: Routes.plan);
      expect(find.text('No active goals'), findsOneWidget);
      expect(find.byType(SolarSystem), findsNothing);
      await tester.tap(find.text('Create goal'));
      await tester.pumpAndSettle();
      expect(find.widgetWithText(FormSheetFrame, 'New goal'), findsOne);
      expect(location(tester, app), Routes.plan);
    });

    testApp('the full solar system sits above the goals; a planet opens', (
      tester,
    ) async {
      final g = await seed.goal(title: 'Get fit');
      final app = await pumpApp(tester, db: db, location: Routes.plan);
      final system = tester.widget<SolarSystem>(find.byType(SolarSystem));
      expect(system.compact, isFalse);
      expect(system.planets.single.label, 'Get fit');
      expect(
        tester.getBottomLeft(find.byType(SolarSystem)).dy,
        lessThan(tester.getTopLeft(find.text('01-10-2026 – 31-12-2026')).dy),
      );
      await tester.tap(find.bySemanticsLabel('Get fit').first);
      await tester.pumpAndSettle();
      expect(location(tester, app), Routes.goal(g.id));
    });

    testApp('a goal without measures offers Add measure', (tester) async {
      final g = await seed.goal();
      final app = await pumpApp(tester, db: db, location: Routes.plan);
      expect(find.textContaining('%'), findsNothing);
      await tester.tap(find.text('Add measure'));
      await tester.pumpAndSettle();
      expect(find.widgetWithText(FormSheetFrame, 'New measure'), findsOne);
      expect(
        find.descendant(
          of: find.byType(FormSheetFrame),
          matching: find.text(g.title),
        ),
        findsOneWidget,
      );
      expect(location(tester, app), Routes.plan);
    });

    testApp('Add a measure from the Plan tab', (tester) async {
      final g = await seed.goal();
      await seed.measure(g.id);
      await pumpApp(tester, db: db, location: Routes.plan);
      await tester.tap(find.text('1 measure'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Add measure'));
      await tester.pumpAndSettle();
      expect(find.widgetWithText(FormSheetFrame, 'New measure'), findsOne);
    });

    testApp('tapping a measure opens the page of its goal', (tester) async {
      final g = await seed.goal();
      await seed.measure(g.id, title: 'Run 100 km');
      final app = await pumpApp(tester, db: db, location: Routes.plan);
      await tester.tap(find.text('1 measure'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Run 100 km'));
      await tester.pumpAndSettle();
      expect(location(tester, app), Routes.goal(g.id));
      expect(find.byType(GoalPageBody), findsOneWidget);
    });

    testApp('tapping a goal opens its page; Edit there opens the form', (
      tester,
    ) async {
      final g = await seed.goal();
      final app = await pumpApp(tester, db: db, location: Routes.plan);
      await tester.tap(inCard('Get fit'));
      await tester.pumpAndSettle();
      expect(location(tester, app), Routes.goal(g.id));
      expect(find.byType(GoalPageBody), findsOneWidget);
      expect(find.text('Edit goal'), findsNothing);

      await tester.tap(find.byTooltip('Edit goal'));
      await tester.pumpAndSettle();
      expect(find.text('Edit goal'), findsOneWidget);
      expect(find.byType(BottomSheet), findsOneWidget);
    });

    testApp('tapping a project opens its detail', (tester) async {
      final g = await seed.goal();
      final p = await seed.projects.create(
        title: 'Marathon plan',
        goalId: g.id,
      );
      final app = await pumpApp(tester, db: db, location: Routes.plan);
      await tester.tap(find.text('Marathon plan'));
      await tester.pumpAndSettle();
      expect(location(tester, app), Routes.projectDetail(p.id));
      expect(
        find.widgetWithText(StatusChip<ProjectStatus>, 'Active'),
        findsOneWidget,
      );
    });

    testApp('saving a form updates the Overview without reload', (
      tester,
    ) async {
      final g = await seed.goal();
      final p = await seed.projects.create(
        title: 'Marathon plan',
        goalId: g.id,
      );
      final app = await pumpApp(tester, db: db, location: Routes.plan);
      app.router.push(Routes.projectDetail(p.id));
      await tester.pumpAndSettle();
      await tester.tap(find.byTooltip('Edit project'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Backlog').last);
      await tester.tap(find.text('Save'));
      await tester.pumpAndSettle();
      app.router.pop();
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
      expect(
        find.widgetWithText(StatusChip<ProjectStatus>, 'Backlog'),
        findsOneWidget,
      );
    });

    testApp('activating moves the project to Overview', (tester) async {
      final g = await seed.goal();
      await seed.measure(g.id, title: 'Run 100 km');
      await seed.projects.create(
        title: 'Marathon plan',
        goalId: g.id,
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
      final run = tester.getTopLeft(find.text('1 measure')).dy;
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

  group('two panes', () {
    testApp('at 1400 px a project opens next to the list', (tester) async {
      await seed.projects.create(title: 'Thesis');
      final app = await pumpApp(
        tester,
        db: db,
        location: Routes.plan,
        width: 1400,
      );
      expect(find.text('Select an item to see it here'), findsOneWidget);

      await tester.tap(find.text('Thesis'));
      await tester.pumpAndSettle();

      expect(location(tester, app), Routes.plan);
      // The list stays visible, the detail is on its right.
      final tile = find.widgetWithText(ProjectTile, 'Thesis');
      expect(tile, findsOneWidget);
      final detail = find.byType(ProjectDetailBody);
      expect(detail, findsOneWidget);
      expect(
        tester.getTopLeft(detail).dx,
        greaterThan(tester.getTopRight(tile).dx),
      );
      expect(
        find.widgetWithText(StatusChip<ProjectStatus>, 'Active'),
        findsOneWidget,
      );

      await tester.tap(find.byTooltip('Close'));
      await tester.pumpAndSettle();
      expect(find.byType(ProjectDetailBody), findsNothing);
    });

    testApp('at 1400 px a task of a goal opens in the pane', (tester) async {
      final g = await seed.goal();
      await seed.tasks.create(title: 'Book physio', assignment: ForGoal(g.id));
      final app = await pumpApp(
        tester,
        db: db,
        location: Routes.plan,
        width: 1400,
      );
      await tester.tap(find.text('Book physio'));
      await tester.pumpAndSettle();

      expect(location(tester, app), Routes.plan);
      expect(find.byType(TaskPageBody), findsOneWidget);
      expect(find.text('Goal · Get fit'), findsOneWidget);
    });

    testApp('at 1400 px a goal opens in the pane, also from a measure', (
      tester,
    ) async {
      final g = await seed.goal();
      await seed.measure(g.id, title: 'Run 100 km');
      final app = await pumpApp(
        tester,
        db: db,
        location: Routes.plan,
        width: 1400,
      );
      await tester.tap(find.text('1 measure'));
      await tester.pumpAndSettle();
      await tester.tap(find.byType(MeasureTile));
      await tester.pumpAndSettle();
      expect(location(tester, app), Routes.plan);
      final pane = find.byType(GoalPageBody);
      expect(pane, findsOneWidget);
      expect(
        tester.getTopLeft(pane).dx,
        greaterThan(tester.getTopRight(find.byType(MeasureTile)).dx),
      );

      await tester.tap(find.byTooltip('Close'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Get fit').first);
      await tester.pumpAndSettle();
      expect(location(tester, app), Routes.plan);
      expect(find.byType(GoalPageBody), findsOneWidget);
    });

    testApp('at 400 px a project opens as its own page', (tester) async {
      final p = await seed.projects.create(title: 'Thesis');
      final app = await pumpApp(tester, db: db, location: Routes.plan);
      expect(find.text('Select an item to see it here'), findsNothing);
      await tester.tap(find.text('Thesis'));
      await tester.pumpAndSettle();
      expect(location(tester, app), Routes.projectDetail(p.id));
      expect(find.byType(ProjectTile), findsNothing);
    });
  });

  group('Archive', () {
    testApp('an archived goal opens its page and can be restored', (
      tester,
    ) async {
      final o = await seed.goal(title: 'Old goal');
      await seed.goals.update(o.copyWith(status: GoalStatus.archived));
      final app = await pumpApp(tester, db: db, location: Routes.archive);
      await tester.tap(find.text('Old goal'));
      await tester.pumpAndSettle();
      expect(location(tester, app), Routes.goal(o.id));
      await tester.tap(find.byTooltip('Change status'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Active'));
      await tester.pumpAndSettle();
      app.router.pop();
      await tester.pumpAndSettle();
      expect(find.text('Old goal'), findsNothing);
      expect((await seed.goals.get(o.id))!.status, GoalStatus.active);
    });

    testApp('restoring a project to active removes it from the Archive', (
      tester,
    ) async {
      final p = await seed.projects.create(
        title: 'Old project',
        status: ProjectStatus.completed,
      );
      final o = await seed.goal(title: 'Old goal');
      await seed.goals.update(o.copyWith(status: GoalStatus.archived));
      await seed.goal(title: 'Current goal');
      final app = await pumpApp(tester, db: db, location: Routes.archive);

      expect(find.text('Old project'), findsOneWidget);
      expect(find.text('Old goal'), findsOneWidget);
      expect(find.text('Current goal'), findsNothing);

      await tester.tap(find.text('Old project'));
      await tester.pumpAndSettle();
      expect(location(tester, app), Routes.projectDetail(p.id));
      await tester.tap(find.byTooltip('Change status'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Active'));
      await tester.pumpAndSettle();
      app.router.pop();
      await tester.pumpAndSettle();

      expect(find.widgetWithText(AppBar, 'Archive'), findsOneWidget);
      expect(find.text('Old project'), findsNothing);
      expect((await seed.projects.get(p.id))!.status, ProjectStatus.active);
    });
  });
}
