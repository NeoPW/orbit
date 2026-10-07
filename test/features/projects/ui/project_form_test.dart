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

  testApp('defaults: active, importance 3, no area, no KR', (tester) async {
    await pumpSheet(tester, (c) => showProjectForm(c), db: db);
    expect(find.text('No area'), findsOneWidget);
    expect(find.text('No key result'), findsOneWidget);
    expect(find.textContaining('deadline:'), findsNothing);

    await tester.enterText(field('Title'), 'Thesis');
    await save(tester);
    final p = (await projects()).single;
    expect(p.status, ProjectStatus.active);
    expect(p.importance, 3);
    expect(p.areaId, isNull);
    expect(p.keyResultId, isNull);
    expect(p.nextStepTaskId, isNull);
  });

  testApp('creates a project with area, KR, importance, status and next step', (
    tester,
  ) async {
    final o = await seed.objective();
    final kr = await seed.kr(o.id);
    await pumpSheet(tester, (c) => showProjectForm(c), db: db);

    await tester.enterText(field('Title'), 'Thesis');
    await tester.enterText(field('Next step (optional)'), 'Draft outline');
    await choose(tester, 'No area', 'Uni');
    await choose(tester, 'No key result', 'Get fit › Run 100 km');
    await tester.tap(find.text('5'));
    await tester.tap(find.text('Backlog'));
    await tester.pump();
    await save(tester);

    final p = (await projects()).single;
    expect(p.keyResultId, kr.id);
    expect(p.importance, 5);
    expect(p.status, ProjectStatus.backlog);
    final area = await (db.select(
      db.areas,
    )..where((a) => a.id.equals(p.areaId!))).getSingle();
    expect(area.name, 'Uni');
    expect((await seed.projects.nextStep(p))!.title, 'Draft outline');
  });

  testApp('shows the inherited effective deadline', (tester) async {
    final o = await seed.objective(end: CalendarDate(2026, 12, 31));
    final kr = await seed.kr(o.id);
    final p = await seed.projects.create(title: 'Thesis', keyResultId: kr.id);
    await pumpSheet(tester, (c) => showProjectForm(c, projectId: p.id), db: db);

    expect(
      find.text("Uses the key result's deadline: 31-12-2026"),
      findsOneWidget,
    );
  });

  testApp('KR picker offers only KRs of active objectives', (tester) async {
    final active = await seed.objective(title: 'Active goal');
    final done = await seed.objective(title: 'Old goal');
    await seed.kr(active.id, title: 'Current KR');
    await seed.kr(done.id, title: 'Old KR');
    await seed.objectives.update(
      done.copyWith(status: ObjectiveStatus.completed),
    );

    await pumpSheet(tester, (c) => showProjectForm(c), db: db);
    await tester.tap(find.text('No key result'));
    await tester.pumpAndSettle();
    expect(find.text('Active goal › Current KR'), findsWidgets);
    expect(find.text('Old goal › Old KR'), findsNothing);
    await tester.tap(find.text('No key result').last);
    await tester.pumpAndSettle();
  });

  testApp('editing keeps an existing link to a KR of a completed objective', (
    tester,
  ) async {
    final done = await seed.objective(title: 'Old goal');
    final oldKr = await seed.kr(done.id, title: 'Old KR');
    await seed.objectives.update(
      done.copyWith(status: ObjectiveStatus.completed),
    );
    final p = await seed.projects.create(
      title: 'Thesis',
      keyResultId: oldKr.id,
    );

    await pumpSheet(tester, (c) => showProjectForm(c, projectId: p.id), db: db);
    expect(find.text('Old goal › Old KR'), findsOneWidget);
    await save(tester);
    expect((await seed.projects.get(p.id))!.keyResultId, oldKr.id);
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
