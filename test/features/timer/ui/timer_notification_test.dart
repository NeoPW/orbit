import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:orbit/app.dart';
import 'package:orbit/core/db/app_database.dart';
import 'package:orbit/core/notifications/notification_scheduler.dart';
import 'package:orbit/core/router/routes.dart';
import 'package:orbit/features/reminders/data/reminder_sync.dart';
import 'package:orbit/features/settings/data/settings_repository.dart';
import 'package:orbit/features/timer/data/timer_repository.dart';

import '../../../helpers/fake_scheduler.dart';
import '../../../helpers/pump_app.dart';
import '../../../helpers/seed.dart';
import '../../../helpers/test_db.dart';

void main() {
  late AppDatabase db;
  late Seed seed;
  late FakeNotificationScheduler scheduler;
  late TimerRepository timers;
  final start = DateTime.utc(2026, 10, 7, 9);

  setUp(() {
    db = newTestDatabase();
    seed = Seed(db);
    scheduler = FakeNotificationScheduler();
    timers = TimerRepository(db, () => start, TestIds().call);
  });

  Future<void> pump(WidgetTester tester, {String location = Routes.home}) =>
      pumpApp(
        tester,
        db: db,
        location: location,
        overrides: [notificationSchedulerProvider.overrideWithValue(scheduler)],
      );

  Future<void> settle(WidgetTester tester) async {
    await tester.pumpAndSettle();
    // The scope applies changes after the frame.
    await tester.pump();
  }

  testApp('a running timer shows the notification with its title', (
    tester,
  ) async {
    final p = await seed.projects.create(title: 'Thesis');
    await pump(tester);
    expect(scheduler.timer, isNull);

    await timers.start(TimerForProject(p.id));
    await settle(tester);
    expect(scheduler.timer, (title: 'Thesis', startedAt: start));
  });

  testApp('stopping the timer removes the notification', (tester) async {
    final p = await seed.projects.create(title: 'Thesis');
    await timers.start(TimerForProject(p.id));
    await pump(tester);
    await settle(tester);
    expect(scheduler.timer, isNotNull);

    await timers.stop();
    await settle(tester);
    expect(scheduler.timer, isNull);
  });

  testApp('it is shown with reminders switched off', (tester) async {
    await SettingsRepository(db).setRemindersEnabled(false);
    final p = await seed.projects.create(title: 'Thesis');
    await timers.start(TimerForProject(p.id));
    await pump(tester);
    await settle(tester);
    expect(scheduler.timer?.title, 'Thesis');
  });

  testApp('rescheduling reminders keeps it', (tester) async {
    final p = await seed.projects.create(title: 'Thesis');
    await timers.start(TimerForProject(p.id));
    await pump(tester);
    await settle(tester);
    final shows = scheduler.timerShows;

    // A change that re-plans the reminders.
    await seed.habits.create(
      title: 'Stretch',
      scheduleType: ScheduleType.daily,
    );
    await tester.pump(ReminderSync.debounce * 2);
    await settle(tester);
    expect(scheduler.calls, isNotEmpty);
    expect(scheduler.timer?.title, 'Thesis');
    expect(scheduler.timerShows, shows);
  });

  testApp('tapping it opens Home', (tester) async {
    await pump(tester, location: Routes.plan);
    ProviderScope.containerOf(tester.element(find.byType(OrbitApp)))
        .read(notificationTapProvider.notifier)
        .tapped('/home');
    await tester.pumpAndSettle();
    expect(find.text('Habits due today'), findsOneWidget);
  });

  testApp('without permission it asks once when a timer runs', (
    tester,
  ) async {
    await SettingsRepository(db).setRemindersEnabled(false);
    scheduler.allowed = false;
    final p = await seed.projects.create(title: 'Thesis');
    await pump(tester);
    expect(scheduler.permissionRequests, 0);

    await timers.start(TimerForProject(p.id));
    await settle(tester);
    await timers.stop();
    await settle(tester);
    await timers.start(TimerForProject(p.id));
    await settle(tester);
    expect(scheduler.permissionRequests, 1);
  });
}
