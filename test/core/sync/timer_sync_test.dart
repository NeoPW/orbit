import 'package:flutter_test/flutter_test.dart';
import 'package:orbit/core/db/app_database.dart';
import 'package:orbit/core/db/ids.dart';
import 'package:orbit/features/timer/data/timer_repository.dart';

import '../../helpers/fake_remote_store.dart';
import '../../helpers/sync_device.dart';

/// The work timer between two devices (work-timer spec, "Timer across
/// devices"; sync spec, "One record per natural key").
void main() {
  late FakeRemoteStore remote;
  late SyncDevice phone;
  late SyncDevice browser;
  late TimerRepository phoneTimer;
  late TimerRepository browserTimer;

  setUp(() async {
    remote = FakeRemoteStore();
    final start = DateTime.now().toUtc();
    phone = SyncDevice(remote, start: start);
    browser = SyncDevice(remote, start: start);
    await phone.signIn();
    await browser.signIn();
    phoneTimer = TimerRepository(phone.db, phone.clock, uuidV4);
    browserTimer = TimerRepository(browser.db, browser.clock, uuidV4);
  });
  tearDown(() async {
    await phone.close();
    await browser.close();
  });

  Future<List<LogEntry>> entries(SyncDevice device) => (device.db.select(
    device.db.logEntries,
  )..where((e) => e.deletedAt.isNull())).get();

  test('a timer started on the phone runs in the browser', () async {
    final p = await phone.projects.create(title: 'Thesis');
    final started = await phoneTimer.start(TimerForProject(p.id));
    await phone.sync();
    await browser.sync();

    final running = (await browserTimer.running())!;
    expect(running.projectId, p.id);
    expect(running.startedAt, started.startedAt);
  });

  test('stopping in the browser ends it on the phone too', () async {
    final p = await phone.projects.create(title: 'Thesis');
    await phoneTimer.start(TimerForProject(p.id));
    await phone.sync();
    await browser.sync();

    browser.now = browser.now.add(const Duration(minutes: 30));
    final entry = (await browserTimer.stop())!;
    expect(entry.durationMinutes, 30);
    await browser.sync();
    await phone.sync();

    expect(await phoneTimer.running(), isNull);
    expect((await entries(phone)).single.id, entry.id);
  });

  test('when both devices start one, the later start wins', () async {
    final thesis = await phone.projects.create(title: 'Thesis');
    final garden = await phone.projects.create(title: 'Garden');
    await phone.sync();
    await browser.sync();

    await phoneTimer.start(TimerForProject(thesis.id));
    browser.now = phone.now.add(const Duration(minutes: 5));
    await browserTimer.start(TimerForProject(garden.id));

    await phone.sync();
    await browser.sync();
    await phone.sync();

    for (final timer in [phoneTimer, browserTimer]) {
      expect((await timer.running())!.projectId, garden.id);
    }
    expect(remote.rows('timers'), hasLength(1));
    // The earlier timer ended without a log entry.
    expect(await entries(phone), isEmpty);
    expect(await entries(browser), isEmpty);
  });

  test('the timer has the same ID on every device', () async {
    final p = await phone.projects.create(title: 'Thesis');
    final a = await phoneTimer.start(TimerForProject(p.id));
    final b = await browserTimer.start(TimerForProject(p.id));
    expect(a.id, b.id);
    expect(a.id, naturalKeyId('timer'));
  });
}
