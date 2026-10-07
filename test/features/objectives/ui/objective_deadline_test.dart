import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:orbit/core/db/app_database.dart';
import 'package:orbit/core/router/routes.dart';
import 'package:orbit/core/theme/orbit_palette.dart';
import 'package:orbit/core/time/today.dart';
import 'package:orbit/core/widgets/orbit_chips.dart';

import '../../../helpers/pump_app.dart';
import '../../../helpers/seed.dart';
import '../../../helpers/test_db.dart';

final today = CalendarDate(2026, 10, 7);

void main() {
  late AppDatabase db;
  late Seed seed;

  setUp(() {
    db = newTestDatabase();
    seed = Seed(db);
  });

  Future<void> open(WidgetTester tester, String location) => pumpApp(
    tester,
    db: db,
    location: location,
    height: 1200,
    overrides: [todayProvider.overrideWithValue(today)],
  );

  /// The background of the deadline badge reading [text].
  Color? badgeColor(WidgetTester tester, String text) {
    final box = tester.widget<Container>(
      find
          .ancestor(of: find.text(text), matching: find.byType(Container))
          .first,
    );
    return (box.decoration as BoxDecoration?)?.color;
  }

  testApp('an overdue objective shows a red badge in Plan', (tester) async {
    await seed.objective(
      start: CalendarDate(2026, 7, 1),
      end: CalendarDate(2026, 9, 30),
    );
    await open(tester, Routes.plan);
    expect(find.text('Overdue'), findsOneWidget);
    expect(
      badgeColor(tester, 'Overdue'),
      OrbitColors.of(tester.element(find.text('Overdue'))).overdue,
    );
  });

  testApp('an objective ending within the lead time is amber', (tester) async {
    final o = await seed.objective(end: today.addDays(3));
    await open(tester, Routes.objective(o.id));
    expect(find.text('Due in 3 days'), findsOneWidget);
    expect(
      badgeColor(tester, 'Due in 3 days'),
      OrbitColors.of(tester.element(find.text('Due in 3 days'))).urgent,
    );
  });

  testApp('a completed objective is not marked overdue', (tester) async {
    final o = await seed.objective(
      start: CalendarDate(2026, 7, 1),
      end: CalendarDate(2026, 9, 30),
    );
    await seed.objectives.update(o.copyWith(status: ObjectiveStatus.completed));
    await open(tester, Routes.objective(o.id));
    expect(find.byType(DeadlineChip), findsNothing);
    expect(find.text('Overdue'), findsNothing);
  });
}
