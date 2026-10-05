import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:orbit/core/db/database_providers.dart';

import '../../helpers/pump_app.dart';

List<String> destinationLabels(WidgetTester tester) {
  final bar = tester.widgetList<NavigationBar>(find.byType(NavigationBar));
  if (bar.isNotEmpty) {
    return [
      for (final d in bar.single.destinations)
        (d as NavigationDestination).label,
    ];
  }
  final rail = tester.widget<NavigationRail>(find.byType(NavigationRail));
  return [for (final d in rail.destinations) (d.label as Text).data!];
}

int selectedIndex(WidgetTester tester) {
  final bar = tester.widgetList<NavigationBar>(find.byType(NavigationBar));
  if (bar.isNotEmpty) return bar.single.selectedIndex;
  return tester
      .widget<NavigationRail>(find.byType(NavigationRail))
      .selectedIndex!;
}

void main() {
  testApp('phone width shows a bottom navigation bar', (tester) async {
    await pumpApp(tester, width: 400);
    expect(find.byType(NavigationBar), findsOneWidget);
    expect(find.byType(NavigationRail), findsNothing);
  });

  testApp('desktop width shows a navigation rail', (tester) async {
    await pumpApp(tester, width: 1200);
    expect(find.byType(NavigationRail), findsOneWidget);
    expect(find.byType(NavigationBar), findsNothing);
  });

  testApp('destinations are Plan, Home, Review; Home is selected', (
    tester,
  ) async {
    await pumpApp(tester);
    expect(destinationLabels(tester), ['Plan', 'Home', 'Review']);
    expect(selectedIndex(tester), 1);
  });

  testApp('selecting Plan shows the Plan screen', (tester) async {
    await pumpApp(tester);
    await tester.tap(find.text('Plan'));
    await tester.pumpAndSettle();
    expect(selectedIndex(tester), 0);
    expect(find.widgetWithText(AppBar, 'Plan'), findsOneWidget);
  });

  testApp('resizing across 600 px keeps the selected destination', (
    tester,
  ) async {
    final app = await pumpApp(tester, width: 400);
    app.router.go('/plan');
    await tester.pumpAndSettle();
    expect(selectedIndex(tester), 0);

    setWindowSize(tester, 1200, 800);
    await tester.pumpAndSettle();
    expect(find.byType(NavigationRail), findsOneWidget);
    expect(selectedIndex(tester), 0);
    expect(find.widgetWithText(AppBar, 'Plan'), findsOneWidget);

    setWindowSize(tester, 400, 800);
    await tester.pumpAndSettle();
    expect(find.byType(NavigationBar), findsOneWidget);
    expect(selectedIndex(tester), 0);
  });

  testApp('an unknown path shows Home', (tester) async {
    await pumpApp(tester, location: '/does-not-exist');
    expect(selectedIndex(tester), 1);
    expect(find.widgetWithText(AppBar, 'Home'), findsOneWidget);
  });

  testApp('/ shows Home', (tester) async {
    await pumpApp(tester, location: '/');
    expect(find.widgetWithText(AppBar, 'Home'), findsOneWidget);
  });

  testApp('the storage warning shows a banner', (tester) async {
    await pumpApp(tester);
    expect(find.byType(MaterialBanner), findsNothing);

    final element = tester.element(find.byType(NavigationBar));
    ProviderScope.containerOf(element)
        .read(storageWarningProvider.notifier)
        .show();
    await tester.pumpAndSettle();
    expect(find.byType(MaterialBanner), findsOneWidget);
    expect(find.textContaining('not saved'), findsOneWidget);
  });

  group('destinations', () {
    testApp('Home shows its sections, not a placeholder', (tester) async {
      await pumpApp(tester);
      expect(find.text('Habits due today'), findsOneWidget);
      expect(find.textContaining('later milestone'), findsNothing);
    });

    testApp('Review shows the weekly review, not a placeholder', (
      tester,
    ) async {
      await pumpApp(tester, location: '/review');
      expect(find.widgetWithText(AppBar, 'Review'), findsOneWidget);
      expect(find.text("This week's plan"), findsOneWidget);
      expect(find.textContaining('later milestone'), findsNothing);
    });
  });
}
