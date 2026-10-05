import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:orbit/core/db/app_database.dart';
import 'package:orbit/core/router/routes.dart';
import 'package:orbit/core/time/today.dart';
import 'package:orbit/features/settings/data/settings_repository.dart';

import '../../../helpers/pump_app.dart';
import '../../../helpers/seed.dart';
import '../../../helpers/test_db.dart';

/// Monday.
final today = CalendarDate(2026, 10, 5);

void main() {
  late AppDatabase db;
  late Seed seed;
  setUp(() {
    db = newTestDatabase();
    seed = Seed(db);
  });

  Future<({AppDatabase db, GoRouter router})> pumpHome(WidgetTester tester) =>
      pumpApp(
        tester,
        db: db,
        height: 1600,
        overrides: [todayProvider.overrideWithValue(today)],
      );

  String path(({AppDatabase db, GoRouter router}) app) =>
      app.router.routeInformationProvider.value.uri.path;

  group('sections', () {
    testApp('in order: habits, deadlines, projects', (tester) async {
      await pumpHome(tester);
      final habits = tester.getTopLeft(find.text('Habits due today')).dy;
      final deadlines = tester.getTopLeft(find.text('Upcoming deadlines')).dy;
      final projects = tester.getTopLeft(find.text('Active projects')).dy;
      expect(habits, lessThan(deadlines));
      expect(deadlines, lessThan(projects));
      expect(find.text('No habits due today'), findsOneWidget);
      expect(find.text('Nothing due in the next 7 days'), findsOneWidget);
      expect(find.text('No active projects'), findsOneWidget);
    });

    testApp('the floating action button opens quick log', (tester) async {
      await seed.projects.create(title: 'Thesis');
      await pumpHome(tester);
      await tester.tap(find.byTooltip('Log work'));
      await tester.pumpAndSettle();
      expect(find.text('Choose a project'), findsOneWidget);
    });
  });

  group('habits', () {
    testApp('a habit is labeled by its project', (tester) async {
      final p = await seed.projects.create(title: 'Marathon');
      await seed.habits.create(
        title: 'Stretch',
        projectId: p.id,
        scheduleType: ScheduleType.daily,
      );
      await pumpHome(tester);

      final tile = tester.widget<CheckboxListTile>(
        find.widgetWithText(CheckboxListTile, 'Stretch'),
      );
      expect(tile.value, isFalse);
      expect((tile.subtitle as Text).data, 'Marathon');
    });

    testApp('checking from Home checks it and logs it', (tester) async {
      await seed.habits.create(
        title: 'Stretch',
        scheduleType: ScheduleType.daily,
      );
      await pumpHome(tester);
      await tester.tap(find.text('Stretch'));
      await tester.pumpAndSettle();

      final tile = tester.widget<CheckboxListTile>(
        find.widgetWithText(CheckboxListTile, 'Stretch'),
      );
      expect(tile.value, isTrue);
      final entries = await (db.select(
        db.logEntries,
      )..where((e) => e.deletedAt.isNull())).get();
      expect(entries.single.source, LogSource.habit);
      final checks = await db.select(db.habitChecks).get();
      expect(checks.single.date, today);
    });

    testApp('habits not due today are not listed', (tester) async {
      await seed.habits.create(
        title: 'Tuesday run',
        scheduleType: ScheduleType.weekdays,
        weekdays: {2},
      );
      await pumpHome(tester);
      expect(find.text('Tuesday run'), findsNothing);
    });
  });

  group('upcoming deadlines', () {
    testApp('overdue items are marked; tapping a task opens its project', (
      tester,
    ) async {
      final p = await seed.projects.create(title: 'Thesis');
      await seed.tasks.create(
        projectId: p.id,
        title: 'Submit form',
        dueDate: CalendarDate(2026, 10, 3),
      );
      final app = await pumpHome(tester);

      final tile = find.widgetWithText(ListTile, 'Submit form');
      expect(
        find.descendant(of: tile, matching: find.text('Overdue')),
        findsOneWidget,
      );
      expect(
        find.descendant(
          of: tile,
          matching: find.text('Task · Thesis · Due 03-10-2026'),
        ),
        findsOneWidget,
      );

      await tester.tap(tile);
      await tester.pumpAndSettle();
      expect(path(app), Routes.projectDetail(p.id));
    });
  });

  group('lead time', () {
    testApp('a shorter lead time from Settings hides later deadlines', (
      tester,
    ) async {
      await SettingsRepository(db).setDeadlineLeadDays(3);
      final p = await seed.projects.create(title: 'Thesis');
      await seed.tasks.create(
        projectId: p.id,
        title: 'Submit form',
        dueDate: CalendarDate(2026, 10, 9),
      );
      await pumpHome(tester);

      expect(find.text('Submit form'), findsNothing);
      expect(find.text('Nothing due in the next 3 days'), findsOneWidget);
    });
  });

  group('project cards', () {
    testApp('badges and next step', (tester) async {
      await seed.projects.create(
        title: 'Soon',
        deadline: CalendarDate(2026, 10, 8),
        nextStep: 'Draft outline',
      );
      await seed.projects.create(
        title: 'Later',
        deadline: CalendarDate(2026, 12, 31),
      );
      await pumpHome(tester);

      Finder inCard(String project, String text) => find.descendant(
        of: find.widgetWithText(Card, project),
        matching: find.text(text),
      );
      expect(inCard('Soon', 'Due in 3 days'), findsOneWidget);
      expect(inCard('Soon', 'Draft outline'), findsOneWidget);
      expect(inCard('Later', 'Due 31-12-2026'), findsOneWidget);
      expect(inCard('Later', 'No next step'), findsOneWidget);
    });

    testApp('completing the next step from Home with skip', (tester) async {
      await seed.projects.create(title: 'Thesis', nextStep: 'Draft outline');
      await pumpHome(tester);
      await tester.tap(find.text('Draft outline'));
      await tester.pumpAndSettle();
      expect(find.text("What's the next step?"), findsOneWidget);
      await tester.tap(find.text('Skip'));
      await tester.pumpAndSettle();

      expect(
        find.descendant(
          of: find.widgetWithText(Card, 'Thesis'),
          matching: find.text('No next step'),
        ),
        findsOneWidget,
      );
      expect(find.text('Task completed'), findsOneWidget);
    });

    testApp('tapping the card opens the project detail', (tester) async {
      final p = await seed.projects.create(title: 'Thesis');
      final app = await pumpHome(tester);
      await tester.tap(find.text('Thesis'));
      await tester.pumpAndSettle();
      expect(path(app), Routes.projectDetail(p.id));
    });
  });
}
