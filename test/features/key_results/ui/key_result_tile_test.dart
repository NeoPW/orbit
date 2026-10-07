import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:orbit/core/db/app_database.dart';
import 'package:orbit/core/widgets/orbit_ring.dart';
import 'package:orbit/features/key_results/domain/kr_progress.dart';
import 'package:orbit/features/key_results/ui/key_result_tile.dart';

import '../../../helpers/fixtures.dart';

Future<void> pumpTile(
  WidgetTester tester,
  KeyResult kr, {
  int habitCheckIns = 0,
}) {
  return tester.pumpWidget(
    MaterialApp(
      home: Scaffold(
        body: KeyResultTile(
          keyResult: kr,
          progress: krProgress(
            kr.measureType,
            start: kr.startValue,
            target: kr.targetValue,
            current: kr.currentValue,
            habitCheckIns: habitCheckIns,
          ),
          habitCheckIns: habitCheckIns,
          effectiveDeadline: CalendarDate(2026, 12, 31),
          today: CalendarDate(2026, 10, 5),
        ),
      ),
    ),
  );
}

double ringValue(WidgetTester tester) =>
    tester.widget<OrbitRing>(find.byType(OrbitRing)).progress;

void main() {
  testWidgets('numeric shows an orbit ring, values and percent', (
    tester,
  ) async {
    final kr = keyResult(
      'kr',
      objectiveId: 'o',
      title: 'Run',
      current: 20,
    ).copyWith(unit: const Value('km'));
    await pumpTile(tester, kr);
    expect(ringValue(tester), 0.2);
    expect(find.text('20 / 100 km'), findsOneWidget);
    expect(find.text('20%'), findsOneWidget);
    expect(find.text('Due 31-12-2026'), findsOneWidget);
  });

  testWidgets('boolean shows done or not done', (tester) async {
    final kr = keyResult(
      'kr',
      objectiveId: 'o',
      measureType: MeasureType.boolean,
      start: 0,
      target: 1,
      current: 1,
    );
    await pumpTile(tester, kr);
    expect(ringValue(tester), 1);
    expect(find.text('Done'), findsOneWidget);
    // A reached KR shows no deadline badge.
    expect(find.text('Due 31-12-2026'), findsNothing);

    await pumpTile(tester, kr.copyWith(currentValue: const Value(0)));
    expect(ringValue(tester), 0);
    expect(find.text('Not done'), findsOneWidget);
  });

  testWidgets('habit shows check-ins against the target', (tester) async {
    final kr = keyResult(
      'kr',
      objectiveId: 'o',
      measureType: MeasureType.habit,
      start: null,
      current: null,
      target: 20,
      habitId: 'h1',
    );
    await pumpTile(tester, kr, habitCheckIns: 10);
    expect(ringValue(tester), 0.5);
    expect(find.text('10 / 20 check-ins'), findsOneWidget);
  });

  testWidgets('habit KR without a habit says so', (tester) async {
    final kr = keyResult(
      'kr',
      objectiveId: 'o',
      measureType: MeasureType.habit,
      start: null,
      current: null,
      target: 20,
    );
    await pumpTile(tester, kr);
    expect(ringValue(tester), 0);
    expect(find.text('No habit linked'), findsOneWidget);
  });
}
