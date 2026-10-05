import 'package:flutter_test/flutter_test.dart';
import 'package:orbit/core/db/app_database.dart';
import 'package:orbit/core/sync/sync_state.dart';

import '../../helpers/fake_remote_store.dart';
import '../../helpers/sync_device.dart';

void main() {
  late FakeRemoteStore remote;
  late SyncDevice phone;
  late SyncDevice browser;

  setUp(() async {
    remote = FakeRemoteStore();
    phone = SyncDevice(remote);
    browser = SyncDevice(remote);
    await phone.signIn();
    await browser.signIn();
  });
  tearDown(() async {
    await phone.close();
    await browser.close();
  });

  Map<String, Object?> remoteProject(String id) =>
      remote.rows('projects').singleWhere((r) => r['id'] == id);

  group('push', () {
    test('uploads a new and then an edited row', () async {
      final p = await phone.projects.create(title: 'Thesis');
      await phone.engine.push();
      expect(remoteProject(p.id)['title'], 'Thesis');

      await phone.projects.save(p.copyWith(title: 'Thesis v2'), nextStep: '');
      await phone.engine.push();
      expect(remoteProject(p.id)['title'], 'Thesis v2');
    });

    test('uploads a soft delete', () async {
      final p = await phone.projects.create(title: 'Thesis');
      await phone.engine.push();
      await phone.projects.delete(p.id);
      await phone.engine.push();
      expect(remoteProject(p.id)['deleted_at'], isNotNull);
    });

    test('a failing upload keeps the watermark; nothing is lost', () async {
      final p = await phone.projects.create(title: 'Thesis');
      remote.failUpsertFor = 'projects';
      await expectLater(phone.engine.push(), throwsStateError);
      expect(await phone.engine.state.read(SyncKeys.lastPushedAt), isNull);

      remote.failUpsertFor = null;
      await phone.engine.push();
      expect(remoteProject(p.id)['title'], 'Thesis');
    });

    test('unchanged rows are not uploaded again', () async {
      await phone.projects.create(title: 'Thesis');
      await phone.engine.push();
      final calls = remote.upsertCalls;
      await phone.engine.push();
      expect(remote.upsertCalls, calls);
    });
  });

  group('two devices', () {
    test('an edit on one device appears on the other', () async {
      final p = await phone.projects.create(title: 'Thesis');
      await phone.sync();
      await browser.sync();
      expect((await browser.projects.get(p.id))!.title, 'Thesis');

      await phone.projects.save(p.copyWith(title: 'Thesis v2'), nextStep: '');
      await phone.sync();
      await browser.sync();
      expect((await browser.projects.get(p.id))!.title, 'Thesis v2');
    });

    test('a delete propagates', () async {
      final p = await phone.projects.create(title: 'Thesis');
      final t = await phone.tasks.create(projectId: p.id, title: 'Draft');
      await phone.sync();
      await browser.sync();
      expect(await browser.tasks.get(t.id), isNotNull);

      await browser.tasks.delete(t.id);
      await browser.sync();
      await phone.sync();
      expect(await phone.tasks.get(t.id), isNull);
    });

    Future<String> sharedProject() async {
      final p = await phone.projects.create(title: 'Thesis');
      await phone.sync();
      await browser.sync();
      return p.id;
    }

    Future<void> concurrentEdits(String id) async {
      // The browser's edit is five minutes later.
      final base = DateTime.now().toUtc().add(const Duration(hours: 1));
      phone.now = base;
      browser.now = base.add(const Duration(minutes: 5));
      final onPhone = (await phone.projects.get(id))!;
      await phone.projects.save(onPhone.copyWith(title: 'Phone'), nextStep: '');
      final onBrowser = (await browser.projects.get(id))!;
      await browser.projects.save(
        onBrowser.copyWith(title: 'Browser'),
        nextStep: '',
      );
    }

    test('last write wins when the older edit syncs last', () async {
      final id = await sharedProject();
      await concurrentEdits(id);
      await browser.sync();
      await phone.sync();
      await browser.sync();
      expect((await phone.projects.get(id))!.title, 'Browser');
      expect((await browser.projects.get(id))!.title, 'Browser');
      expect(remoteProject(id)['title'], 'Browser');
    });

    test('last write wins when the older edit syncs first', () async {
      final id = await sharedProject();
      await concurrentEdits(id);
      await phone.sync();
      await browser.sync();
      await phone.sync();
      expect((await phone.projects.get(id))!.title, 'Browser');
      expect((await browser.projects.get(id))!.title, 'Browser');
    });

    test('the same habit checked on both devices is one record', () async {
      final habit = await phone.habits.create(
        title: 'Run',
        scheduleType: ScheduleType.daily,
      );
      await phone.sync();
      await browser.sync();
      final day = CalendarDate(2026, 10, 5);

      await phone.habitChecks.check(habit, day);
      await browser.habitChecks.check(habit, day);
      await phone.sync();
      await browser.sync();
      await phone.sync();

      for (final device in [phone, browser]) {
        final checks = await device.raw('habit_checks');
        expect(checks, hasLength(1));
        expect(checks.single['deleted_at'], isNull);
      }
      expect(remote.rows('habit_checks'), hasLength(1));
    });

    test('an older duplicate under another ID is replaced', () async {
      final habit = await phone.habits.create(
        title: 'Run',
        scheduleType: ScheduleType.daily,
      );
      await phone.sync();
      await browser.sync();
      // A check made before IDs were derived from habit and date.
      await phone.db.customStatement(
        "INSERT INTO habit_checks (id, created_at, updated_at, habit_id, date) "
        "VALUES ('legacy', '2026-10-05T08:00:00.000Z', "
        "'2026-10-05T08:00:00.000Z', '${habit.id}', '2026-10-05')",
      );
      await browser.habitChecks.check(habit, CalendarDate(2026, 10, 5));
      await browser.sync();
      await phone.engine.pull();

      final checks = await phone.raw('habit_checks');
      expect(checks, hasLength(1));
      expect(checks.single['id'], isNot('legacy'));
    });

    test('settings stay on each device', () async {
      await phone.settings.setDeadlineLeadDays(3);
      await phone.sync();
      await browser.sync();
      expect((await browser.settings.watch().first).deadlineLeadDays, 7);
    });
  });

  group('service', () {
    test('one sync at a time', () async {
      final first = phone.service.sync();
      final second = phone.service.sync();
      expect(identical(first, second), isTrue);
      expect(phone.service.isRunning, isTrue);
      await first;
      expect(phone.service.isRunning, isFalse);
    });

    test('a failure is stored, not thrown', () async {
      remote.failWith = Exception('offline');
      expect(await phone.sync(), isFalse);
      final status = await phone.engine.state.watch().first;
      expect(status.lastFailed, isTrue);
      expect(status.lastSuccessAt, isNull);
    });

    test('a success stores the time and clears the error', () async {
      remote.failWith = Exception('offline');
      await phone.sync();
      remote.failWith = null;
      expect(await phone.sync(), isTrue);
      final status = await phone.engine.state.watch().first;
      expect(status.lastFailed, isFalse);
      expect(status.lastSuccessAt, isNotNull);
    });

    test('nothing happens before the first sign-in', () async {
      final fresh = SyncDevice(remote);
      addTearDown(fresh.close);
      await fresh.projects.create(title: 'Local only');
      expect(await fresh.sync(), isFalse);
      expect(remote.rows('projects'), isEmpty);
    });
  });
}
