import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:orbit/core/db/app_database.dart';
import 'package:orbit/features/key_results/ui/key_result_form.dart';

import '../../../helpers/pump_app.dart';
import '../../../helpers/seed.dart';
import '../../../helpers/test_db.dart';

Finder field(String label) => find.widgetWithText(TextFormField, label);

Future<void> save(WidgetTester tester) async {
  await tester.tap(find.text('Save'));
  await tester.pumpAndSettle();
}

void main() {
  late AppDatabase db;
  late Seed seed;
  late Objective objective;

  Future<void> openNew(WidgetTester tester) async {
    db = newTestDatabase();
    seed = Seed(db);
    objective = await seed.objective();
    await pumpSheet(
      tester,
      (c) => showKeyResultForm(c, objectiveId: objective.id),
      db: db,
    );
  }

  // One-shot query: drift streams need timers that widget tests don't run.
  Future<List<KeyResult>> stored() =>
      (db.select(db.keyResults)..where((k) => k.deletedAt.isNull())).get();

  testApp('numeric shows start, target, current and unit', (tester) async {
    await openNew(tester);
    expect(field('Start value'), findsOneWidget);
    expect(field('Target value'), findsOneWidget);
    expect(field('Current value'), findsOneWidget);
    expect(field('Unit (optional)'), findsOneWidget);
    expect(field('Step'), findsOneWidget);
    expect(find.text('Achieved'), findsNothing);
  });

  testApp('boolean shows only the achieved switch', (tester) async {
    await openNew(tester);
    await tester.tap(find.text('Yes/no'));
    await tester.pumpAndSettle();
    expect(find.widgetWithText(SwitchListTile, 'Achieved'), findsOneWidget);
    expect(field('Start value'), findsNothing);
    expect(field('Target value'), findsNothing);
    expect(field('Current value'), findsNothing);
  });

  testApp('habit shows a habit picker and target check-ins', (tester) async {
    await openNew(tester);
    await tester.tap(find.text('Habit'));
    await tester.pumpAndSettle();
    expect(find.text('Habit (optional)'), findsOneWidget);
    expect(field('Target check-ins'), findsOneWidget);
    expect(field('Start value'), findsNothing);
  });

  testApp('numeric KR without target is not saved', (tester) async {
    await openNew(tester);
    await tester.enterText(field('Title'), 'Run 100 km');
    await tester.enterText(field('Current value'), '20');
    await tester.enterText(field('Target value'), '');
    await save(tester);
    expect(find.text('Enter a number'), findsOneWidget);
    expect(await stored(), isEmpty);
  });

  testApp('missing title is not saved', (tester) async {
    await openNew(tester);
    await tester.enterText(field('Target value'), '100');
    await save(tester);
    expect(find.text('Enter a title'), findsOneWidget);
    expect(await stored(), isEmpty);
  });

  testApp('creates a numeric KR (comma decimals accepted)', (tester) async {
    await openNew(tester);
    await tester.enterText(field('Title'), 'Run 100 km');
    await tester.enterText(field('Target value'), '100');
    await tester.enterText(field('Current value'), '12,5');
    await tester.enterText(field('Unit (optional)'), 'km');
    await save(tester);

    final kr = (await stored()).single;
    expect(kr.objectiveId, objective.id);
    expect(kr.measureType, MeasureType.numeric);
    expect([kr.startValue, kr.targetValue, kr.currentValue], [0, 100, 12.5]);
    expect(kr.unit, 'km');
    expect(kr.step, 1);
  });

  testApp('a custom step is saved', (tester) async {
    await openNew(tester);
    await tester.enterText(field('Title'), 'Run 100 km');
    await tester.enterText(field('Target value'), '100');
    await tester.enterText(field('Step'), '2,5');
    await save(tester);
    expect((await stored()).single.step, 2.5);
  });

  testApp('a step of 0 is not saved', (tester) async {
    await openNew(tester);
    await tester.enterText(field('Title'), 'Run 100 km');
    await tester.enterText(field('Target value'), '100');
    await tester.enterText(field('Step'), '0');
    await save(tester);
    expect(find.text('Enter a number above 0'), findsOneWidget);
    expect(await stored(), isEmpty);
  });

  testApp('creates an achieved boolean KR', (tester) async {
    await openNew(tester);
    await tester.enterText(field('Title'), 'Sign up for a race');
    await tester.tap(find.text('Yes/no'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Achieved'));
    await save(tester);

    final kr = (await stored()).single;
    expect(kr.measureType, MeasureType.boolean);
    expect(kr.currentValue, 1);
  });

  testApp('creates a habit KR linked to a habit', (tester) async {
    db = newTestDatabase();
    seed = Seed(db);
    objective = await seed.objective();
    final habit = await seed.habits.create(
      title: 'Stretch',
      scheduleType: ScheduleType.daily,
    );
    await pumpSheet(
      tester,
      (c) => showKeyResultForm(c, objectiveId: objective.id),
      db: db,
    );

    await tester.enterText(field('Title'), 'Stretch 40 times');
    await tester.tap(find.text('Habit'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('No habit'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Stretch').last);
    await tester.pumpAndSettle();
    await tester.enterText(field('Target check-ins'), '0');
    await save(tester);
    expect(find.text('Enter a whole number of at least 1'), findsOneWidget);

    await tester.enterText(field('Target check-ins'), '40');
    await save(tester);
    final kr = (await stored()).single;
    expect(kr.measureType, MeasureType.habit);
    expect(kr.habitId, habit.id);
    expect(kr.targetValue, 40);
  });

  testApp('editing updates the current value', (tester) async {
    db = newTestDatabase();
    seed = Seed(db);
    objective = await seed.objective();
    final kr = await seed.kr(objective.id, current: 20);
    await pumpSheet(
      tester,
      (c) => showKeyResultForm(c, keyResultId: kr.id),
      db: db,
    );

    expect(find.text('Get fit'), findsOneWidget);
    expect(find.textContaining('31-12-2026'), findsOneWidget);
    await tester.enterText(field('Current value'), '50');
    await save(tester);
    expect((await seed.keyResults.get(kr.id))!.currentValue, 50);
  });

  testApp('delete asks for confirmation and removes the KR', (tester) async {
    db = newTestDatabase();
    seed = Seed(db);
    objective = await seed.objective();
    final kr = await seed.kr(objective.id);
    await pumpSheet(
      tester,
      (c) => showKeyResultForm(c, keyResultId: kr.id),
      db: db,
    );

    await tester.tap(find.byTooltip('Delete key result'));
    await tester.pumpAndSettle();
    expect(
      find.textContaining('keep existing without the link'),
      findsOneWidget,
    );
    await tester.tap(find.widgetWithText(FilledButton, 'Delete'));
    await tester.pumpAndSettle();
    expect(await seed.keyResults.get(kr.id), isNull);
  });
}
