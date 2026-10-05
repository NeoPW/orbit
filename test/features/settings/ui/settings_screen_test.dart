import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:orbit/core/db/app_database.dart';
import 'package:orbit/core/notifications/notification_scheduler.dart';
import 'package:orbit/core/router/routes.dart';
import 'package:orbit/features/settings/domain/app_settings.dart';

import '../../../helpers/fake_scheduler.dart';
import '../../../helpers/pump_app.dart';
import '../../../helpers/test_db.dart';

void main() {
  late AppDatabase db;
  setUp(() => db = newTestDatabase());

  // A one-off query: stream queries do not complete in widget tests.
  Future<AppSettings> stored() async => AppSettings.fromStored({
    for (final row in await db.select(db.settings).get()) row.key: row.value,
  });

  Future<void> pumpSettings(
    WidgetTester tester, {
    FakeNotificationScheduler? scheduler,
  }) => pumpApp(
    tester,
    db: db,
    location: Routes.settings,
    overrides: [
      notificationSchedulerProvider.overrideWithValue(
        scheduler ?? FakeNotificationScheduler(),
      ),
    ],
  );

  Finder leadField() => find.widgetWithText(TextField, 'Deadline lead time');

  testApp('shows the defaults', (tester) async {
    await pumpSettings(tester);

    final reminders = tester.widget<SwitchListTile>(
      find.widgetWithText(SwitchListTile, 'Reminders'),
    );
    expect(reminders.value, isTrue);
    expect(find.text('08:00'), findsOneWidget);
    expect(tester.widget<TextField>(leadField()).controller!.text, '7');
  });

  testApp('switching reminders off stores it', (tester) async {
    await pumpSettings(tester);
    await tester.tap(find.byType(SwitchListTile));
    await tester.pumpAndSettle();
    expect((await stored()).remindersEnabled, isFalse);
  });

  testApp('picking 07:15 as default reminder time', (tester) async {
    await pumpSettings(tester);
    await tester.tap(find.text('Default reminder time'));
    await tester.pumpAndSettle();
    // Switch the picker to text input and type the time.
    await tester.tap(find.byIcon(Icons.keyboard_outlined));
    await tester.pumpAndSettle();
    final fields = find.descendant(
      of: find.byType(Dialog),
      matching: find.byType(TextField),
    );
    await tester.enterText(fields.at(0), '07');
    await tester.enterText(fields.at(1), '15');
    await tester.tap(find.text('OK'));
    await tester.pumpAndSettle();

    expect(find.text('07:15'), findsOneWidget);
    expect((await stored()).defaultReminderTime, (hour: 7, minute: 15));
  });

  testApp('a valid lead time is saved', (tester) async {
    await pumpSettings(tester);
    await tester.enterText(leadField(), '3');
    await tester.pumpAndSettle();
    expect((await stored()).deadlineLeadDays, 3);
  });

  testApp('lead times 0 and 31 show an error and are not saved', (
    tester,
  ) async {
    await pumpSettings(tester);
    for (final value in ['0', '31']) {
      await tester.enterText(leadField(), value);
      await tester.pumpAndSettle();
      expect(find.text('Enter 1 to 30 days'), findsOneWidget);
    }
    expect((await stored()).deadlineLeadDays, 7);
  });

  testApp('without reminder support says they are Android only', (
    tester,
  ) async {
    await pumpSettings(
      tester,
      scheduler: FakeNotificationScheduler(supported: false),
    );
    expect(
      find.text('Reminders are only available on Android'),
      findsOneWidget,
    );
    expect(find.byType(SwitchListTile), findsNothing);
    expect(leadField(), findsOneWidget);
  });

  testApp('blocked notifications are pointed out', (tester) async {
    await pumpSettings(
      tester,
      scheduler: FakeNotificationScheduler(allowed: false),
    );
    expect(find.text('Blocked in Android settings'), findsOneWidget);
  });

  testApp('review day and time default to Sunday 18:00', (tester) async {
    await pumpSettings(tester);
    expect(find.text('Sunday'), findsOneWidget);
    expect(find.text('18:00'), findsOneWidget);
  });

  testApp('choosing Saturday 10:00 for the review', (tester) async {
    await pumpSettings(tester);
    await tester.tap(find.text('Sunday'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Saturday').last);
    await tester.pumpAndSettle();

    await tester.tap(find.text('Review time'));
    await tester.pumpAndSettle();
    await tester.tap(find.byIcon(Icons.keyboard_outlined));
    await tester.pumpAndSettle();
    final fields = find.descendant(
      of: find.byType(Dialog),
      matching: find.byType(TextField),
    );
    await tester.enterText(fields.at(0), '10');
    await tester.enterText(fields.at(1), '00');
    await tester.tap(find.text('OK'));
    await tester.pumpAndSettle();

    expect(find.text('Saturday'), findsOneWidget);
    expect(find.text('10:00'), findsOneWidget);
    final settings = await stored();
    expect(settings.reviewDay, DateTime.saturday);
    expect(settings.reviewTime, (hour: 10, minute: 0));
  });
}
