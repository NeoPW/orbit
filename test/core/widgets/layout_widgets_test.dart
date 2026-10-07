import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:orbit/core/widgets/animated_items.dart';
import 'package:orbit/core/widgets/two_pane.dart';

import '../../helpers/pump_app.dart';

Widget items(List<String> names, {bool noAnimations = false}) => MaterialApp(
  home: MediaQuery(
    data: MediaQueryData(disableAnimations: noAnimations),
    child: Scaffold(
      body: AnimatedItems(
        children: [
          for (final name in names)
            SizedBox(key: ValueKey(name), height: 40, child: Text(name)),
        ],
      ),
    ),
  ),
);

void main() {
  group('AnimatedItems', () {
    testWidgets('a removed item animates out', (tester) async {
      await tester.pumpWidget(items(['A', 'B']));
      await tester.pumpWidget(items(['A']));
      await tester.pump(const Duration(milliseconds: 100));
      expect(find.text('B'), findsOneWidget); // still fading
      await tester.pumpAndSettle();
      expect(find.text('B'), findsNothing);
    });

    testWidgets('an added item animates in', (tester) async {
      await tester.pumpWidget(items(['A']));
      await tester.pumpWidget(items(['A', 'B']));
      await tester.pump(const Duration(milliseconds: 50));
      final fade = tester.widget<FadeTransition>(
        find
            .ancestor(of: find.text('B'), matching: find.byType(FadeTransition))
            .first,
      );
      expect(fade.opacity.value, lessThan(1));
      await tester.pumpAndSettle();
      expect(find.text('B'), findsOneWidget);
    });

    testWidgets('without animations a removal is immediate', (tester) async {
      await tester.pumpWidget(items(['A', 'B'], noAnimations: true));
      await tester.pumpWidget(items(['A'], noAnimations: true));
      await tester.pump();
      expect(find.text('B'), findsNothing);
    });
  });

  group('TwoPane', () {
    Widget pane() => const MaterialApp(
      home: Scaffold(
        body: TwoPane(list: Text('list'), detail: Text('detail')),
      ),
    );

    testWidgets('wide: both panes', (tester) async {
      setWindowSize(tester, 1400, 900);
      await tester.pumpWidget(pane());
      expect(find.text('list'), findsOneWidget);
      expect(find.text('detail'), findsOneWidget);
    });

    testWidgets('narrow: only the list', (tester) async {
      setWindowSize(tester, 400, 800);
      await tester.pumpWidget(pane());
      expect(find.text('list'), findsOneWidget);
      expect(find.text('detail'), findsNothing);
    });
  });
}
