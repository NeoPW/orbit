import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:orbit/core/db/app_database.dart';
import 'package:orbit/core/notifications/notification_scheduler.dart';
import 'package:orbit/core/notifications/planned_reminder.dart';
import 'package:orbit/core/time/clock.dart';
import 'package:orbit/features/reminders/data/reminder_sync.dart';
import 'package:orbit/features/settings/data/settings_repository.dart';

import '../../../helpers/fake_scheduler.dart';
import '../../../helpers/provider_container.dart';
import '../../../helpers/repos.dart';

void main() {
  // ReminderSync listens to the app lifecycle.
  TestWidgetsFlutterBinding.ensureInitialized();

  late Repos r;
  late FakeNotificationScheduler scheduler;
  late ProviderContainer container;
  // Monday 2026-10-05, 06:00 local.
  final now = DateTime(2026, 10, 5, 6);

  setUp(() {
    r = Repos();
    scheduler = FakeNotificationScheduler();
    container = containerWith(
      r.db,
      overrides: [
        clockProvider.overrideWithValue(() => now.toUtc()),
        notificationSchedulerProvider.overrideWithValue(scheduler),
      ],
    );
    container.listen(reminderSyncProvider, (_, _) {});
  });
  tearDown(() async {
    container.dispose();
    await r.close();
  });

  /// Lets the debounce run out and the scheduler be called.
  Future<void> settle() => Future<void>.delayed(ReminderSync.debounce * 2);

  test('checking a habit removes today\'s reminder', () async {
    final habit = await r.habits.create(
      title: 'Stretch',
      scheduleType: ScheduleType.daily,
    );
    await settle();
    expect(scheduler.scheduled!.first.at, DateTime(2026, 10, 5, 8));

    await r.habitChecks.check(habit, CalendarDate(2026, 10, 5));
    await settle();
    expect(scheduler.scheduled!.first.at, DateTime(2026, 10, 6, 8));
  });

  test('switching reminders off sends an empty list', () async {
    await r.habits.create(title: 'Stretch', scheduleType: ScheduleType.daily);
    await settle();
    expect(scheduler.scheduled, isNotEmpty);

    await SettingsRepository(r.db).setRemindersEnabled(false);
    await settle();
    expect(scheduler.scheduled, isEmpty);
  });

  test('a burst of writes schedules once', () async {
    await settle();
    final before = scheduler.calls.length;
    for (final title in ['A', 'B', 'C']) {
      await r.habits.create(title: title, scheduleType: ScheduleType.daily);
    }
    await settle();
    expect(scheduler.calls.length, before + 1);
    expect(scheduler.scheduled!.where((x) => x.at.day == 5), hasLength(3));
  });

  test('an unchanged plan is not sent again', () async {
    final p = await r.projects.create(title: 'Thesis');
    await settle();
    final before = scheduler.calls.length;

    // Not part of any reminder.
    await r.projects.save(p.copyWith(description: 'Chapters'), nextStep: '');
    await settle();
    expect(scheduler.calls.length, before);
  });

  test('completing the week\'s review removes its reminder', () async {
    await settle();
    bool hasReview() => scheduler.scheduled!.any(
      (x) =>
          x.kind == ReminderKind.review && x.at == DateTime(2026, 10, 11, 18),
    );
    expect(hasReview(), isTrue);

    await r.reviews.complete(
      CalendarDate(2026, 10, 5),
      score: 7,
      snapshots: const {},
    );
    await settle();
    expect(hasReview(), isFalse);
  });
}
