import 'package:flutter_test/flutter_test.dart';
import 'package:orbit/core/db/app_database.dart';
import 'package:orbit/features/tasks/domain/task_assignment.dart';
import 'package:orbit/features/timer/data/timer_repository.dart';

import '../../../helpers/repos.dart';
import '../../../helpers/test_db.dart';

void main() {
  late Repos r;
  late DateTime now;
  late TimerRepository timers;

  setUp(() {
    r = Repos();
    now = DateTime.utc(2026, 10, 7, 9);
    timers = TimerRepository(r.db, () => now, TestIds().call);
  });
  tearDown(() => r.close());

  Future<List<LogEntry>> entries() =>
      (r.db.select(r.db.logEntries)..where((e) => e.deletedAt.isNull())).get();

  void wait(Duration duration) => now = now.add(duration);

  test('start records the target and the start time', () async {
    final p = await r.projects.create(title: 'Thesis');
    await timers.start(TimerForProject(p.id));
    final running = (await timers.running())!;
    expect(running.id, timerId);
    expect(running.projectId, p.id);
    expect(running.taskId, isNull);
    expect(running.startedAt, now);
  });

  test('stop logs the elapsed minutes at the start time', () async {
    final p = await r.projects.create(title: 'Thesis');
    await timers.start(TimerForProject(p.id));
    final started = now;
    wait(const Duration(minutes: 45, seconds: 30));
    final entry = (await timers.stop())!;

    expect(entry.projectId, p.id);
    expect(entry.durationMinutes, 45);
    expect(entry.occurredAt, started);
    expect(entry.source, LogSource.timer);
    expect(await timers.running(), isNull);
  });

  test('a very short timer logs 1 minute', () async {
    final p = await r.projects.create(title: 'Thesis');
    await timers.start(TimerForProject(p.id));
    wait(const Duration(seconds: 20));
    expect((await timers.stop())!.durationMinutes, 1);
  });

  test('a task timer logs on the task and its KR', () async {
    final o = await r.objective();
    final kr = await r.numericKr(o.id);
    final task = await r.tasks.create(
      title: 'Book physio',
      assignment: ForKeyResult(kr.id),
    );
    await timers.start(TimerForTask(task.id));
    wait(const Duration(minutes: 10));
    final entry = (await timers.stop())!;
    expect(entry.taskId, task.id);
    expect(entry.keyResultId, kr.id);
    expect(entry.projectId, isNull);
  });

  test('a project task timer logs on the task and its project', () async {
    final p = await r.projects.create(title: 'Wedding');
    final task = await r.tasks.create(projectId: p.id, title: 'Book venue');
    await timers.start(TimerForTask(task.id));
    final entry = (await timers.stop())!;
    expect(entry.taskId, task.id);
    expect(entry.projectId, p.id);
  });

  test('starting another timer stops and logs the running one', () async {
    final thesis = await r.projects.create(title: 'Thesis');
    final garden = await r.projects.create(title: 'Garden');
    await timers.start(TimerForProject(thesis.id));
    wait(const Duration(minutes: 30));
    await timers.start(TimerForProject(garden.id));

    final logged = await entries();
    expect(logged.single.projectId, thesis.id);
    expect(logged.single.durationMinutes, 30);
    final running = (await timers.running())!;
    expect(running.projectId, garden.id);
    expect(running.startedAt, now);
    expect(await r.db.select(r.db.timers).get(), hasLength(1));
  });

  test('discard ends the timer without a log entry', () async {
    final p = await r.projects.create(title: 'Thesis');
    await timers.start(TimerForProject(p.id));
    wait(const Duration(minutes: 5));
    await timers.discard();
    expect(await timers.running(), isNull);
    expect(await entries(), isEmpty);
  });

  test('a timer can start again after stopping', () async {
    final p = await r.projects.create(title: 'Thesis');
    await timers.start(TimerForProject(p.id));
    wait(const Duration(minutes: 5));
    await timers.stop();
    wait(const Duration(minutes: 5));
    await timers.start(TimerForProject(p.id));
    final running = (await timers.running())!;
    expect(running.startedAt, now);
    expect(running.deletedAt, isNull);
  });

  test('stop without a running timer does nothing', () async {
    expect(await timers.stop(), isNull);
    expect(await entries(), isEmpty);
  });
}
