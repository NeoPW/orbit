import 'package:flutter_test/flutter_test.dart';
import 'package:orbit/core/db/app_database.dart';
import 'package:orbit/features/plan/domain/plan_overview.dart';
import 'package:orbit/features/projects/domain/project_deadline.dart';

import '../../../helpers/fixtures.dart';

PlanOverview build({
  List<Objective> objectives = const [],
  List<KeyResult> keyResults = const [],
  List<Project> projects = const [],
  List<Area> areas = const [],
}) => buildPlanOverview(
  objectives: objectives,
  keyResults: keyResults,
  projects: projects,
  areas: areas,
);

List<String> titles(List<ProjectEntry> entries) =>
    entries.map((e) => e.project.title).toList();

void main() {
  group('objectives section', () {
    test('objective with KRs and projects', () {
      final overview = build(
        objectives: [objective('o1')],
        keyResults: [
          keyResult('kr1', objectiveId: 'o1', sortOrder: 0, current: 50),
          keyResult('kr2', objectiveId: 'o1', sortOrder: 1),
        ],
        projects: [project('p1', keyResultId: 'kr1')],
      );

      expect(overview.objectives, hasLength(1));
      final krs = overview.objectives.single.keyResults;
      expect(krs.map((k) => k.keyResult.id), ['kr1', 'kr2']);
      expect(krs[0].progress, 0.5);
      expect(titles(krs[0].projects), ['p1']);
      expect(krs[1].projects, isEmpty);
      expect(overview.projectsWithoutKr, isEmpty);
    });

    test('non-active objectives are hidden', () {
      final overview = build(
        objectives: [
          objective('o1', status: ObjectiveStatus.completed),
          objective('o2', status: ObjectiveStatus.archived),
          objective('o3'),
        ],
      );
      expect(overview.objectives.map((o) => o.objective.id), ['o3']);
    });

    test('objectives and KRs follow sort order', () {
      final overview = build(
        objectives: [
          objective('b', sortOrder: 1),
          objective('a', sortOrder: 0),
        ],
        keyResults: [
          keyResult('kr-b', objectiveId: 'a', sortOrder: 1),
          keyResult('kr-a', objectiveId: 'a', sortOrder: 0),
        ],
      );
      expect(overview.objectives.map((o) => o.objective.id), ['a', 'b']);
      expect(overview.objectives.first.keyResults.map((k) => k.keyResult.id), [
        'kr-a',
        'kr-b',
      ]);
    });

    test('backlog and paused projects under a KR are hidden', () {
      final overview = build(
        objectives: [objective('o1')],
        keyResults: [keyResult('kr1', objectiveId: 'o1')],
        projects: [
          project('backlog', keyResultId: 'kr1', status: ProjectStatus.backlog),
          project('paused', keyResultId: 'kr1', status: ProjectStatus.paused),
          project('done', keyResultId: 'kr1', status: ProjectStatus.completed),
        ],
      );
      expect(overview.objectives.single.keyResults.single.projects, isEmpty);
      expect(overview.projectsWithoutKr, isEmpty);
    });

    test('objective without KRs has an empty KR list', () {
      final overview = build(objectives: [objective('o1')]);
      expect(overview.objectives.single.keyResults, isEmpty);
    });

    test('no active objectives gives an empty section', () {
      expect(build().objectives, isEmpty);
    });

    test('KR effective deadline and habit progress', () {
      final overview = build(
        objectives: [objective('o1', end: CalendarDate(2026, 12, 31))],
        keyResults: [
          keyResult(
            'own',
            objectiveId: 'o1',
            deadline: CalendarDate(2026, 11, 15),
          ),
          keyResult(
            'inherit',
            objectiveId: 'o1',
            measureType: MeasureType.habit,
          ),
        ],
      );
      final krs = {
        for (final k in overview.objectives.single.keyResults)
          k.keyResult.id: k,
      };
      expect(krs['own']!.effectiveDeadline, CalendarDate(2026, 11, 15));
      expect(krs['inherit']!.effectiveDeadline, CalendarDate(2026, 12, 31));
      expect(krs['inherit']!.progress, isNull);
    });
  });

  group('project entries', () {
    test('ordered by importance, then deadline (none last), then title', () {
      final overview = build(
        objectives: [objective('o1', end: CalendarDate(2027, 6, 30))],
        keyResults: [keyResult('kr1', objectiveId: 'o1')],
        projects: [
          project(
            'A',
            keyResultId: 'kr1',
            importance: 3,
            deadline: CalendarDate(2026, 11, 1),
          ),
          project('B', keyResultId: 'kr1', importance: 5),
          project('C', keyResultId: 'kr1', importance: 3),
        ],
      );
      // Under a KR every project inherits a deadline, so B, A, C here
      // follows importance, then the own (earlier) deadline of A.
      expect(titles(overview.objectives.single.keyResults.single.projects), [
        'B',
        'A',
        'C',
      ]);
    });

    test('projects without any deadline come last, then by title', () {
      final overview = build(
        projects: [
          project('c'),
          project('A', deadline: CalendarDate(2026, 11, 1)),
          project('B', importance: 5),
          project('b'),
        ],
      );
      expect(titles(overview.projectsWithoutKr), ['B', 'A', 'b', 'c']);
    });

    test('entries carry area and effective deadline', () {
      final overview = build(
        objectives: [objective('o1', end: CalendarDate(2026, 12, 31))],
        keyResults: [keyResult('kr1', objectiveId: 'o1')],
        areas: [area('uni', name: 'Uni')],
        projects: [project('p1', keyResultId: 'kr1', areaId: 'uni')],
      );
      final entry =
          overview.objectives.single.keyResults.single.projects.single;
      expect(entry.area?.name, 'Uni');
      expect(
        entry.deadline,
        EffectiveDeadline(CalendarDate(2026, 12, 31), inherited: true),
      );
    });

    test('a missing area shows as no area', () {
      final overview = build(projects: [project('p1', areaId: 'deleted')]);
      expect(overview.projectsWithoutKr.single.area, isNull);
    });
  });

  group('projects without a KR', () {
    test('active project without KR is listed', () {
      final overview = build(projects: [project('p1')]);
      expect(titles(overview.projectsWithoutKr), ['p1']);
      expect(overview.projectsWithoutKr.single.deadline, isNull);
    });

    test('backlog project without KR is not listed', () {
      final overview = build(
        projects: [project('p1', status: ProjectStatus.backlog)],
      );
      expect(overview.projectsWithoutKr, isEmpty);
    });

    test(
      'project linked to a KR of a completed objective is listed with its KR',
      () {
        final overview = build(
          objectives: [
            objective(
              'o1',
              status: ObjectiveStatus.completed,
              end: CalendarDate(2026, 9, 30),
            ),
          ],
          keyResults: [
            keyResult('kr1', objectiveId: 'o1', title: 'Run 100 km'),
          ],
          projects: [project('p1', keyResultId: 'kr1')],
        );
        final entry = overview.projectsWithoutKr.single;
        expect(entry.keyResult?.title, 'Run 100 km');
        expect(
          entry.deadline,
          EffectiveDeadline(CalendarDate(2026, 9, 30), inherited: true),
        );
      },
    );

    test('project linked to a missing KR is listed without KR', () {
      final overview = build(projects: [project('p1', keyResultId: 'gone')]);
      final entry = overview.projectsWithoutKr.single;
      expect(entry.keyResult, isNull);
      expect(entry.deadline, isNull);
    });
  });
}
