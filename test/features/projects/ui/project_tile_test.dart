import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:orbit/core/db/app_database.dart';
import 'package:orbit/core/widgets/area_dot.dart';
import 'package:orbit/features/projects/domain/project_deadline.dart';
import 'package:orbit/features/projects/ui/project_tile.dart';

import '../../../helpers/fixtures.dart';

Future<void> pumpTile(WidgetTester tester, ProjectTile tile) =>
    tester.pumpWidget(MaterialApp(home: Scaffold(body: tile)));

void main() {
  testWidgets('shows title, area, importance and own deadline', (tester) async {
    await pumpTile(
      tester,
      ProjectTile(
        project: project('p', title: 'Thesis', importance: 4),
        area: area('a', name: 'Uni'),
        deadline: EffectiveDeadline(
          CalendarDate(2026, 10, 20),
          inherited: false,
        ),
      ),
    );
    expect(find.text('Thesis'), findsOneWidget);
    expect(find.text('Uni'), findsOneWidget);
    expect(find.byType(AreaDot), findsOneWidget);
    expect(find.text('Importance 4'), findsOneWidget);
    expect(find.text('Due 20-10-2026'), findsOneWidget);
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
      ),
    );
    expect(find.text('Due 31-12-2026 (from key result)'), findsOneWidget);
    expect(find.text('No area'), findsOneWidget);
  });

  testWidgets('no deadline, status and KR title when asked', (tester) async {
    await pumpTile(
      tester,
      ProjectTile(
        project: project('p', status: ProjectStatus.paused),
        area: null,
        deadline: null,
        showStatus: true,
        keyResultTitle: 'Run 100 km',
      ),
    );
    expect(find.text('No deadline'), findsOneWidget);
    expect(find.text('Paused'), findsOneWidget);
    expect(find.text('Key result: Run 100 km'), findsOneWidget);
  });
}
