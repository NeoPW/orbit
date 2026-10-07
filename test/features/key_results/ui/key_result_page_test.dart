import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:orbit/core/db/app_database.dart';
import 'package:orbit/core/router/routes.dart';
import 'package:orbit/core/time/today.dart';
import 'package:orbit/core/widgets/orbit_chips.dart';
import 'package:orbit/core/widgets/orbit_ring.dart';
import 'package:orbit/features/projects/ui/project_detail_screen.dart';
import 'package:orbit/features/tasks/domain/task_assignment.dart';

import '../../../helpers/pump_app.dart';
import '../../../helpers/seed.dart';
import '../../../helpers/test_db.dart';

final today = CalendarDate(2026, 10, 7);

void main() {
  late AppDatabase db;
  late Seed seed;
  late Objective objective;

  setUp(() async {
    db = newTestDatabase();
    seed = Seed(db);
    objective = await seed.objective();
  });

  Future<void> openPage(WidgetTester tester, String id) async {
    await pumpApp(
      tester,
      db: db,
      location: Routes.keyResult(id),
      height: 1200,
      overrides: [todayProvider.overrideWithValue(today)],
    );
  }

  double ring(WidgetTester tester) =>
      tester.widget<OrbitRing>(find.byType(OrbitRing)).progress;

  Future<KeyResult> stored(String id) async => (await seed.keyResults.get(id))!;

  group('page', () {
    testApp('shows ring, value and deadline badge, not the form', (
      tester,
    ) async {
      final kr = await seed.kr(objective.id, current: 40);
      await openPage(tester, kr.id);
      expect(find.text('Run 100 km'), findsOneWidget);
      expect(find.text('40 / 100 km'), findsOneWidget);
      expect(find.text('40%'), findsOneWidget);
      expect(find.byType(DeadlineChip), findsOneWidget);
      expect(find.text('Objective · Get fit'), findsOneWidget);
      expect(find.text('Edit key result'), findsNothing);
    });

    testApp('lists linked projects and tasks; a project opens', (tester) async {
      final kr = await seed.kr(objective.id);
      await seed.projects.create(title: 'Marathon plan', keyResultId: kr.id);
      await seed.tasks.create(
        title: 'Book physio',
        assignment: ForKeyResult(kr.id),
      );
      await openPage(tester, kr.id);
      expect(find.text('Book physio'), findsOneWidget);
      await tester.tap(find.text('Marathon plan'));
      await tester.pumpAndSettle();
      expect(find.byType(ProjectDetailBody), findsOneWidget);
    });

    testApp('a deleted KR is not found', (tester) async {
      final kr = await seed.kr(objective.id);
      await seed.keyResults.delete(kr.id);
      await openPage(tester, kr.id);
      expect(find.text('Key result not found'), findsOneWidget);
    });

    testApp('Edit opens the KR form in a sheet', (tester) async {
      final kr = await seed.kr(objective.id);
      await openPage(tester, kr.id);
      await tester.tap(find.byTooltip('Edit key result'));
      await tester.pumpAndSettle();
      expect(find.text('Edit key result'), findsOneWidget);
      expect(find.byType(BottomSheet), findsOneWidget);
    });
  });

  group('progress controls', () {
    testApp('+ raises the value by the step', (tester) async {
      final kr = await seed.kr(objective.id, current: 40, step: 5);
      await openPage(tester, kr.id);
      await tester.tap(find.byTooltip('Increase by 5'));
      await tester.pumpAndSettle();
      expect((await stored(kr.id)).currentValue, 45);
      expect(ring(tester), 0.45);
      expect(find.text('45%'), findsOneWidget);
    });

    testApp('− lowers the value by the step', (tester) async {
      final kr = await seed.kr(objective.id, current: 40);
      await openPage(tester, kr.id);
      await tester.tap(find.byTooltip('Decrease by 1'));
      await tester.pumpAndSettle();
      expect((await stored(kr.id)).currentValue, 39);
    });

    testApp('the value can be entered directly', (tester) async {
      final kr = await seed.kr(objective.id, current: 40);
      await openPage(tester, kr.id);
      await tester.tap(find.text('40 km'));
      await tester.pumpAndSettle();
      await tester.enterText(
        find.widgetWithText(TextField, 'Current value'),
        '62,5',
      );
      await tester.tap(find.widgetWithText(FilledButton, 'Save'));
      await tester.pumpAndSettle();
      expect((await stored(kr.id)).currentValue, 62.5);
    });

    testApp('a boolean KR has a done switch', (tester) async {
      final kr = await seed.kr(
        objective.id,
        title: 'Publish thesis',
        type: MeasureType.boolean,
        current: 0,
        unit: null,
      );
      await openPage(tester, kr.id);
      await tester.tap(find.widgetWithText(SwitchListTile, 'Done'));
      await tester.pumpAndSettle();
      expect((await stored(kr.id)).currentValue, 1);
      expect(ring(tester), 1);
    });

    testApp('a habit KR has no controls', (tester) async {
      final habit = await seed.habits.create(
        title: 'Stretch',
        scheduleType: ScheduleType.daily,
      );
      final kr = await seed.kr(
        objective.id,
        title: 'Stretch 20 times',
        type: MeasureType.habit,
        start: null,
        current: null,
        target: 20,
        unit: null,
        habitId: habit.id,
      );
      await openPage(tester, kr.id);
      expect(find.text('0 / 20 check-ins'), findsOneWidget);
      expect(find.byIcon(Icons.add), findsNothing);
      expect(find.byType(SwitchListTile), findsNothing);
    });
  });
}
