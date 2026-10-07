import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:orbit/core/db/app_database.dart';
import 'package:orbit/core/router/routes.dart';

import '../../../helpers/pump_app.dart';
import '../../../helpers/test_db.dart';

void main() {
  late AppDatabase db;
  setUp(() => db = newTestDatabase());

  Future<List<Task>> tasks() =>
      (db.select(db.tasks)..where((t) => t.deletedAt.isNull())).get();

  Future<void> openFromPlan(WidgetTester tester) async {
    await pumpApp(tester, db: db, location: Routes.plan);
    await tester.tap(find.byTooltip('Create'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('New task'));
    await tester.pumpAndSettle();
  }

  testApp('Plan\'s create menu offers New task', (tester) async {
    await pumpApp(tester, db: db, location: Routes.plan);
    await tester.tap(find.byTooltip('Create'));
    await tester.pumpAndSettle();
    expect(find.text('New task'), findsOneWidget);
  });

  testApp('a title alone creates a standalone task', (tester) async {
    await openFromPlan(tester);
    await tester.enterText(
      find.widgetWithText(TextField, 'Title'),
      'Tax return',
    );
    await tester.tap(find.widgetWithText(FilledButton, 'Save'));
    await tester.pumpAndSettle();

    final task = (await tasks()).single;
    expect(task.title, 'Tax return');
    expect(task.projectId, isNull);
    expect(task.keyResultId, isNull);
    expect(task.objectiveId, isNull);
    expect(find.text('Task "Tax return" created'), findsOneWidget);
  });

  testApp('an empty title is not saved', (tester) async {
    await openFromPlan(tester);
    await tester.tap(find.widgetWithText(FilledButton, 'Save'));
    await tester.pumpAndSettle();
    expect(find.text('Enter a title'), findsOneWidget);
    expect(await tasks(), isEmpty);
  });
}
