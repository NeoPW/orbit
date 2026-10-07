import 'package:flutter_test/flutter_test.dart';
import 'package:orbit/core/db/app_database.dart';
import 'package:orbit/features/review/domain/week_summary.dart';

import '../../../helpers/fixtures.dart';

/// The week of Monday 2026-10-05 to Sunday 2026-10-11.
final week = CalendarDate(2026, 10, 5);

DateTime local(int day, [int hour = 12]) => DateTime(2026, 10, day, hour);

void main() {
  group('reviewWeekStart', () {
    test('Sunday: the week ending today', () {
      expect(reviewWeekStart(CalendarDate(2026, 10, 11)), week);
    });
    test('Monday: the previous week', () {
      expect(reviewWeekStart(CalendarDate(2026, 10, 12)), week);
    });
    test('Saturday: the previous week', () {
      expect(
        reviewWeekStart(CalendarDate(2026, 10, 10)),
        CalendarDate(2026, 9, 28),
      );
    });
    test('across the new year', () {
      // Friday 2027-01-01: the week of Monday 2026-12-21.
      expect(
        reviewWeekStart(CalendarDate(2027, 1, 1)),
        CalendarDate(2026, 12, 21),
      );
    });
  });

  group('workPerProject', () {
    final projects = {
      'thesis': project('thesis', title: 'Thesis'),
      'garden': project('garden', title: 'Garden'),
    };

    test('count and total duration; entries without duration count', () {
      final work = workPerProject(
        [
          logEntry('1', projectId: 'thesis', at: local(5), minutes: 30),
          logEntry('2', projectId: 'thesis', at: local(6), minutes: 45),
          logEntry('3', projectId: 'thesis', at: local(7)),
        ],
        projects,
        week,
      );
      expect(work.single.title, 'Thesis');
      expect(work.single.count, 3);
      expect(work.single.minutes, 75);
    });

    test('entries without a project are "No project"', () {
      final work = workPerProject(
        [logEntry('1', at: local(5))],
        projects,
        week,
      );
      expect(work.single.projectId, isNull);
      expect(work.single.title, 'No project');
    });

    test('ordered by time, then count, then title', () {
      final work = workPerProject(
        [
          logEntry('1', projectId: 'garden', at: local(5), minutes: 20),
          logEntry('2', projectId: 'thesis', at: local(5), minutes: 60),
          logEntry('3', at: local(5), minutes: 20),
          logEntry('4', at: local(6)),
        ],
        projects,
        week,
      );
      expect(work.map((w) => w.title), ['Thesis', 'No project', 'Garden']);
    });

    test('entries just outside the week are not counted', () {
      final work = workPerProject(
        [
          logEntry('1', projectId: 'thesis', at: DateTime(2026, 10, 4, 23, 59)),
          logEntry('2', projectId: 'thesis', at: DateTime(2026, 10, 12, 0, 1)),
          logEntry(
            '3',
            projectId: 'thesis',
            at: DateTime(2026, 10, 11, 23, 59),
          ),
        ],
        projects,
        week,
      );
      expect(work.single.count, 1);
    });
  });

  group('habitAdherence', () {
    Habit created(Habit habit, DateTime at) =>
        habit.copyWith(createdAt: at.toUtc());

    test('daily: one per day', () {
      final result = habitAdherence(
        [created(habit('h'), DateTime(2026, 9, 1))],
        [habitCheck('h', CalendarDate(2026, 10, 5))],
        week,
      );
      expect((result.single.done, result.single.expected), (1, 7));
    });

    test('weekdays: 2 of 3', () {
      final result = habitAdherence(
        [
          created(
            habit(
              'h',
              scheduleType: ScheduleType.weekdays,
              weekdays: {1, 3, 5},
            ),
            DateTime(2026, 9, 1),
          ),
        ],
        [
          habitCheck('h', CalendarDate(2026, 10, 5)),
          habitCheck('h', CalendarDate(2026, 10, 9)),
        ],
        week,
      );
      expect((result.single.done, result.single.expected), (2, 3));
    });

    test('times per week: 4 of 3', () {
      final result = habitAdherence(
        [
          created(
            habit(
              'h',
              scheduleType: ScheduleType.timesPerWeek,
              timesPerWeek: 3,
            ),
            DateTime(2026, 9, 1),
          ),
        ],
        [
          for (var d = 5; d <= 8; d++)
            habitCheck('h', CalendarDate(2026, 10, d)),
        ],
        week,
      );
      expect((result.single.done, result.single.expected), (4, 3));
    });

    test('created mid-week: 4 of 4', () {
      final result = habitAdherence(
        [created(habit('h'), local(8, 9))],
        [
          for (var d = 8; d <= 11; d++)
            habitCheck('h', CalendarDate(2026, 10, d)),
        ],
        week,
      );
      expect((result.single.done, result.single.expected), (4, 4));
    });

    test('created after the week or inactive: left out', () {
      final result = habitAdherence(
        [
          created(habit('later'), DateTime(2026, 10, 12, 9)),
          created(habit('off', active: false), DateTime(2026, 9, 1)),
        ],
        const [],
        week,
      );
      expect(result, isEmpty);
    });

    test('checks of other weeks do not count', () {
      final result = habitAdherence(
        [created(habit('h'), DateTime(2026, 9, 1))],
        [
          habitCheck('h', CalendarDate(2026, 10, 4)),
          habitCheck('h', CalendarDate(2026, 10, 12)),
        ],
        week,
      );
      expect(result.single.done, 0);
    });
  });

  group('completedTasksInWeek', () {
    Task done(String id, DateTime at) => task(
      id,
      title: id,
      projectId: 'p',
      status: TaskStatus.done,
    ).copyWith(completedAt: Value(at.toUtc()));

    test('local completion dates at the week edges, newest first', () {
      final tasks = completedTasksInWeek(
        [
          done('before', DateTime(2026, 10, 4, 23, 30)),
          done('first', DateTime(2026, 10, 5, 0, 30)),
          done('last', DateTime(2026, 10, 11, 23, 30)),
          done('after', DateTime(2026, 10, 12, 0, 30)),
          task('open', projectId: 'p'),
        ],
        {'p': project('p', title: 'Wedding')},
        week,
      );
      expect(tasks.map((t) => t.task.title), ['last', 'first']);
      expect(tasks.first.project!.title, 'Wedding');
    });
  });

  group('krProgressChanges', () {
    final objectives = [
      objective('o'),
      objective('old', status: ObjectiveStatus.completed),
    ];

    test('change since the previous snapshot in percentage points', () {
      final changes = krProgressChanges(
        [keyResult('kr', objectiveId: 'o', current: 55)],
        objectives,
        const {},
        {'kr': 0.40},
      );
      expect(changes.single.progress, 0.55);
      expect(changes.single.change, 15);
    });

    test('no earlier snapshot: no change', () {
      final changes = krProgressChanges(
        [keyResult('kr', objectiveId: 'o', current: 55)],
        objectives,
        const {},
        const {},
      );
      expect(changes.single.change, isNull);
    });

    test('KRs of non-active objectives are left out', () {
      final changes = krProgressChanges(
        [keyResult('kr', objectiveId: 'old')],
        objectives,
        const {},
        const {},
      );
      expect(changes, isEmpty);
    });
  });

  test('buildWeekSummary combines all parts', () {
    final summary = buildWeekSummary(
      weekStart: week,
      entries: [logEntry('1', projectId: 'p', at: local(6), minutes: 30)],
      habits: [habit('h').copyWith(createdAt: DateTime.utc(2026, 9, 1))],
      checks: [habitCheck('h', CalendarDate(2026, 10, 6))],
      completedTasks: [
        task(
          't',
          projectId: 'p',
          status: TaskStatus.done,
        ).copyWith(completedAt: Value(local(7).toUtc())),
      ],
      projects: [project('p', title: 'Thesis')],
      keyResults: [keyResult('kr', objectiveId: 'o', current: 20)],
      objectives: [objective('o')],
      habitCheckIns: const {},
      previousSnapshots: {'kr': 0.1},
    );
    expect(summary.weekStart, week);
    expect(summary.work.single.title, 'Thesis');
    expect(summary.habits.single.done, 1);
    expect(summary.tasks.single.task.id, 't');
    expect(summary.keyResults.single.change, 10);
  });

  group('snapshotProgressChanges', () {
    test('uses the stored progress in KR order with the change', () {
      final a = keyResult('a', objectiveId: 'o', sortOrder: 0);
      final b = keyResult('b', objectiveId: 'o', sortOrder: 1);
      final changes = snapshotProgressChanges([a, b], {'b': 0.5, 'a': 0.4}, {
        'a': 0.25,
      });
      expect(changes.map((c) => c.keyResult.id), ['a', 'b']);
      expect(changes.map((c) => c.progress), [0.4, 0.5]);
      expect(changes.map((c) => c.change), [15, null]);
    });

    test('KRs without a snapshot are left out', () {
      final changes = snapshotProgressChanges(
        [keyResult('a', objectiveId: 'o')],
        {'deleted': 0.3},
        const {},
      );
      expect(changes, isEmpty);
    });
  });
}
