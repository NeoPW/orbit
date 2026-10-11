import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:orbit/core/db/app_database.dart';
import 'package:orbit/features/goals/domain/measure_progress.dart';
import 'package:orbit/features/goals/ui/measure_tile.dart';

import '../../../helpers/fixtures.dart';

const _rose = Color(0xFFFF7A9C);

Future<void> pumpTile(WidgetTester tester, Measure m, {int habitCheckIns = 0}) {
  return tester.pumpWidget(
    MaterialApp(
      home: Scaffold(
        body: MeasureTile(
          measure: m,
          progress: measureProgress(m, habitCheckIns: habitCheckIns),
          habitCheckIns: habitCheckIns,
          color: _rose,
        ),
      ),
    ),
  );
}

MeasureBar ring(WidgetTester tester) =>
    tester.widget<MeasureBar>(find.byType(MeasureBar));

void main() {
  testWidgets('numeric shows a bar in the goal color, values', (tester) async {
    final m = measure(
      'm',
      goalId: 'g',
      title: 'Run',
      current: 20,
    ).copyWith(unit: const Value('km'));
    await pumpTile(tester, m);
    expect(ring(tester).progress, 0.2);
    expect(ring(tester).color, _rose);
    expect(find.text('20 / 100 km'), findsOneWidget);
    expect(find.text('20%'), findsOneWidget);
  });

  testWidgets('boolean shows done or not done', (tester) async {
    final m = measure(
      'm',
      goalId: 'g',
      measureType: MeasureType.boolean,
      start: 0,
      target: 1,
      current: 1,
    );
    await pumpTile(tester, m);
    expect(ring(tester).progress, 1);
    expect(find.text('Done'), findsOneWidget);

    await pumpTile(tester, m.copyWith(currentValue: const Value(0)));
    expect(ring(tester).progress, 0);
    expect(find.text('Not done'), findsOneWidget);
  });

  testWidgets('habit measure without a habit says so', (tester) async {
    final m = measure(
      'm',
      goalId: 'g',
      measureType: MeasureType.habit,
      start: null,
      current: null,
      target: 20,
    );
    await pumpTile(tester, m);
    expect(ring(tester).progress, 0);
    expect(find.text('No habit linked'), findsOneWidget);
  });
}
