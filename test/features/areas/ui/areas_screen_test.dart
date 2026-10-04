import 'package:drift/drift.dart' hide isNull, isNotNull, Column;
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:orbit/core/db/app_database.dart';

import '../../../helpers/pump_app.dart';

Future<List<String>> areaNames(AppDatabase db) async {
  final rows =
      await (db.select(db.areas)
            ..where((a) => a.deletedAt.isNull())
            ..orderBy([(a) => OrderingTerm(expression: a.sortOrder)]))
          .get();
  return rows.map((a) => a.name).toList();
}

Future<void> openNewAreaDialog(WidgetTester tester) async {
  await tester.tap(find.text('New area'));
  await tester.pumpAndSettle();
}

void main() {
  testApp('lists areas in sort order', (tester) async {
    await pumpApp(tester, location: '/plan/areas');
    final names = tester
        .widgetList<ListTile>(find.byType(ListTile))
        .map((t) => (t.title as Text).data)
        .toList();
    expect(names, ['Job', 'Personal', 'Sport', 'Uni']);
  });

  testApp('creates an area with a color', (tester) async {
    final app = await pumpApp(tester, location: '/plan/areas');
    await openNewAreaDialog(tester);
    await tester.enterText(find.byType(TextField), 'Family');
    await tester.tap(find.bySemanticsLabel('Color #E53935'));
    await tester.tap(find.text('Save'));
    await tester.pumpAndSettle();

    expect(await areaNames(app.db), [
      'Job',
      'Personal',
      'Sport',
      'Uni',
      'Family',
    ]);
    final family = await (app.db.select(
      app.db.areas,
    )..where((a) => a.name.equals('Family'))).getSingle();
    expect(family.color, '#E53935');
    expect(find.text('Family'), findsOneWidget);
  });

  testApp('empty name shows an error and saves nothing', (tester) async {
    final app = await pumpApp(tester, location: '/plan/areas');
    await openNewAreaDialog(tester);
    await tester.enterText(find.byType(TextField), '   ');
    await tester.tap(find.text('Save'));
    await tester.pumpAndSettle();

    expect(find.text('Enter a name'), findsOneWidget);
    expect(await areaNames(app.db), hasLength(4));
  });

  testApp('duplicate name shows an error and saves nothing', (tester) async {
    final app = await pumpApp(tester, location: '/plan/areas');
    await openNewAreaDialog(tester);
    await tester.enterText(find.byType(TextField), 'sport');
    await tester.tap(find.text('Save'));
    await tester.pumpAndSettle();

    expect(find.text('This name is already used'), findsOneWidget);
    expect(await areaNames(app.db), hasLength(4));
  });

  testApp('renames an area', (tester) async {
    final app = await pumpApp(tester, location: '/plan/areas');
    await tester.tap(find.text('Uni'));
    await tester.pumpAndSettle();
    await tester.enterText(find.byType(TextField), 'University');
    await tester.tap(find.text('Save'));
    await tester.pumpAndSettle();

    expect(await areaNames(app.db), ['Job', 'Personal', 'Sport', 'University']);
  });

  testApp('confirming delete removes the area', (tester) async {
    final app = await pumpApp(tester, location: '/plan/areas');
    await tester.tap(find.byTooltip('Delete Sport'));
    await tester.pumpAndSettle();
    expect(
      find.textContaining('keep existing without an area'),
      findsOneWidget,
    );
    await tester.tap(find.widgetWithText(FilledButton, 'Delete'));
    await tester.pumpAndSettle();

    expect(find.text('Sport'), findsNothing);
    expect(await areaNames(app.db), ['Job', 'Personal', 'Uni']);
  });

  testApp('cancelling delete keeps the area', (tester) async {
    final app = await pumpApp(tester, location: '/plan/areas');
    await tester.tap(find.byTooltip('Delete Sport'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Cancel'));
    await tester.pumpAndSettle();

    expect(find.text('Sport'), findsOneWidget);
    expect(await areaNames(app.db), hasLength(4));
  });
}
