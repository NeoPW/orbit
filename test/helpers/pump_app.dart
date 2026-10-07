import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:orbit/app.dart';
import 'package:orbit/core/db/app_database.dart';
import 'package:orbit/core/db/database_providers.dart';
import 'package:orbit/core/messages/message_host.dart';
import 'package:orbit/core/router/router.dart';

import 'test_db.dart';

/// Pumps the whole app on an in-memory database at [location], with the
/// window set to [width] × [height] logical pixels.
Future<({AppDatabase db, GoRouter router})> pumpApp(
  WidgetTester tester, {
  String location = '/home',
  double width = 400,
  double height = 800,
  AppDatabase? db,
  List overrides = const [],
}) async {
  setWindowSize(tester, width, height);
  final database = db ?? newTestDatabase();
  final router = createRouter(initialLocation: location);
  await tester.pumpWidget(
    ProviderScope(
      overrides: [
        appDatabaseProvider.overrideWithValue(database),
        ...overrides,
      ],
      child: OrbitApp(router: router),
    ),
  );
  await tester.pumpAndSettle();
  _cleanups.add(() async {
    // Unmounting cancels drift stream queries, which close on a zero-length
    // timer; it must run before the test body ends.
    await tester.pumpWidget(const SizedBox());
    await tester.pump(Duration.zero);
    await database.close();
  });
  return (db: database, router: router);
}

/// Pumps [child] in a scaffold with the app theme, on an in-memory database
/// (or [db]), without the router. For widgets and dialogs on their own.
Future<AppDatabase> pumpInScaffold(
  WidgetTester tester,
  Widget child, {
  AppDatabase? db,
  List overrides = const [],
  double width = 400,
  double height = 800,
}) async {
  setWindowSize(tester, width, height);
  final database = db ?? newTestDatabase();
  await tester.pumpWidget(
    ProviderScope(
      overrides: [
        appDatabaseProvider.overrideWithValue(database),
        ...overrides,
      ],
      child: MaterialApp(
        home: Scaffold(body: child),
        builder: (context, child) => MessageHost(child: child!),
      ),
    ),
  );
  await tester.pumpAndSettle();
  _cleanups.add(() async {
    await tester.pumpWidget(const SizedBox());
    await tester.pump(Duration.zero);
    await database.close();
  });
  return database;
}

/// Pumps a screen with an "Open" button, taps it and lets [open] show a form
/// sheet (see `showFormSheet`), on an in-memory database (or [db]).
Future<AppDatabase> pumpSheet(
  WidgetTester tester,
  Future<Object?> Function(BuildContext context) open, {
  AppDatabase? db,
  double width = 400,
  double height = 1000,
}) async {
  final database = await pumpInScaffold(
    tester,
    Builder(
      builder: (context) => Center(
        child: TextButton(
          onPressed: () => open(context),
          child: const Text('Open'),
        ),
      ),
    ),
    db: db,
    width: width,
    height: height,
  );
  await tester.tap(find.text('Open'));
  await tester.pumpAndSettle();
  return database;
}

final _cleanups = <Future<void> Function()>[];

/// A widget test that uses [pumpApp]; cleans up the app and database at the
/// end of the test body.
void testApp(String description, WidgetTesterCallback body) {
  testWidgets(description, (tester) async {
    try {
      await body(tester);
    } finally {
      for (final cleanup in _cleanups.reversed) {
        await cleanup();
      }
      _cleanups.clear();
    }
  });
}

void setWindowSize(WidgetTester tester, double width, double height) {
  tester.view.physicalSize = Size(width, height);
  tester.view.devicePixelRatio = 1;
  addTearDown(tester.view.reset);
}
