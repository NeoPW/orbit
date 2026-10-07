import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:orbit/core/db/app_database.dart';
import 'package:orbit/core/theme/app_theme.dart';
import 'package:orbit/core/theme/orbit_palette.dart';
import 'package:orbit/core/widgets/orbit_chips.dart';
import 'package:orbit/core/widgets/orbit_ring.dart';
import 'package:orbit/core/widgets/section_heading.dart';

import '../../helpers/fixtures.dart';

Future<void> pump(WidgetTester tester, Widget child) => tester.pumpWidget(
  MaterialApp(
    theme: darkTheme,
    home: Scaffold(body: Center(child: child)),
  ),
);

/// The background color of the pill around [text].
Color pillColor(WidgetTester tester, String text) {
  final box = tester.widget<Container>(
    find.ancestor(of: find.text(text), matching: find.byType(Container)).first,
  );
  return (box.decoration! as BoxDecoration).color!;
}

void main() {
  final today = CalendarDate(2026, 10, 5);

  group('DeadlineChip', () {
    testWidgets('overdue is red', (tester) async {
      await pump(tester, DeadlineChip(date: today.addDays(-1), today: today));
      expect(find.text('Overdue'), findsOneWidget);
      expect(pillColor(tester, 'Overdue'), OrbitColors.dark.overdue);
    });

    testWidgets('within the lead time is amber', (tester) async {
      await pump(tester, DeadlineChip(date: today.addDays(3), today: today));
      expect(pillColor(tester, 'Due in 3 days'), OrbitColors.dark.urgent);
    });

    testWidgets('later is neutral', (tester) async {
      await pump(tester, DeadlineChip(date: today.addDays(20), today: today));
      expect(
        pillColor(tester, 'Due in 20 days'),
        OrbitPalette.dark.surfaceContainerHighest,
      );
    });

    testWidgets('an inherited deadline is marked', (tester) async {
      await pump(
        tester,
        DeadlineChip(date: today.addDays(20), today: today, inherited: true),
      );
      expect(find.text('Due in 20 days · KR'), findsOneWidget);
    });
  });

  testWidgets('AreaChip shows the name', (tester) async {
    await pump(tester, AreaChip(area: area('a', name: 'Job')));
    expect(find.text('Job'), findsOneWidget);
  });

  testWidgets('StatusChip offers the other statuses', (tester) async {
    String? chosen;
    await pump(
      tester,
      StatusChip<String>(
        label: 'Active',
        color: Colors.blue,
        options: const [('paused', 'Paused'), ('backlog', 'Backlog')],
        onSelected: (value) => chosen = value,
      ),
    );
    await tester.tap(find.text('Active'));
    await tester.pumpAndSettle();
    expect(find.text('Paused'), findsOneWidget);
    expect(find.text('Active'), findsOneWidget); // the chip, not an option
    await tester.tap(find.text('Paused'));
    await tester.pumpAndSettle();
    expect(chosen, 'paused');
  });

  testWidgets('ImportanceDots: three of five filled', (tester) async {
    await pump(tester, const ImportanceDots(value: 3));
    final dots = tester
        .widgetList<Container>(
          find.descendant(
            of: find.byType(ImportanceDots),
            matching: find.byType(Container),
          ),
        )
        .map((c) => (c.decoration! as BoxDecoration).color)
        .toList();
    expect(dots, hasLength(5));
    expect(dots.where((c) => c == OrbitPalette.dark.primary), hasLength(3));
    expect(find.bySemanticsLabel('Importance 3 of 5'), findsOneWidget);
  });

  testWidgets('OrbitRing shows its label', (tester) async {
    await pump(tester, const OrbitRing(progress: 0.5, label: '2/4'));
    expect(find.text('2/4'), findsOneWidget);
    expect(find.bySemanticsLabel('2/4'), findsOneWidget);
  });

  testWidgets('an empty section shows its action', (tester) async {
    await pump(
      tester,
      SectionEmptyText(
        'No tasks',
        action: TextButton(onPressed: () {}, child: const Text('New task')),
      ),
    );
    expect(find.text('No tasks'), findsOneWidget);
    expect(find.text('New task'), findsOneWidget);
  });
}
