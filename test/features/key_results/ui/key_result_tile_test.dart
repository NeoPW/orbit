import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:orbit/core/db/app_database.dart';
import 'package:orbit/features/key_results/domain/kr_progress.dart';
import 'package:orbit/features/key_results/ui/key_result_tile.dart';

import '../../../helpers/fixtures.dart';

Future<void> pumpTile(WidgetTester tester, KeyResult kr) {
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
          ),
          effectiveDeadline: CalendarDate(2026, 12, 31),
        ),
      ),
    ),
  );
}

double? barValue(WidgetTester tester) => tester
    .widget<LinearProgressIndicator>(find.byType(LinearProgressIndicator))
    .value;

void main() {
  testWidgets('numeric shows a progress bar, values and percent', (
    tester,
  ) async {
    final kr = keyResult(
      'kr',
      objectiveId: 'o',
      title: 'Run',
      current: 20,
    ).copyWith(unit: const Value('km'));
    await pumpTile(tester, kr);
    expect(barValue(tester), 0.2);
    expect(find.text('20 / 100 km · 20%'), findsOneWidget);
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
    expect(barValue(tester), 1);
    expect(find.text('Done'), findsOneWidget);

    await pumpTile(tester, kr.copyWith(currentValue: const Value(0)));
    expect(barValue(tester), 0);
    expect(find.text('Not done'), findsOneWidget);
  });

  testWidgets('habit shows the milestone 2 note instead of a bar', (
    tester,
  ) async {
    final kr = keyResult(
      'kr',
      objectiveId: 'o',
      measureType: MeasureType.habit,
      start: null,
      current: null,
      target: 40,
    );
    await pumpTile(tester, kr);
    expect(find.byType(LinearProgressIndicator), findsNothing);
    expect(find.text('Progress available from milestone 2'), findsOneWidget);
  });
}
