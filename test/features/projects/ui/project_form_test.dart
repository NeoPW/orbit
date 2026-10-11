import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:orbit/core/db/app_database.dart';
import 'package:orbit/features/projects/ui/project_form.dart';

import '../../../helpers/pump_app.dart';
import '../../../helpers/seed.dart';
import '../../../helpers/test_db.dart';

Finder field(String label) => find.widgetWithText(TextFormField, label);

Future<void> save(WidgetTester tester) async {
  await tester.tap(find.text('Save'));
  await tester.pumpAndSettle();
}

Future<void> choose(WidgetTester tester, String current, String option) async {
  await tester.tap(find.text(current));
  await tester.pumpAndSettle();
  await tester.tap(find.text(option).last);
  await tester.pumpAndSettle();
}

void main() {
  late AppDatabase db;
  late Seed seed;

  setUp(() {
    db = newTestDatabase();
    seed = Seed(db);
  });

  Future<List<Project>> projects() =>
      (db.select(db.projects)..where((p) => p.deletedAt.isNull())).get();

  testApp('missing title is not saved', (tester) async {
    await pumpSheet(tester, (c) => showProjectForm(c), db: db);
    await save(tester);
    expect(find.text('Enter a title'), findsOneWidget);
    expect(await projects(), isEmpty);
  });

  testApp('defaults: active, importance 3, no area, no goal', (tester) async {
    await pumpSheet(tester, (c) => showProjectForm(c), db: db);
    expect(find.text('No area'), findsOneWidget);
    expect(find.text('No goal'), findsOneWidget);
    expect(find.textContaining('end date:'), findsNothing);

    await tester.enterText(field('Title'), 'Thesis');
    await save(tester);
    final p = (await projects()).single;
    expect(p.status, ProjectStatus.active);
    expect(p.importance, 3);
    expect(p.areaId, isNull);
    expect(p.goalId, isNull);
    expect(p.nextStepTaskId, isNull);
    expect(p.completedAt, isNull);
  });

  testApp(
    'creates a project with area, goal, importance, status and next step',
    (tester) async {
      final g = await seed.goal();
      await pumpSheet(tester, (c) => showProjectForm(c), db: db);

      await tester.enterText(field('Title'), 'Thesis');
      await tester.enterText(field('Next step (optional)'), 'Draft outline');
      await choose(tester, 'No area', 'Uni');
      await choose(tester, 'No goal', 'Get fit');
      await tester.tap(find.text('5'));
      await tester.tap(find.text('Backlog'));
      await tester.pump();
      await save(tester);

      final p = (await projects()).single;
      expect(p.goalId, g.id);
      expect(p.importance, 5);
      expect(p.status, ProjectStatus.backlog);
      final area = await (db.select(
        db.areas,
      )..where((a) => a.id.equals(p.areaId!))).getSingle();
      expect(area.name, 'Uni');
      expect((await seed.projects.nextStep(p))!.title, 'Draft outline');
    },
  );

  testApp('a project for a goal starts with that goal', (tester) async {
    final g = await seed.goal(title: 'Get fit');
    await pumpSheet(tester, (c) => showProjectForm(c, goalId: g.id), db: db);
    await tester.enterText(field('Title'), 'Swim course');
    await save(tester);
    expect((await projects()).single.goalId, g.id);
  });

  testApp('shows the end date of the goal as inherited deadline', (
    tester,
  ) async {
    final g = await seed.goal(end: CalendarDate(2026, 12, 31));
    final p = await seed.projects.create(title: 'Thesis', goalId: g.id);
    await pumpSheet(tester, (c) => showProjectForm(c, projectId: p.id), db: db);

    expect(find.text("Uses the goal's end date: 31-12-2026"), findsOneWidget);
  });

  testApp('the goal picker offers only active goals', (tester) async {
    await seed.goal(title: 'Active goal');
    final done = await seed.goal(title: 'Old goal');
    await seed.goals.update(done.copyWith(status: GoalStatus.completed));

    await pumpSheet(tester, (c) => showProjectForm(c), db: db);
    await tester.tap(find.text('No goal'));
    await tester.pumpAndSettle();
    expect(find.text('Active goal'), findsWidgets);
    expect(find.text('Old goal'), findsNothing);
    await tester.tap(find.text('No goal').last);
    await tester.pumpAndSettle();
  });

  testApp('editing keeps a goal that is no longer active', (tester) async {
    final done = await seed.goal(title: 'Old goal');
    await seed.goals.update(done.copyWith(status: GoalStatus.completed));
    final p = await seed.projects.create(title: 'Thesis', goalId: done.id);

    await pumpSheet(tester, (c) => showProjectForm(c, projectId: p.id), db: db);
    expect(find.text('Old goal'), findsOneWidget);
    await save(tester);
    expect((await seed.projects.get(p.id))!.goalId, done.id);
  });

  testApp('editing renames the next step', (tester) async {
    final p = await seed.projects.create(title: 'Thesis', nextStep: 'Draft');
    await pumpSheet(tester, (c) => showProjectForm(c, projectId: p.id), db: db);
    expect(find.text('Draft'), findsOneWidget);

    await tester.enterText(field('Next step (optional)'), 'Write intro');
    await save(tester);
    final stored = await seed.projects.get(p.id);
    expect(stored!.nextStepTaskId, p.nextStepTaskId);
    expect((await seed.projects.nextStep(stored))!.title, 'Write intro');
  });

  testApp('delete asks for confirmation', (tester) async {
    final p = await seed.projects.create(title: 'Thesis');
    await pumpSheet(tester, (c) => showProjectForm(c, projectId: p.id), db: db);

    await tester.tap(find.byTooltip('Delete project'));
    await tester.pumpAndSettle();
    expect(find.textContaining('"Thesis" and its tasks'), findsOneWidget);
    await tester.tap(find.widgetWithText(FilledButton, 'Delete'));
    await tester.pumpAndSettle();
    expect(await seed.projects.get(p.id), isNull);
  });
}
