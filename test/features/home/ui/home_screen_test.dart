import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:orbit/core/db/app_database.dart';
import 'package:orbit/core/router/routes.dart';
import 'package:orbit/core/time/today.dart';
import 'package:orbit/features/home/ui/home_habits_section.dart';
import 'package:orbit/features/settings/data/settings_repository.dart';
import 'package:orbit/features/tasks/domain/task_assignment.dart';

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
    testApp('in order: header, habits, deadlines, projects, tasks', (
      tester,
    ) async {
      await pumpHome(tester);
      final header = tester.getTopLeft(find.text('Monday')).dy;
      final habits = tester.getTopLeft(find.text('Habits due today')).dy;
      final deadlines = tester.getTopLeft(find.text('Upcoming deadlines')).dy;
      final projects = tester.getTopLeft(find.text('Active projects')).dy;
      final tasks = tester.getTopLeft(find.text('Tasks')).dy;
      expect(header, lessThan(habits));
      expect(habits, lessThan(deadlines));
      expect(deadlines, lessThan(projects));
      expect(projects, lessThan(tasks));
      expect(find.text('No open tasks outside projects'), findsOneWidget);
      expect(find.text('No habits due today'), findsOneWidget);
      expect(find.text('Nothing due in the next 7 days'), findsOneWidget);
      expect(find.text('No active projects'), findsOneWidget);
    });

    testApp('a new-task button on the left, quick log on the right', (
      tester,
    ) async {
      await pumpHome(tester);
      final task = tester.getCenter(find.byTooltip('New task'));
      final log = tester.getCenter(find.byTooltip('Log work'));
      expect(task.dx, lessThan(log.dx));
      await tester.tap(find.byTooltip('New task'));
      await tester.pumpAndSettle();
      expect(find.text('New task'), findsWidgets);
      expect(find.widgetWithText(TextField, 'Title'), findsOneWidget);
    });

    testApp('the header shows the habit ring and tasks due', (tester) async {
      final habit = await seed.habits.create(
        title: 'Stretch',
        scheduleType: ScheduleType.daily,
      );
      await seed.habits.create(title: 'Read', scheduleType: ScheduleType.daily);
      await seed.habitChecks.check(habit, today);
      await seed.tasks.create(title: 'Pay rent', dueDate: today);
      await pumpHome(tester);
      expect(find.text('1/2'), findsOneWidget);
      expect(find.text('1 task due'), findsOneWidget);
    });

    testApp('the floating action button opens quick log', (tester) async {
      await seed.projects.create(title: 'Thesis');
      await pumpHome(tester);
      await tester.tap(find.byTooltip('Log work'));
      await tester.pumpAndSettle();
      expect(find.text('Choose what you worked on'), findsOneWidget);
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

      final chip = find.widgetWithText(HabitChip, 'Stretch');
      expect(tester.widget<HabitChip>(chip).item.checkedToday, isFalse);
      expect(
        find.descendant(of: chip, matching: find.text('Marathon')),
        findsOneWidget,
      );
    });

    testApp('checking from Home checks it and logs it', (tester) async {
      await seed.habits.create(
        title: 'Stretch',
        scheduleType: ScheduleType.daily,
      );
      await pumpHome(tester);
      await tester.tap(find.text('Stretch'));
      await tester.pumpAndSettle();

      final chip = tester.widget<HabitChip>(
        find.widgetWithText(HabitChip, 'Stretch'),
      );
      expect(chip.item.checkedToday, isTrue);
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
    testApp('overdue items are marked; tapping a task opens its page', (
      tester,
    ) async {
      final p = await seed.projects.create(title: 'Thesis');
      final task = await seed.tasks.create(
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
        find.descendant(of: tile, matching: find.text('Task · Thesis')),
        findsOneWidget,
      );

      await tester.tap(tile);
      await tester.pumpAndSettle();
      expect(path(app), Routes.task(task.id));
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

  group('tasks', () {
    testApp('tasks outside projects by deadline; tap opens the page', (
      tester,
    ) async {
      final p = await seed.projects.create(title: 'Thesis');
      await seed.tasks.create(projectId: p.id, title: 'Project task');
      await seed.tasks.create(title: 'A');
      await seed.tasks.create(title: 'B', dueDate: today.addDays(1));
      final o = await seed.objective();
      final kr = await seed.kr(o.id, title: 'Run 100 km');
      final c = await seed.tasks.create(
        title: 'C',
        dueDate: today.addDays(-2),
        assignment: ForKeyResult(kr.id),
      );
      final app = await pumpHome(tester);

      final ys = [
        for (final title in ['C', 'B', 'A'])
          tester.getTopLeft(find.widgetWithText(Card, title)).dy,
      ];
      expect(ys, [...ys]..sort());
      expect(find.widgetWithText(Card, 'Project task'), findsNothing);
      expect(
        find.descendant(
          of: find.widgetWithText(Card, 'C'),
          matching: find.text('Run 100 km'),
        ),
        findsOneWidget,
      );

      await tester.tap(find.text('C'));
      await tester.pumpAndSettle();
      expect(path(app), Routes.task(c.id));
    });

    testApp('ticking a task completes it', (tester) async {
      final task = await seed.tasks.create(title: 'Tax return');
      await pumpHome(tester);
      await tester.tap(find.bySemanticsLabel('Complete Tax return'));
      await tester.pumpAndSettle();
      expect(find.text('Task completed'), findsOneWidget);
      final stored = await (db.select(
        db.tasks,
      )..where((t) => t.id.equals(task.id))).getSingle();
      expect(stored.status, TaskStatus.done);
    });

    testApp('a project with a deadline is not repeated under deadlines', (
      tester,
    ) async {
      await seed.projects.create(title: 'Garden', deadline: today.addDays(1));
      await pumpHome(tester);
      expect(find.text('Garden'), findsOneWidget);
      expect(find.text('Due tomorrow'), findsOneWidget);
      expect(find.text('Nothing due in the next 7 days'), findsOneWidget);
    });
  });
}
