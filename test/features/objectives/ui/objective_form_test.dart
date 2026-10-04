import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:orbit/core/db/app_database.dart';
import 'package:orbit/core/router/routes.dart';
import 'package:orbit/core/widgets/date_field.dart';

import '../../../helpers/pump_app.dart';
import '../../../helpers/seed.dart';
import '../../../helpers/test_db.dart';

Future<void> pickDay(WidgetTester tester, String label, String day) async {
  await tester.tap(find.widgetWithText(DateField, label));
  await tester.pumpAndSettle();
  await tester.tap(find.text(day));
  await tester.tap(find.text('OK'));
  await tester.pumpAndSettle();
}

Future<void> save(WidgetTester tester) async {
  await tester.tap(find.text('Save'));
  await tester.pumpAndSettle();
}

void main() {
  testApp('creates an active objective', (tester) async {
    final app = await pumpApp(tester, location: Routes.newObjective);
    await tester.enterText(
      find.widgetWithText(TextFormField, 'Title'),
      'Get fit',
    );
    await pickDay(tester, 'Start date', '1');
    await pickDay(tester, 'End date', '28');
    await save(tester);

    final objectives = await app.db.select(app.db.objectives).get();
    expect(objectives.single.title, 'Get fit');
    expect(objectives.single.status, ObjectiveStatus.active);
    expect(objectives.single.startDate.day, 1);
    expect(objectives.single.endDate.day, 28);
  });

  testApp('missing title is not saved', (tester) async {
    final app = await pumpApp(tester, location: Routes.newObjective);
    await pickDay(tester, 'Start date', '1');
    await pickDay(tester, 'End date', '28');
    await save(tester);

    expect(find.text('Enter a title'), findsOneWidget);
    expect(await app.db.select(app.db.objectives).get(), isEmpty);
  });

  testApp('missing dates are not saved', (tester) async {
    final app = await pumpApp(tester, location: Routes.newObjective);
    await tester.enterText(
      find.widgetWithText(TextFormField, 'Title'),
      'Get fit',
    );
    await save(tester);

    expect(find.text('Pick a start date'), findsOneWidget);
    expect(find.text('Pick an end date'), findsOneWidget);
    expect(await app.db.select(app.db.objectives).get(), isEmpty);
  });

  testApp('end before start is not saved', (tester) async {
    final db = newTestDatabase();
    final o = await Seed(db).objective();
    await pumpApp(tester, db: db, location: Routes.objective(o.id));
    expect(find.text('01-10-2026'), findsOneWidget);
    expect(find.text('31-12-2026'), findsOneWidget);

    // End date picker opens on December 2026; go back to September.
    await tester.tap(find.widgetWithText(DateField, 'End date'));
    await tester.pumpAndSettle();
    for (var i = 0; i < 3; i++) {
      await tester.tap(find.byTooltip('Previous month'));
      await tester.pumpAndSettle();
    }
    await tester.tap(find.text('15'));
    await tester.tap(find.text('OK'));
    await tester.pumpAndSettle();
    await save(tester);

    expect(
      find.text('The end date must not be before the start date'),
      findsOneWidget,
    );
    final stored = await Seed(db).objectives.get(o.id);
    expect(stored!.endDate, CalendarDate(2026, 12, 31));
  });

  testApp('delete confirmation names the number of key results', (
    tester,
  ) async {
    final db = newTestDatabase();
    final seed = Seed(db);
    final o = await seed.objective();
    for (var i = 0; i < 3; i++) {
      await seed.kr(o.id, title: 'KR $i');
    }
    await pumpApp(tester, db: db, location: Routes.objective(o.id));

    await tester.tap(find.byTooltip('Delete objective'));
    await tester.pumpAndSettle();
    expect(
      find.textContaining('"Get fit" and its 3 key results'),
      findsOneWidget,
    );

    await tester.tap(find.widgetWithText(FilledButton, 'Delete'));
    await tester.pumpAndSettle();
    expect(await seed.objectives.get(o.id), isNull);
    expect(await seed.objectives.countKeyResults(o.id), 0);
  });

  testApp('cancelling delete keeps the objective', (tester) async {
    final db = newTestDatabase();
    final seed = Seed(db);
    final o = await seed.objective();
    await pumpApp(tester, db: db, location: Routes.objective(o.id));

    await tester.tap(find.byTooltip('Delete objective'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Cancel'));
    await tester.pumpAndSettle();
    expect(await seed.objectives.get(o.id), isNotNull);
  });

  testApp('editing can complete an objective', (tester) async {
    final db = newTestDatabase();
    final seed = Seed(db);
    final o = await seed.objective();
    await pumpApp(tester, db: db, location: Routes.objective(o.id));

    await tester.tap(find.text('Completed'));
    await save(tester);
    expect(
      (await seed.objectives.get(o.id))!.status,
      ObjectiveStatus.completed,
    );
  });
}
