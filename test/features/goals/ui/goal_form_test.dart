import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:orbit/core/db/app_database.dart';
import 'package:orbit/core/widgets/date_field.dart';
import 'package:orbit/features/goals/ui/goal_form.dart';

import '../../../helpers/pump_app.dart';
import '../../../helpers/seed.dart';
import '../../../helpers/test_db.dart';

Future<void> pickDay(WidgetTester tester, String label, String day) async {
  await tester.tap(find.widgetWithText(DateField, label));
  await tester.pumpAndSettle();
  await tester.tap(find.text(day));
  await tester.tap(find.text('OK'));
  await tester.pumpAndSettle();
}

Future<void> save(WidgetTester tester) async {
  await tester.tap(find.text('Save'));
  await tester.pumpAndSettle();
}

void main() {
  testApp('creates an active goal', (tester) async {
    final db = await pumpSheet(tester, (c) => showGoalForm(c));
    await tester.enterText(
      find.widgetWithText(TextFormField, 'Title'),
      'Get fit',
    );
    await pickDay(tester, 'Start date', '1');
    await pickDay(tester, 'End date', '28');
    await save(tester);

    final goals = await db.select(db.goals).get();
    expect(goals.single.title, 'Get fit');
    expect(goals.single.status, GoalStatus.active);
    expect(goals.single.startDate.day, 1);
    expect(goals.single.endDate.day, 28);
  });

  testApp('missing title is not saved', (tester) async {
    final db = await pumpSheet(tester, (c) => showGoalForm(c));
    await pickDay(tester, 'Start date', '1');
    await pickDay(tester, 'End date', '28');
    await save(tester);

    expect(find.text('Enter a title'), findsOneWidget);
    expect(await db.select(db.goals).get(), isEmpty);
  });

  testApp('missing dates are not saved', (tester) async {
    final db = await pumpSheet(tester, (c) => showGoalForm(c));
    await tester.enterText(
      find.widgetWithText(TextFormField, 'Title'),
      'Get fit',
    );
    await save(tester);

    expect(find.text('Pick a start date'), findsOneWidget);
    expect(find.text('Pick an end date'), findsOneWidget);
    expect(await db.select(db.goals).get(), isEmpty);
  });

  testApp('end before start is not saved', (tester) async {
    final db = newTestDatabase();
    final g = await Seed(db).goal();
    await pumpSheet(tester, (c) => showGoalForm(c, goalId: g.id), db: db);
    expect(find.text('01-10-2026'), findsOneWidget);
    expect(find.text('31-12-2026'), findsOneWidget);

    // End date picker opens on December 2026; go back to September.
    await tester.tap(find.widgetWithText(DateField, 'End date'));
    await tester.pumpAndSettle();
    for (var i = 0; i < 3; i++) {
      await tester.tap(find.byTooltip('Previous month'));
      await tester.pumpAndSettle();
    }
    await tester.tap(find.text('15'));
    await tester.tap(find.text('OK'));
    await tester.pumpAndSettle();
    await save(tester);

    expect(
      find.text('The end date must not be before the start date'),
      findsOneWidget,
    );
    final stored = await Seed(db).goals.get(g.id);
    expect(stored!.endDate, CalendarDate(2026, 12, 31));
  });

  testApp('delete confirmation names the number of measures', (tester) async {
    final db = newTestDatabase();
    final seed = Seed(db);
    final g = await seed.goal();
    for (var i = 0; i < 3; i++) {
      await seed.measure(g.id, title: 'Measure $i');
    }
    await pumpSheet(tester, (c) => showGoalForm(c, goalId: g.id), db: db);

    await tester.tap(find.byTooltip('Delete goal'));
    await tester.pumpAndSettle();
    expect(find.textContaining('"Get fit" and its 3 measures'), findsOneWidget);

    await tester.tap(find.widgetWithText(FilledButton, 'Delete'));
    await tester.pumpAndSettle();
    expect(await seed.goals.get(g.id), isNull);
    expect(await seed.goals.countMeasures(g.id), 0);
  });

  testApp('cancelling delete keeps the goal', (tester) async {
    final db = newTestDatabase();
    final seed = Seed(db);
    final g = await seed.goal();
    await pumpSheet(tester, (c) => showGoalForm(c, goalId: g.id), db: db);

    await tester.tap(find.byTooltip('Delete goal'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Cancel'));
    await tester.pumpAndSettle();
    expect(await seed.goals.get(g.id), isNotNull);
  });

  testApp('editing can complete a goal', (tester) async {
    final db = newTestDatabase();
    final seed = Seed(db);
    final g = await seed.goal();
    await pumpSheet(tester, (c) => showGoalForm(c, goalId: g.id), db: db);

    await tester.tap(find.text('Completed'));
    await save(tester);
    expect((await seed.goals.get(g.id))!.status, GoalStatus.completed);
  });

  testApp('picks a planet color, and Auto clears it again', (tester) async {
    final db = newTestDatabase();
    final g = await Seed(db).goal(title: 'Get fit');
    await pumpSheet(
      tester,
      (c) => showGoalForm(c, goalId: g.id),
      db: db,
      height: 1200,
    );
    await tester.tap(find.bySemanticsLabel('Color #FF7A9C'));
    await save(tester);
    expect((await db.select(db.goals).getSingle()).color, '#FF7A9C');

    await pumpSheet(
      tester,
      (c) => showGoalForm(c, goalId: g.id),
      db: db,
      height: 1200,
    );
    await tester.tap(find.bySemanticsLabel('Auto color'));
    await save(tester);
    expect((await db.select(db.goals).getSingle()).color, isNull);
  });
}
