import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:orbit/app.dart';
import 'package:orbit/core/db/app_database.dart';
import 'package:orbit/core/notifications/notification_scheduler.dart';
import 'package:orbit/core/router/routes.dart';
import 'package:orbit/features/projects/ui/project_detail_screen.dart';

import '../../../helpers/fake_scheduler.dart';
import '../../../helpers/pump_app.dart';
import '../../../helpers/seed.dart';
import '../../../helpers/test_db.dart';

void main() {
  late AppDatabase db;
  late Seed seed;
  setUp(() {
    db = newTestDatabase();
    seed = Seed(db);
  });

  Future<void> tap(WidgetTester tester, String route) async {
    ProviderScope.containerOf(tester.element(find.byType(OrbitApp)))
        .read(notificationTapProvider.notifier)
        .tapped(route);
    await tester.pumpAndSettle();
  }

  testApp('a tapped task reminder opens the project detail', (tester) async {
    final p = await seed.projects.create(title: 'Thesis');
    final app = await pumpApp(tester, db: db, location: Routes.plan);
    await tap(tester, Routes.projectDetail(p.id));

    expect(find.widgetWithText(ProjectDetailBody, 'Thesis'), findsOneWidget);
    // Opened on top: back returns to Plan.
    app.router.pop();
    await tester.pumpAndSettle();
    expect(find.widgetWithText(AppBar, 'Plan'), findsOneWidget);
  });

  testApp('a tapped habit reminder shows Home', (tester) async {
    await pumpApp(tester, db: db, location: Routes.plan);
    await tap(tester, Routes.home);
    expect(find.text('Habits due today'), findsOneWidget);
  });

  testApp('the same reminder tapped twice opens it twice', (tester) async {
    final p = await seed.projects.create(title: 'Thesis');
    final app = await pumpApp(tester, db: db, location: Routes.plan);
    await tap(tester, Routes.projectDetail(p.id));
    app.router.pop();
    await tester.pumpAndSettle();
    await tap(tester, Routes.projectDetail(p.id));
    expect(find.widgetWithText(ProjectDetailBody, 'Thesis'), findsOneWidget);
  });

  testApp('with reminders supported, the permission is asked once', (
    tester,
  ) async {
    final scheduler = FakeNotificationScheduler();
    await pumpApp(
      tester,
      db: db,
      overrides: [notificationSchedulerProvider.overrideWithValue(scheduler)],
    );
    await tester.pump(const Duration(seconds: 1));
    await tester.pump(const Duration(seconds: 1));
    expect(scheduler.permissionRequests, 1);
  });

  testApp('without support nothing is asked or scheduled', (tester) async {
    final scheduler = FakeNotificationScheduler(supported: false);
    await pumpApp(
      tester,
      db: db,
      overrides: [notificationSchedulerProvider.overrideWithValue(scheduler)],
    );
    await tester.pump(const Duration(seconds: 1));
    expect(scheduler.permissionRequests, 0);
    expect(scheduler.calls, isEmpty);
  });
}
