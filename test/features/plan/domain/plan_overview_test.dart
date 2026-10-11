import 'package:flutter_test/flutter_test.dart';
import 'package:orbit/core/db/app_database.dart';
import 'package:orbit/features/plan/domain/plan_overview.dart';
import 'package:orbit/features/projects/domain/project_deadline.dart';

import '../../../helpers/fixtures.dart';

PlanOverview build({
  List<Goal> goals = const [],
  List<Measure> measures = const [],
  List<Project> projects = const [],
  List<Area> areas = const [],
  Map<String, int> habitCheckIns = const {},
  List<Task> tasks = const [],
}) => buildPlanOverview(
  goals: goals,
  measures: measures,
  projects: projects,
  areas: areas,
  habitCheckIns: habitCheckIns,
  tasks: tasks,
);

List<String> titles(List<ProjectEntry> entries) =>
    entries.map((e) => e.project.title).toList();

void main() {
  group('assigned tasks', () {
    test('listed under their goal, by deadline then title', () {
      final overview = build(
        goals: [goal('g1')],
        tasks: [
          task('b', title: 'b', goalId: 'g1'),
          task('A', title: 'A', goalId: 'g1'),
          task('late', goalId: 'g1', dueDate: CalendarDate(2026, 11, 1)),
          task('soon', goalId: 'g1', dueDate: CalendarDate(2026, 10, 7)),
          task('done', goalId: 'g1', status: TaskStatus.done),
          task('other', goalId: 'g-elsewhere'),
        ],
      );
      expect(overview.goals.single.tasks.map((t) => t.id), [
        'soon',
        'late',
        'A',
        'b',
      ]);
    });
  });

  group('goals section', () {
    test('goal with measures and projects', () {
      final overview = build(
        goals: [goal('g1', title: 'Get fit')],
        measures: [
          measure('m1', goalId: 'g1', current: 50),
          measure('m2', goalId: 'g1', current: 100),
        ],
        projects: [project('p1', goalId: 'g1')],
      );
      final plan = overview.goals.single;
      expect(plan.goal.title, 'Get fit');
      expect(plan.measures.map((m) => m.progress), [0.5, 1.0]);
      expect(plan.progress, 0.75);
      expect(plan.allReached, isFalse);
      expect(titles(plan.projects), ['p1']);
    });

    test('non-active goals are hidden', () {
      final overview = build(
        goals: [
          goal('done', status: GoalStatus.completed),
          goal('old', status: GoalStatus.archived),
        ],
      );
      expect(overview.goals, isEmpty);
    });

    test('goals and measures follow sort order', () {
      final overview = build(
        goals: [goal('b', sortOrder: 1), goal('a', sortOrder: 0)],
        measures: [
          measure('m2', goalId: 'a', sortOrder: 1),
          measure('m1', goalId: 'a', sortOrder: 0),
        ],
      );
      expect(overview.goals.map((g) => g.goal.id), ['a', 'b']);
      expect(overview.goals.first.measures.map((m) => m.measure.id), [
        'm1',
        'm2',
      ]);
    });

    test('backlog and paused projects of a goal are hidden', () {
      final overview = build(
        goals: [goal('g1')],
        projects: [
          project('b', goalId: 'g1', status: ProjectStatus.backlog),
          project('p', goalId: 'g1', status: ProjectStatus.paused),
        ],
      );
      expect(overview.goals.single.projects, isEmpty);
      expect(overview.projectsWithoutGoal, isEmpty);
    });
  });

  group('project entries', () {
    test('ordered by importance, then deadline (none last), then title', () {
      final overview = build(
        goals: [goal('g1')],
        projects: [
          project(
            'A',
            goalId: 'g1',
            importance: 3,
            deadline: CalendarDate(2026, 11, 1),
          ),
          project('B', goalId: 'g1', importance: 5),
          project('C', goalId: 'g1', importance: 3),
        ],
      );
      // C inherits the goal's end date (2026-12-31), after A's own date.
      expect(titles(overview.goals.single.projects), ['B', 'A', 'C']);
    });

    test('entries carry area and effective deadline from the goal', () {
      final overview = build(
        goals: [goal('g1', end: CalendarDate(2026, 12, 31))],
        areas: [area('a1', name: 'Job')],
        projects: [project('p', goalId: 'g1', areaId: 'a1')],
      );
      final entry = overview.goals.single.projects.single;
      expect(entry.area!.name, 'Job');
      expect(
        entry.deadline,
        EffectiveDeadline(CalendarDate(2026, 12, 31), inherited: true),
      );
      expect(entry.goal, isNull);
    });

    test('a missing area shows as no area', () {
      final overview = build(projects: [project('p', areaId: 'gone')]);
      expect(overview.projectsWithoutGoal.single.area, isNull);
    });
  });

  group('projects without a goal', () {
    test('active project without goal is listed', () {
      final overview = build(projects: [project('p')]);
      expect(titles(overview.projectsWithoutGoal), ['p']);
    });

    test('backlog project without goal is not listed', () {
      final overview = build(
        projects: [project('p', status: ProjectStatus.backlog)],
      );
      expect(overview.projectsWithoutGoal, isEmpty);
    });

    test('a project of a completed goal is listed with the goal', () {
      final overview = build(
        goals: [goal('g1', title: 'Old', status: GoalStatus.completed)],
        projects: [project('p', goalId: 'g1')],
      );
      final entry = overview.projectsWithoutGoal.single;
      expect(entry.goal!.title, 'Old');
      expect(entry.deadline!.inherited, isTrue);
    });

    test('a project of a missing goal is listed without goal', () {
      final overview = build(projects: [project('p', goalId: 'gone')]);
      final entry = overview.projectsWithoutGoal.single;
      expect(entry.goal, isNull);
      expect(entry.deadline, isNull);
    });
  });
}
