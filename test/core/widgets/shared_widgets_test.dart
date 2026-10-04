import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:orbit/core/time/calendar_date.dart';
import 'package:orbit/core/widgets/area_dot.dart';
import 'package:orbit/core/widgets/confirm_delete.dart';
import 'package:orbit/core/widgets/date_field.dart';
import 'package:orbit/core/widgets/max_width_body.dart';

Widget _host(Widget child) => MaterialApp(home: Scaffold(body: child));

void main() {
  group('confirmDelete', () {
    Future<bool?> run(WidgetTester tester, String button) async {
      bool? result;
      await tester.pumpWidget(
        _host(
          Builder(
            builder: (context) => TextButton(
              onPressed: () async => result = await confirmDelete(
                context,
                title: 'Delete area?',
                message: 'Projects keep existing without an area.',
              ),
              child: const Text('open'),
            ),
          ),
        ),
      );
      await tester.tap(find.text('open'));
      await tester.pumpAndSettle();
      expect(find.text('Delete area?'), findsOneWidget);
      await tester.tap(find.text(button));
      await tester.pumpAndSettle();
      return result;
    }

    testWidgets('cancel returns false', (tester) async {
      expect(await run(tester, 'Cancel'), isFalse);
    });

    testWidgets('confirm returns true', (tester) async {
      expect(await run(tester, 'Delete'), isTrue);
    });
  });

  group('DateField', () {
    testWidgets('shows the value as dd-mm-yyyy', (tester) async {
      await tester.pumpWidget(
        _host(
          DateField(
            label: 'Deadline',
            value: CalendarDate(2026, 3, 5),
            onChanged: (_) {},
          ),
        ),
      );
      expect(find.text('05-03-2026'), findsOneWidget);
    });

    testWidgets('picking 15-11-2026 shows 15-11-2026', (tester) async {
      CalendarDate? value = CalendarDate(2026, 11, 1);
      await tester.pumpWidget(
        _host(
          StatefulBuilder(
            builder: (context, setState) => DateField(
              label: 'Deadline',
              value: value,
              onChanged: (v) => setState(() => value = v),
            ),
          ),
        ),
      );

      await tester.tap(find.byType(DateField));
      await tester.pumpAndSettle();
      // Calendar only: no switch to the locale-dependent text input.
      expect(find.byIcon(Icons.edit_outlined), findsNothing);
      await tester.tap(find.text('15'));
      await tester.tap(find.text('OK'));
      await tester.pumpAndSettle();

      expect(value, CalendarDate(2026, 11, 15));
      expect(find.text('15-11-2026'), findsOneWidget);
    });

    testWidgets('clear button resets an optional date', (tester) async {
      CalendarDate? value = CalendarDate(2026, 11, 1);
      await tester.pumpWidget(
        _host(
          StatefulBuilder(
            builder: (context, setState) => DateField(
              label: 'Deadline',
              value: value,
              clearable: true,
              onChanged: (v) => setState(() => value = v),
            ),
          ),
        ),
      );
      await tester.tap(find.byTooltip('Clear Deadline'));
      await tester.pump();
      expect(value, isNull);
      expect(find.text('01-11-2026'), findsNothing);
    });
  });

  testWidgets('MaxWidthBody limits width to 840 px', (tester) async {
    tester.view.physicalSize = const Size(1600, 900);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.reset);
    const key = Key('content');
    await tester.pumpWidget(
      _host(
        const MaxWidthBody(child: SizedBox(key: key, width: 2000, height: 10)),
      ),
    );
    expect(tester.getSize(find.byKey(key)).width, 840);
    expect(tester.getCenter(find.byKey(key)).dx, 800);
  });

  test('colorFromHex parses #RRGGBB as opaque', () {
    expect(colorFromHex('#1E88E5'), const Color(0xFF1E88E5));
  });
}
