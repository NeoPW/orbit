import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:orbit/core/db/app_database.dart';
import 'package:orbit/core/router/routes.dart';
import 'package:orbit/core/space/space_colors.dart';
import 'package:orbit/core/time/today.dart';
import 'package:orbit/features/goals/ui/measure_tile.dart';

import '../../../helpers/pump_app.dart';
import '../../../helpers/seed.dart';
import '../../../helpers/test_db.dart';

final today = CalendarDate(2026, 10, 7);

/// Measures on the goal page (measures spec, "Record progress on the goal
/// page").
void main() {
  late AppDatabase db;
  late Seed seed;
  late Goal goal;

  setUp(() async {
    db = newTestDatabase();
    seed = Seed(db);
    goal = await seed.goal(color: '#FF7A9C');
  });

  Future<void> openPage(WidgetTester tester) => pumpApp(
    tester,
    db: db,
    location: Routes.goal(goal.id),
    height: 1400,
    overrides: [todayProvider.overrideWithValue(today)],
  );

  MeasureBar ring(WidgetTester tester) =>
      tester.widget<MeasureBar>(find.byType(MeasureBar).first);

  Future<Measure> stored(String id) async => (await seed.measures.get(id))!;

  testApp('a measure shows its ring in the goal color and its value', (
    tester,
  ) async {
    await seed.measure(goal.id, current: 40);
    await openPage(tester);
    expect(find.text('Run 100 km'), findsOneWidget);
    expect(find.text('40 / 100 km'), findsOneWidget);
    expect(ring(tester).progress, 0.4);
    expect(ring(tester).color, colorOfGoal(goal));
  });

  testApp('+ raises the value by the step', (tester) async {
    final m = await seed.measure(goal.id, current: 40, step: 5);
    await openPage(tester);
    await tester.tap(find.byTooltip('Increase Run 100 km by 5'));
    await tester.pumpAndSettle();
    expect((await stored(m.id)).currentValue, 45);
    expect(ring(tester).progress, 0.45);
    expect(find.text('45%'), findsOneWidget);
  });

  testApp('− lowers the value by the step', (tester) async {
    final m = await seed.measure(goal.id, current: 40);
    await openPage(tester);
    await tester.tap(find.byTooltip('Decrease Run 100 km by 1'));
    await tester.pumpAndSettle();
    expect((await stored(m.id)).currentValue, 39);
  });

  testApp('the value can be entered directly', (tester) async {
    final m = await seed.measure(goal.id, current: 40);
    await openPage(tester);
    await tester.tap(find.text('40 / 100 km'));
    await tester.pumpAndSettle();
    await tester.enterText(
      find.widgetWithText(TextField, 'Current value'),
      '62,5',
    );
    await tester.tap(find.widgetWithText(FilledButton, 'Save'));
    await tester.pumpAndSettle();
    expect((await stored(m.id)).currentValue, 62.5);
  });

  testApp('a yes/no measure has a done switch', (tester) async {
    final m = await seed.measure(
      goal.id,
      title: 'Get the certificate',
      type: MeasureType.boolean,
      current: 0,
      unit: null,
    );
    await openPage(tester);
    await tester.tap(find.byType(Switch));
    await tester.pumpAndSettle();
    expect((await stored(m.id)).currentValue, 1);
    expect(ring(tester).progress, 1);
  });

  testApp('a habit measure has no controls', (tester) async {
    final habit = await seed.habits.create(
      title: 'Stretch',
      scheduleType: ScheduleType.daily,
    );
    await seed.measure(
      goal.id,
      title: 'Stretch 20 times',
      type: MeasureType.habit,
      start: null,
      current: null,
      target: 20,
      unit: null,
      habitId: habit.id,
    );
    await openPage(tester);
    expect(find.text('0 / 20 check-ins'), findsOneWidget);
    expect(find.byTooltip('Increase Stretch 20 times by 1'), findsNothing);
    expect(find.byType(Switch), findsNothing);
  });

  testApp('tapping the title opens the edit sheet', (tester) async {
    await seed.measure(goal.id);
    await openPage(tester);
    await tester.tap(find.text('Run 100 km'));
    await tester.pumpAndSettle();
    expect(find.text('Edit measure'), findsOneWidget);
    expect(find.byType(BottomSheet), findsOneWidget);
  });

  testApp('Add measure opens the form for this goal', (tester) async {
    await openPage(tester);
    await tester.tap(find.text('Add measure'));
    await tester.pumpAndSettle();
    expect(find.text('New measure'), findsOneWidget);
    expect(find.text('Get fit'), findsWidgets);
  });
}
