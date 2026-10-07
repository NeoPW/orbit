import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:orbit/core/db/app_database.dart';
import 'package:orbit/core/router/routes.dart';
import 'package:orbit/core/time/today.dart';
import 'package:orbit/features/key_results/ui/key_result_screen.dart';
import 'package:orbit/features/key_results/ui/key_result_tile.dart';
import 'package:orbit/features/tasks/domain/task_assignment.dart';

import '../../../helpers/pump_app.dart';
import '../../../helpers/seed.dart';
import '../../../helpers/test_db.dart';

final today = CalendarDate(2026, 10, 7);

void main() {
  late AppDatabase db;
  late Seed seed;

  setUp(() {
    db = newTestDatabase();
    seed = Seed(db);
  });

  Future<({AppDatabase db, GoRouter router})> openPage(
    WidgetTester tester,
    String id,
  ) => pumpApp(
    tester,
    db: db,
    location: Routes.objective(id),
    height: 1200,
    overrides: [todayProvider.overrideWithValue(today)],
  );

  testApp('shows dates, key results and assigned tasks', (tester) async {
    final o = await seed.objective();
    await seed.kr(o.id, title: 'Run 100 km');
    await seed.kr(o.id, title: 'Swim 10 km');
    await seed.tasks.create(title: 'Buy shoes', assignment: ForObjective(o.id));
    await openPage(tester, o.id);

    expect(find.text('Get fit'), findsOneWidget);
    expect(find.text('01-10-2026 – 31-12-2026'), findsOneWidget);
    expect(find.byType(KeyResultTile), findsNWidgets(2));
    expect(find.text('Buy shoes'), findsOneWidget);
    expect(find.text('Edit objective'), findsNothing);
  });

  testApp('tapping a key result opens its page', (tester) async {
    final o = await seed.objective();
    final kr = await seed.kr(o.id, title: 'Run 100 km');
    final app = await openPage(tester, o.id);
    await tester.tap(find.text('Run 100 km'));
    await tester.pumpAndSettle();
    expect(find.byType(KeyResultPageBody), findsOneWidget);
    expect(app.router.state.uri.path, Routes.keyResult(kr.id));
  });

  testApp('completing from the status chip moves it to the Archive', (
    tester,
  ) async {
    final o = await seed.objective();
    final app = await openPage(tester, o.id);
    await tester.tap(find.byTooltip('Change status'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Completed'));
    await tester.pumpAndSettle();
    expect(
      (await seed.objectives.get(o.id))!.status,
      ObjectiveStatus.completed,
    );

    app.router.go(Routes.archive);
    await tester.pumpAndSettle();
    expect(find.text('Get fit'), findsOneWidget);
  });

  testApp('a deleted objective is not found', (tester) async {
    final o = await seed.objective();
    await seed.objectives.delete(o.id);
    await openPage(tester, o.id);
    expect(find.text('Objective not found'), findsOneWidget);
  });

  testApp('Add key result opens the KR form for this objective', (
    tester,
  ) async {
    final o = await seed.objective();
    await openPage(tester, o.id);
    await tester.tap(find.text('Add key result'));
    await tester.pumpAndSettle();
    expect(find.text('New key result'), findsOneWidget);
    expect(find.byType(BottomSheet), findsOneWidget);
  });
}
