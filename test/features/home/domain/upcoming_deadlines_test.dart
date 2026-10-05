import 'package:flutter_test/flutter_test.dart';
import 'package:orbit/core/db/app_database.dart';
import 'package:orbit/features/home/domain/upcoming_deadlines.dart';

import '../../../helpers/fixtures.dart';

void main() {
  final today = CalendarDate(2026, 10, 5);

  List<UpcomingDeadline> build({
    List<({Task task, Project project})> tasks = const [],
    List<Project> projects = const [],
    List<KeyResult> keyResults = const [],
    List<Objective> objectives = const [],
    Map<String, int> habitCheckIns = const {},
    int leadDays = 7,
  }) => buildUpcomingDeadlines(
    tasks: tasks,
    projects: projects,
    keyResults: keyResults,
    objectives: objectives,
    habitCheckIns: habitCheckIns,
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

  test('inherited deadlines are not listed, only the KR', () {
    final items = build(
      objectives: [objective('o')],
      keyResults: [
        keyResult('kr', objectiveId: 'o', deadline: today.addDays(1)),
      ],
      projects: [project('p', keyResultId: 'kr')],
    );
    expect(items.map((i) => i.kind), [DeadlineKind.keyResult]);
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

  test('a reached KR is not listed', () {
    final items = build(
      objectives: [objective('o')],
      keyResults: [
        keyResult(
          'kr',
          objectiveId: 'o',
          current: 100,
          deadline: today.addDays(1),
        ),
      ],
    );
    expect(items, isEmpty);
  });

  test('KRs of non-active objectives are not listed', () {
    final items = build(
      objectives: [objective('o', status: ObjectiveStatus.completed)],
      keyResults: [
        keyResult('kr', objectiveId: 'o', deadline: today.addDays(1)),
      ],
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
      keyResults: const [],
      objectives: const [],
      habitCheckIns: const {},
      today: today,
    );
    expect(items.single.date, CalendarDate(2027, 3, 1));
    expect(items.single.overdue, isFalse);
  });
}
