import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:orbit/core/db/app_database.dart';
import 'package:orbit/core/router/routes.dart';
import 'package:orbit/core/space/planets.dart';
import 'package:orbit/core/time/today.dart';
import 'package:orbit/core/widgets/orbit_chips.dart';
import 'package:orbit/features/goals/ui/measure_row.dart';
import 'package:orbit/features/projects/ui/project_detail_screen.dart';
import 'package:orbit/features/tasks/domain/task_assignment.dart';

import '../../../helpers/pump_app.dart';
import '../../../helpers/seed.dart';
import '../../../helpers/test_db.dart';

final today = CalendarDate(2026, 10, 7);

/// The goal page (goals spec).
void main() {
  late AppDatabase db;
  late Seed seed;

  setUp(() {
    db = newTestDatabase();
    seed = Seed(db);
  });

  Future<({AppDatabase db, GoRouter router})> openPage(
    WidgetTester tester,
    String id,
  ) => pumpApp(
    tester,
    db: db,
    location: Routes.goal(id),
    height: 1800,
    overrides: [todayProvider.overrideWithValue(today)],
  );

  testApp('shows dates, progress, measures and the planet', (tester) async {
    final g = await seed.goal();
    await seed.measure(g.id, title: 'Run 100 km', current: 40);
    await seed.measure(g.id, title: 'Swim 10 km', current: 80);
    await openPage(tester, g.id);

    expect(find.text('Get fit'), findsOneWidget);
    expect(find.text('01-10-2026 – 31-12-2026'), findsOneWidget);
    expect(find.text('60 %'), findsOneWidget);
    expect(find.byType(MeasureRow), findsNWidgets(2));
    expect(find.byType(GoalPlanet), findsOneWidget);
    expect(find.text('Edit goal'), findsNothing);
  });

  testApp('a goal without measures shows no percentage', (tester) async {
    final g = await seed.goal();
    await openPage(tester, g.id);
    expect(find.textContaining('%'), findsNothing);
    expect(find.text('No measures yet'), findsOneWidget);
  });

  group('projects', () {
    testApp('active first, then paused with chip; completed counted', (
      tester,
    ) async {
      final g = await seed.goal();
      await seed.projects.create(
        title: 'Gym routine',
        goalId: g.id,
        status: ProjectStatus.paused,
      );
      await seed.projects.create(title: 'Marathon plan', goalId: g.id);
      for (final title in ['Old 1', 'Old 2']) {
        await seed.projects.create(
          title: title,
          goalId: g.id,
          status: ProjectStatus.completed,
        );
      }
      await openPage(tester, g.id);

      final marathon = tester.getTopLeft(find.text('Marathon plan')).dy;
      final gym = tester.getTopLeft(find.text('Gym routine')).dy;
      expect(marathon, lessThan(gym));
      expect(find.widgetWithText(StatusChip<void>, 'Paused'), findsOneWidget);
      expect(find.text('2 completed'), findsOneWidget);
      expect(find.text('Old 1'), findsNothing);
    });

    testApp('tapping a project opens its detail', (tester) async {
      final g = await seed.goal();
      await seed.projects.create(title: 'Marathon plan', goalId: g.id);
      await openPage(tester, g.id);
      await tester.tap(find.text('Marathon plan'));
      await tester.pumpAndSettle();
      expect(find.byType(ProjectDetailBody), findsOneWidget);
    });

    testApp('Add project creates a project for this goal', (tester) async {
      final g = await seed.goal();
      await openPage(tester, g.id);
      await tester.tap(find.text('Add project'));
      await tester.pumpAndSettle();
      await tester.enterText(
        find.widgetWithText(TextFormField, 'Title'),
        'Swim course',
      );
      await tester.tap(find.text('Save'));
      await tester.pumpAndSettle();
      final project = await (db.select(
        db.projects,
      )..where((p) => p.title.equals('Swim course'))).getSingle();
      expect(project.goalId, g.id);
      expect(find.text('Swim course'), findsOneWidget);
    });
  });

  testApp('lists its tasks and habits', (tester) async {
    final g = await seed.goal();
    await seed.tasks.create(title: 'Book physio', assignment: ForGoal(g.id));
    await seed.habits.create(
      title: 'Stretch',
      goalId: g.id,
      scheduleType: ScheduleType.daily,
    );
    await openPage(tester, g.id);
    expect(find.text('Book physio'), findsOneWidget);
    expect(find.text('Stretch'), findsOneWidget);
  });

  testApp('work: this week, in total and the latest entries', (tester) async {
    final g = await seed.goal();
    final p = await seed.projects.create(title: 'Marathon plan', goalId: g.id);
    final now = DateTime.now();
    await seed.logs.createManual(
      projectId: p.id,
      durationMinutes: 30,
      note: 'Long run',
    );
    await seed.logs.createManual(goalId: g.id, note: 'Planning');
    await (db.update(
      db.logEntries,
    )..where((e) => e.note.equals('Planning'))).write(
      LogEntriesCompanion(
        occurredAt: Value(now.subtract(const Duration(days: 60))),
      ),
    );
    await pumpApp(tester, db: db, location: Routes.goal(g.id), height: 1800);
    expect(
      find.textContaining('This week  1 entry · 30 min', findRichText: true),
      findsOneWidget,
    );
    expect(
      find.textContaining('Total  2 entries · 30 min', findRichText: true),
      findsOneWidget,
    );
    expect(find.text('Long run'), findsOneWidget);
    expect(find.text('Planning'), findsOneWidget);
  });

  testApp('completing from the status chip moves it to the Archive', (
    tester,
  ) async {
    final g = await seed.goal();
    final app = await openPage(tester, g.id);
    await tester.tap(find.byTooltip('Change status'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Completed'));
    await tester.pumpAndSettle();
    expect((await seed.goals.get(g.id))!.status, GoalStatus.completed);

    app.router.go(Routes.archive);
    await tester.pumpAndSettle();
    expect(find.text('Get fit'), findsOneWidget);
  });

  testApp('a deleted goal is not found', (tester) async {
    final g = await seed.goal();
    await seed.goals.delete(g.id);
    await openPage(tester, g.id);
    expect(find.text('Goal not found'), findsOneWidget);
  });

  testApp('the page updates live when a measure changes', (tester) async {
    final g = await seed.goal();
    final m = await seed.measure(g.id, current: 40);
    await openPage(tester, g.id);
    expect(find.text('40 %'), findsOneWidget);
    await seed.measures.setProgressValue(m.id, 70);
    await tester.pumpAndSettle();
    expect(find.text('70 %'), findsOneWidget);
  });

  testApp('Delete from the top bar asks first', (tester) async {
    final g = await seed.goal();
    await seed.measure(g.id);
    await openPage(tester, g.id);
    await tester.tap(find.byTooltip('Delete goal'));
    await tester.pumpAndSettle();
    expect(find.textContaining('"Get fit" and its 1 measure'), findsOneWidget);
    await tester.tap(find.widgetWithText(FilledButton, 'Delete'));
    await tester.pumpAndSettle();
    expect(await seed.goals.get(g.id), isNull);
  });
}
