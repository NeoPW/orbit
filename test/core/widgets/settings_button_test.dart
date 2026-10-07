import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:orbit/core/db/app_database.dart';
import 'package:orbit/core/router/routes.dart';

import '../../helpers/pump_app.dart';
import '../../helpers/test_db.dart';

void main() {
  late AppDatabase db;
  setUp(() => db = newTestDatabase());

  for (final (tab, route, title) in [
    ('Plan', Routes.plan, 'Plan'),
    ('Home', Routes.home, 'Home'),
    ('Review', Routes.review, 'Review'),
  ]) {
    testApp('$tab: the settings button opens Settings and back returns', (
      tester,
    ) async {
      final app = await pumpApp(tester, db: db, location: route);
      await tester.tap(find.byTooltip('Settings'));
      await tester.pumpAndSettle();
      expect(find.widgetWithText(AppBar, 'Settings'), findsOneWidget);
      expect(
        app.router.routeInformationProvider.value.uri.path,
        Routes.settings,
      );

      app.router.pop();
      await tester.pumpAndSettle();
      expect(find.widgetWithText(AppBar, title), findsOneWidget);
    });
  }

  testApp('the Plan menu no longer lists Settings', (tester) async {
    await pumpApp(tester, db: db, location: Routes.plan);
    await tester.tap(find.byTooltip('More'));
    await tester.pumpAndSettle();
    expect(find.text('Archive'), findsOneWidget);
    expect(
      find.widgetWithText(PopupMenuItem<String>, 'Settings'),
      findsNothing,
    );
  });
}
