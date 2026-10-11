import 'package:flutter_test/flutter_test.dart';
import 'package:orbit/core/db/app_database.dart';
import 'package:orbit/features/home/domain/upcoming_deadlines.dart';

import '../../../helpers/fixtures.dart';

void main() {
  final today = CalendarDate(2026, 10, 5);

  List<UpcomingDeadline> build({
    List<({Task task, Project project})> tasks = const [],
    List<Project> projects = const [],
    int leadDays = 7,
  }) => buildUpcomingDeadlines(
    tasks: tasks,
    projects: projects,
    today: today,
    leadDays: leadDays,
  );

  test('a task due within 7 days is listed with its project', () {
    final p = project('p', title: 'Thesis');
    final items = build(
      tasks: [
        (
          task: task(
            't',
            title: 'Book venue',
            dueDate: CalendarDate(2026, 10, 12),
          ),
          project: p,
        ),
      ],
    );
    expect(items.single.kind, DeadlineKind.task);
    expect(items.single.projectTitle, 'Thesis');
    expect(items.single.projectId, 'p');
    expect(items.single.overdue, isFalse);
  });

  test('a project deadline 8 days away is not listed', () {
    final items = build(
      projects: [project('p', deadline: CalendarDate(2026, 10, 13))],
    );
    expect(items, isEmpty);
  });

  test('inherited deadlines are not listed', () {
    final items = build(projects: [project('p', goalId: 'g')]);
    expect(items, isEmpty);
  });

  test('tasks of paused projects are not listed', () {
    final items = build(
      tasks: [
        (
          task: task('t', dueDate: today.addDays(1)),
          project: project('p', status: ProjectStatus.paused),
        ),
      ],
    );
    expect(items, isEmpty);
  });

  test('backlog projects and done tasks are not listed', () {
    final items = build(
      tasks: [
        (
          task: task('t', dueDate: today, status: TaskStatus.done),
          project: project('p'),
        ),
      ],
      projects: [project('b', status: ProjectStatus.backlog, deadline: today)],
    );
    expect(items, isEmpty);
  });

  test('sorted by date, overdue first and marked, then by title', () {
    final p = project('p');
    final items = build(
      tasks: [
        (
          task: task('t1', title: 'b task', dueDate: today.addDays(2)),
          project: p,
        ),
        (
          task: task('t2', title: 'Late', dueDate: CalendarDate(2026, 10, 3)),
          project: p,
        ),
        (
          task: task('t3', title: 'A task', dueDate: today.addDays(2)),
          project: p,
        ),
      ],
    );
    expect(items.map((i) => i.title), ['Late', 'A task', 'b task']);
    expect(items.first.overdue, isTrue);
    expect(items.last.overdue, isFalse);
  });

  test('a shorter lead time lists fewer items', () {
    // Today 2026-10-05, lead time 3: a task due 2026-10-09 is beyond it.
    final p = project('p');
    final tasks = [
      (
        task: task('t1', title: 'Soon', dueDate: CalendarDate(2026, 10, 8)),
        project: p,
      ),
      (
        task: task('t2', title: 'Later', dueDate: CalendarDate(2026, 10, 9)),
        project: p,
      ),
    ];
    expect(build(tasks: tasks, leadDays: 3).map((i) => i.title), ['Soon']);
  });

  test('candidates include deadlines beyond the lead time', () {
    final items = deadlineCandidates(
      tasks: const [],
      projects: [project('p', deadline: CalendarDate(2027, 3, 1))],
      today: today,
    );
    expect(items.single.date, CalendarDate(2027, 3, 1));
    expect(items.single.overdue, isFalse);
  });

  test('Project not repeated: an active project is listed too', () {
    final items = build(projects: [project('p', deadline: today.addDays(1))]);
    expect(items.single.kind, DeadlineKind.project);
  });

  test('Overdue task outside projects is listed and marked', () {
    final items = buildUpcomingDeadlines(
      tasks: const [],
      tasksOutsideProjects: [
        task('t', title: 'Tax return', dueDate: today.addDays(-4)),
      ],
      projects: const [],
      today: today,
      leadDays: 7,
    );
    expect(items.single.title, 'Tax return');
    expect(items.single.overdue, isTrue);
  });
}
