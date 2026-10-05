import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:orbit/core/db/app_database.dart';
import 'package:orbit/core/notifications/notification_scheduler.dart';
import 'package:orbit/core/router/routes.dart';
import 'package:orbit/core/sync/sync_providers.dart';
import 'package:orbit/features/account/data/account_controller.dart';

import '../../../helpers/fake_auth.dart';
import '../../../helpers/fake_remote_store.dart';
import '../../../helpers/fake_scheduler.dart';
import '../../../helpers/pump_app.dart';
import '../../../helpers/test_db.dart';

void main() {
  late AppDatabase db;
  late FakeRemoteStore remote;
  late FakeAuthGateway auth;
  setUp(() {
    db = newTestDatabase();
    remote = FakeRemoteStore();
    auth = FakeAuthGateway();
  });

  Future<void> pumpSettings(WidgetTester tester, {bool configured = true}) =>
      pumpApp(
        tester,
        db: db,
        location: Routes.settings,
        height: 2000,
        overrides: [
          notificationSchedulerProvider.overrideWithValue(
            FakeNotificationScheduler(supported: false),
          ),
          authGatewayProvider.overrideWithValue(configured ? auth : null),
          remoteStoreProvider.overrideWithValue(remote),
        ],
      );

  Future<void> signIn(WidgetTester tester, {String password = 'secret'}) async {
    await tester.enterText(
      find.widgetWithText(TextField, 'Email'),
      'me@example.com',
    );
    await tester.enterText(
      find.widgetWithText(TextField, 'Password'),
      password,
    );
    await tester.tap(find.widgetWithText(FilledButton, 'Sign in'));
    await tester.pumpAndSettle();
  }

  testApp('not configured', (tester) async {
    await pumpSettings(tester, configured: false);
    expect(find.text('Account & sync'), findsOneWidget);
    expect(find.text('Sync is not configured in this build'), findsOneWidget);
    expect(find.text('Sign in'), findsNothing);
  });

  testApp('signed out: a form without sign-up', (tester) async {
    await pumpSettings(tester);
    expect(find.widgetWithText(TextField, 'Email'), findsOneWidget);
    expect(find.widgetWithText(TextField, 'Password'), findsOneWidget);
    expect(find.textContaining('Create'), findsNothing);
    expect(find.textContaining('Sign up'), findsNothing);
  });

  testApp('a wrong password shows an error', (tester) async {
    await pumpSettings(tester);
    await signIn(tester, password: 'nope');
    expect(find.text('Wrong email or password'), findsOneWidget);
    expect(find.text('Sign out'), findsNothing);
  });

  testApp('signed in: email, last synced, sync now and sign out', (
    tester,
  ) async {
    await pumpSettings(tester);
    await signIn(tester);

    expect(find.text('me@example.com'), findsOneWidget);
    expect(find.textContaining('Last synced'), findsOneWidget);
    expect(find.text('Sync now'), findsOneWidget);

    await tester.tap(find.text('Sign out'));
    await tester.pumpAndSettle();
    expect(find.widgetWithText(TextField, 'Email'), findsOneWidget);
  });

  testApp('a failed sync is shown', (tester) async {
    await pumpSettings(tester);
    await signIn(tester);
    remote.failWith = Exception('offline');
    await tester.tap(find.text('Sync now'));
    await tester.pumpAndSettle();
    expect(find.text('Last sync failed'), findsOneWidget);
  });

  group('account with data', () {
    setUp(() async {
      await remote.upsert('projects', [
        {'id': 'p1', 'updated_at': '2026-10-05T10:00:00.000Z'},
      ]);
    });

    testApp('Cancel keeps this device signed out', (tester) async {
      await pumpSettings(tester);
      await signIn(tester);
      expect(find.text('Replace data on this device?'), findsOneWidget);
      await tester.tap(find.text('Cancel'));
      await tester.pumpAndSettle();
      expect(find.widgetWithText(FilledButton, 'Sign in'), findsOneWidget);
      expect(auth.signedIn, isFalse);
    });

    testApp('Replace signs in', (tester) async {
      await pumpSettings(tester);
      await signIn(tester);
      await tester.tap(find.text('Replace'));
      await tester.pumpAndSettle();
      expect(find.text('me@example.com'), findsOneWidget);
    });
  });
}
