import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:orbit/core/db/app_database.dart';
import 'package:orbit/core/widgets/orbit_chips.dart';
import 'package:orbit/features/projects/domain/project_deadline.dart';
import 'package:orbit/features/projects/ui/project_tile.dart';

import '../../../helpers/fixtures.dart';

final today = CalendarDate(2026, 10, 5);

Future<void> pumpTile(WidgetTester tester, ProjectTile tile) =>
    tester.pumpWidget(MaterialApp(home: Scaffold(body: tile)));

void main() {
  testWidgets('shows title, area, importance and own deadline as chips', (
    tester,
  ) async {
    await pumpTile(
      tester,
      ProjectTile(
        project: project('p', title: 'Thesis', importance: 4),
        area: area('a', name: 'Uni'),
        deadline: EffectiveDeadline(
          CalendarDate(2026, 12, 20),
          inherited: false,
        ),
        today: today,
      ),
    );
    expect(find.text('Thesis'), findsOneWidget);
    expect(find.widgetWithText(AreaChip, 'Uni'), findsOneWidget);
    expect(tester.widget<ImportanceDots>(find.byType(ImportanceDots)).value, 4);
    expect(find.text('Due 20-12-2026'), findsOneWidget);
    expect(find.text('Importance 4'), findsNothing);
    expect(find.text('Active'), findsNothing);
  });

  testWidgets('marks an inherited deadline', (tester) async {
    await pumpTile(
      tester,
      ProjectTile(
        project: project('p'),
        area: null,
        deadline: EffectiveDeadline(
          CalendarDate(2026, 12, 31),
          inherited: true,
        ),
        today: today,
      ),
    );
    expect(find.text('Due 31-12-2026 · KR'), findsOneWidget);
    expect(find.byType(AreaChip), findsNothing);
    expect(find.text('No area'), findsNothing);
  });

  testWidgets('no deadline left out; status and KR title when asked', (
    tester,
  ) async {
    await pumpTile(
      tester,
      ProjectTile(
        project: project('p', status: ProjectStatus.paused),
        area: null,
        deadline: null,
        today: today,
        showStatus: true,
        keyResultTitle: 'Run 100 km',
      ),
    );
    expect(find.byType(DeadlineChip), findsNothing);
    expect(find.text('No deadline'), findsNothing);
    expect(find.widgetWithText(StatusChip<void>, 'Paused'), findsOneWidget);
    expect(find.text('Run 100 km'), findsOneWidget);
  });
}
