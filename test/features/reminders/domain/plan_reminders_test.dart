import 'package:flutter_test/flutter_test.dart';
import 'package:orbit/core/db/app_database.dart';
import 'package:orbit/core/notifications/planned_reminder.dart';
import 'package:orbit/features/home/domain/upcoming_deadlines.dart';
import 'package:orbit/features/reminders/domain/plan_reminders.dart';
import 'package:orbit/features/settings/domain/app_settings.dart';

import '../../../helpers/fixtures.dart';

/// Monday 2026-10-05, 06:00 local.
final monday = DateTime(2026, 10, 5, 6);

/// Plans reminders; review reminders are left out unless [withReviews].
List<PlannedReminder> plan({
  AppSettings settings = const AppSettings(),
  List<Habit> habits = const [],
  List<HabitCheck> checks = const [],
  List<Project> projects = const [],
  List<KeyResult> keyResults = const [],
  List<UpcomingDeadline> deadlines = const [],
  Set<CalendarDate> completedReviewWeeks = const {},
  DateTime? now,
  bool withReviews = false,
}) => [
  for (final reminder in planReminders(
    settings: settings,
    habits: habits,
    checks: checks,
    projects: {for (final p in projects) p.id: p},
    keyResults: {for (final k in keyResults) k.id: k},
    deadlines: deadlines,
    completedReviewWeeks: completedReviewWeeks,
    now: now ?? monday,
  ))
    if (withReviews || reminder.kind != ReminderKind.review) reminder,
];

List<DateTime> times(List<PlannedReminder> reminders) =>
    reminders.map((r) => r.at).toList();

List<UpcomingDeadline> candidates({
  List<({Task task, Project project})> tasks = const [],
  List<Task> outside = const [],
  List<Project> projects = const [],
  List<KeyResult> keyResults = const [],
  List<Objective> objectives = const [],
  required DateTime now,
}) => deadlineCandidates(
  tasks: tasks,
  tasksOutsideProjects: outside,
  projects: projects,
  keyResults: keyResults,
  objectives: objectives,
  habitCheckIns: const {},
  today: CalendarDate(now.year, now.month, now.day),
);

