import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:orbit/core/db/app_database.dart';
import 'package:orbit/core/sync/sync_providers.dart';
import 'package:orbit/features/account/data/account_controller.dart';

import '../../../helpers/fake_auth.dart';
import '../../../helpers/fake_sync_service.dart';
import '../../../helpers/pump_app.dart';
import '../../../helpers/test_db.dart';

void main() {
  late AppDatabase db;
  late FakeSyncService service;
  setUp(() {
    db = newTestDatabase();
    service = FakeSyncService();
  });

  Future<void> pumpHome(WidgetTester tester, {required bool signedIn}) =>
      pumpApp(
        tester,
        db: db,
        overrides: [
          authGatewayProvider.overrideWithValue(
            FakeAuthGateway()..signedIn = signedIn,
          ),
          syncServiceProvider.overrideWithValue(service),
        ],
      );

  Future<void> pullDown(WidgetTester tester) async {
    await tester.fling(find.byType(ListView).first, const Offset(0, 400), 1000);
    await tester.pumpAndSettle();
  }

  testApp('pulling down on Home syncs when signed in', (tester) async {
    await pumpHome(tester, signedIn: true);
    // The sync at start.
    expect(service.calls, 1);

    await pullDown(tester);
    expect(service.calls, 2);
    expect(find.byType(RefreshProgressIndicator), findsNothing);
  });

  testApp('signed out, the indicator just ends', (tester) async {
    await pumpHome(tester, signedIn: false);
    await pullDown(tester);
    expect(service.calls, 0);
    expect(find.byType(RefreshProgressIndicator), findsNothing);
  });
}
