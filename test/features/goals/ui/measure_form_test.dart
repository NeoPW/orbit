import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:orbit/core/db/app_database.dart';
import 'package:orbit/features/goals/ui/measure_form.dart';

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
  late Goal goal;

  Future<void> openNew(WidgetTester tester) async {
    db = newTestDatabase();
    seed = Seed(db);
    goal = await seed.goal();
    await pumpSheet(tester, (c) => showMeasureForm(c, goalId: goal.id), db: db);
  }

  // One-shot query: drift streams need timers that widget tests don't run.
  Future<List<Measure>> stored() =>
      (db.select(db.measures)..where((m) => m.deletedAt.isNull())).get();

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

  testApp('numeric measure without target is not saved', (tester) async {
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

  testApp('creates a numeric measure (comma decimals accepted)', (
    tester,
  ) async {
    await openNew(tester);
    await tester.enterText(field('Title'), 'Run 100 km');
    await tester.enterText(field('Target value'), '100');
    await tester.enterText(field('Current value'), '12,5');
    await tester.enterText(field('Unit (optional)'), 'km');
    await save(tester);

    final measure = (await stored()).single;
    expect(measure.goalId, goal.id);
    expect(measure.measureType, MeasureType.numeric);
    expect(
      [measure.startValue, measure.targetValue, measure.currentValue],
      [0, 100, 12.5],
    );
    expect(measure.unit, 'km');
    expect(measure.step, 1);
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

  testApp('creates an achieved boolean measure', (tester) async {
    await openNew(tester);
    await tester.enterText(field('Title'), 'Sign up for a race');
    await tester.tap(find.text('Yes/no'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Achieved'));
    await save(tester);

    final measure = (await stored()).single;
    expect(measure.measureType, MeasureType.boolean);
    expect(measure.currentValue, 1);
  });

  testApp('creates a habit measure linked to a habit', (tester) async {
    db = newTestDatabase();
    seed = Seed(db);
    goal = await seed.goal();
    final habit = await seed.habits.create(
      title: 'Stretch',
      scheduleType: ScheduleType.daily,
    );
    await pumpSheet(tester, (c) => showMeasureForm(c, goalId: goal.id), db: db);

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
    final measure = (await stored()).single;
    expect(measure.measureType, MeasureType.habit);
    expect(measure.habitId, habit.id);
    expect(measure.targetValue, 40);
  });

  testApp('editing updates the current value', (tester) async {
    db = newTestDatabase();
    seed = Seed(db);
    goal = await seed.goal();
    final measure = await seed.measure(goal.id, current: 20);
    await pumpSheet(
      tester,
      (c) => showMeasureForm(c, goalId: goal.id, measureId: measure.id),
      db: db,
    );

    expect(find.text('Get fit'), findsOneWidget);
    await tester.enterText(field('Current value'), '50');
    await save(tester);
    expect((await seed.measures.get(measure.id))!.currentValue, 50);
  });

  testApp('delete asks for confirmation and removes the measure', (
    tester,
  ) async {
    db = newTestDatabase();
    seed = Seed(db);
    goal = await seed.goal();
    final measure = await seed.measure(goal.id);
    await pumpSheet(
      tester,
      (c) => showMeasureForm(c, goalId: goal.id, measureId: measure.id),
      db: db,
    );

    await tester.tap(find.byTooltip('Delete measure'));
    await tester.pumpAndSettle();
    expect(find.textContaining('from "Get fit"'), findsOneWidget);
    await tester.tap(find.widgetWithText(FilledButton, 'Delete'));
    await tester.pumpAndSettle();
    expect(await seed.measures.get(measure.id), isNull);
  });
}