void main() {
  group('habit reminders', () {
    test('own reminder time on each of the next 14 days', () {
      final reminders = plan(
        habits: [
          habit(
            'h',
            title: 'Stretch',
          ).copyWith(reminderTime: const Value('07:30')),
        ],
      );
      expect(reminders, hasLength(14));
      expect(reminders.first.at, DateTime(2026, 10, 5, 7, 30));
      expect(reminders.last.at, DateTime(2026, 10, 18, 7, 30));
      expect(reminders.first.title, 'Stretch');
      expect(reminders.first.kind, ReminderKind.habit);
      expect(reminders.first.route, '/home');
    });

    test('without own time the default reminder time is used', () {
      final reminders = plan(
        settings: const AppSettings(defaultReminderTime: (hour: 7, minute: 15)),
        habits: [habit('h')],
      );
      expect(reminders.first.at, DateTime(2026, 10, 5, 7, 15));
    });

    test('not on days the habit is not due', () {
      final reminders = plan(
        habits: [
          habit('h', scheduleType: ScheduleType.weekdays, weekdays: {1, 3, 5}),
        ],
      );
      expect(reminders.map((r) => r.at.weekday).toSet(), {
        DateTime.monday,
        DateTime.wednesday,
        DateTime.friday,
      });
    });

    test('inactive habits get none', () {
      expect(plan(habits: [habit('h', active: false)]), isEmpty);
    });

    test('none for the rest of a week whose target is reached', () {
      final reminders = plan(
        habits: [
          habit('h', scheduleType: ScheduleType.timesPerWeek, timesPerWeek: 2),
        ],
        checks: [
          habitCheck('h', CalendarDate(2026, 10, 5)),
          habitCheck('h', CalendarDate(2026, 10, 6)),
        ],
        now: DateTime(2026, 10, 7, 6),
      );
      // Next reminder: Monday of the following week.
      expect(reminders.first.at, DateTime(2026, 10, 12, 8));
    });

    test('no reminder on a day that is already checked', () {
      final reminders = plan(
        habits: [habit('h')],
        checks: [habitCheck('h', CalendarDate(2026, 10, 5))],
      );
      expect(reminders.first.at, DateTime(2026, 10, 6, 8));
      expect(reminders, hasLength(13));
    });

    test('a reminder time that has passed today is skipped', () {
      final reminders = plan(
        habits: [habit('h').copyWith(reminderTime: const Value('07:30'))],
        now: DateTime(2026, 10, 5, 9),
      );
      expect(reminders.first.at, DateTime(2026, 10, 6, 7, 30));
    });

    test('labeled with the project, else the KR', () {
      final reminders = plan(
        habits: [
          habit('a', title: 'Run', projectId: 'p'),
          habit('b', title: 'Read', keyResultId: 'kr'),
          habit('c', title: 'Breathe'),
        ],
        projects: [project('p', title: 'Marathon')],
        keyResults: [keyResult('kr', objectiveId: 'o', title: '20 books')],
        now: DateTime(2026, 10, 5, 6),
      );
      final bodies = {for (final r in reminders.take(3)) r.title: r.body};
      expect(bodies, {
        'Run': 'Habit · Marathon',
        'Read': 'Habit · 20 books',
        'Breathe': 'Habit due today',
      });
    });
  });

  group('deadline reminders', () {
    final thesis = project('p', title: 'Thesis');
    ({Task task, Project project}) dueTask(
      CalendarDate due, {
      TaskStatus status = TaskStatus.open,
    }) => (
      task: task(
        't',
        title: 'Submit',
        projectId: 'p',
        dueDate: due,
        status: status,
      ),
      project: thesis,
    );

    test('on the lead date and the due date at the default time', () {
      final now = DateTime(2026, 10, 12, 6);
      final reminders = plan(
        deadlines: candidates(
          tasks: [dueTask(CalendarDate(2026, 10, 20))],
          now: now,
        ),
        now: now,
      );
      expect(times(reminders), [
        DateTime(2026, 10, 13, 8),
        DateTime(2026, 10, 20, 8),
      ]);
      expect(reminders.first.body, 'Task · Thesis · Due in 7 days');
      expect(reminders.last.body, 'Task · Thesis · Due today');
      expect(reminders.first.route, '/tasks/t');
      expect(reminders.first.kind, ReminderKind.deadline);
    });

    test('only the due-date reminder once the lead date has passed', () {
      final now = DateTime(2026, 10, 15, 6);
      final reminders = plan(
        deadlines: candidates(
          tasks: [dueTask(CalendarDate(2026, 10, 20))],
          now: now,
        ),
        now: now,
      );
      expect(times(reminders), [DateTime(2026, 10, 20, 8)]);
    });

    test('completed tasks get none', () {
      final now = DateTime(2026, 10, 12, 6);
      final reminders = plan(
        deadlines: candidates(
          tasks: [dueTask(CalendarDate(2026, 10, 20), status: TaskStatus.done)],
          now: now,
        ),
        now: now,
      );
      expect(reminders, isEmpty);
    });

    test('inherited deadlines get none', () {
      final now = DateTime(2026, 10, 12, 6);
      final reminders = plan(
        deadlines: candidates(
          projects: [project('p', keyResultId: 'kr')],
          objectives: [objective('o')],
          keyResults: [keyResult('kr', objectiveId: 'o')],
          now: now,
        ),
        now: now,
      );
      expect(reminders, isEmpty);
    });

    test('a standalone task is reminded like a project task', () {
      final now = DateTime(2026, 10, 12, 6);
      final reminders = plan(
        deadlines: candidates(
          outside: [
            task('s', title: 'Tax return', dueDate: CalendarDate(2026, 10, 20)),
          ],
          now: now,
        ),
        now: now,
      );
      expect(times(reminders), [
        DateTime(2026, 10, 13, 8),
        DateTime(2026, 10, 20, 8),
      ]);
      expect(reminders.first.route, '/tasks/s');
      expect(reminders.first.body, 'Task · Due in 7 days');
    });

    test('KR reminders open the KR form', () {
      final now = DateTime(2026, 10, 12, 6);
      final reminders = plan(
        deadlines: candidates(
          objectives: [objective('o')],
          keyResults: [
            keyResult(
              'kr',
              objectiveId: 'o',
              deadline: CalendarDate(2026, 10, 14),
            ),
          ],
          now: now,
        ),
        now: now,
      );
      expect(reminders.single.route, '/plan/key-results/kr');
      expect(reminders.single.body, 'Key result · Due today');
    });

    test('beyond the 14-day horizon nothing is scheduled', () {
      final reminders = plan(
        deadlines: candidates(
          projects: [project('p', deadline: CalendarDate(2026, 11, 30))],
          now: monday,
        ),
      );
      expect(reminders, isEmpty);
    });
  });

  test('capped at the 400 earliest reminders', () {
    final reminders = plan(
      habits: [for (var i = 0; i < 30; i++) habit('h$i', title: 'Habit $i')],
      withReviews: true,
    );
    expect(reminders, hasLength(maxScheduledReminders));
    // 30 habits × 13 days + the review on Sunday 10-11 = 391: the last day
    // keeps only 9 habit reminders, and its review reminder is cut.
    final lastDay = reminders.where((r) => r.at == DateTime(2026, 10, 18, 8));
    expect(lastDay, hasLength(9));
    expect(reminders.last.at, DateTime(2026, 10, 18, 8));
  });

  test('no reminders when they are switched off', () {
    expect(
      plan(
        settings: const AppSettings(remindersEnabled: false),
        habits: [habit('h')],
      ),
      isEmpty,
    );
  });

  group('weekly review reminder', () {
    List<PlannedReminder> reviews({
      AppSettings settings = const AppSettings(),
      Set<CalendarDate> completed = const {},
      DateTime? now,
    }) => plan(
      settings: settings,
      completedReviewWeeks: completed,
      now: now,
      withReviews: true,
    );

    test('Sunday evening for each unreviewed week', () {
      final reminders = reviews();
      expect(times(reminders), [
        DateTime(2026, 10, 11, 18),
        DateTime(2026, 10, 18, 18),
      ]);
      expect(reminders.first.title, 'Weekly review');
      expect(reminders.first.body, 'Week 05-10-2026 – 11-10-2026');
      expect(reminders.first.route, '/review/weekly');
      expect(reminders.first.kind, ReminderKind.review);
    });

    test('skipped once that week is reviewed', () {
      final reminders = reviews(completed: {CalendarDate(2026, 10, 5)});
      expect(times(reminders), [DateTime(2026, 10, 18, 18)]);
    });

    test('a changed review day moves the reminders', () {
      final reminders = reviews(
        settings: const AppSettings(
          reviewDay: DateTime.monday,
          reviewTime: (hour: 9, minute: 0),
        ),
      );
      // Monday 2026-10-05 09:00 is after 06:00: still today. Monday
      // reviews cover the previous week.
      expect(times(reminders), [
        DateTime(2026, 10, 5, 9),
        DateTime(2026, 10, 12, 9),
      ]);
      expect(reminders.first.body, 'Week 28-09-2026 – 04-10-2026');
    });

    test('none when reminders are off', () {
      expect(
        reviews(settings: const AppSettings(remindersEnabled: false)),
        isEmpty,
      );
    });
  });
}
