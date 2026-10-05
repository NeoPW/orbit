import 'package:flutter_test/flutter_test.dart';
import 'package:orbit/core/db/app_database.dart';
import 'package:orbit/features/home/domain/project_score.dart';
import 'package:orbit/features/projects/domain/project_deadline.dart';

import '../../../helpers/fixtures.dart';

void main() {
  final today = CalendarDate(2026, 10, 5);

  group('urgency', () {
    test('overdue is 5', () => expect(urgency(today.addDays(-1), today), 5));
    test('due today is 4', () => expect(urgency(today, today), 4));
    test('boundaries', () {
      expect(
        [3, 4, 7, 8, 30, 31].map((d) => urgency(today.addDays(d), today)),
        [4, 3, 3, 2, 2, 1],
      );
    });
    test('no deadline is 1', () => expect(urgency(null, today), 1));
  });

  group('ordering', () {
    ScoredProject scored(
      String title, {
      int importance = 3,
      CalendarDate? deadline,
    }) => ScoredProject(
      project(title, title: title, importance: importance),
      deadline == null ? null : EffectiveDeadline(deadline, inherited: false),
      today: today,
    );

    List<String> order(List<ScoredProject> projects) =>
        (projects..sort(compareProjectsForHome))
            .map((p) => p.project.title)
            .toList();

    test('score is importance × urgency', () {
      expect(scored('A', importance: 5).score, 5);
      expect(scored('B', importance: 2, deadline: today.addDays(-1)).score, 10);
    });

    test('score beats importance', () {
      expect(
        order([
          scored('A', importance: 5),
          scored('B', importance: 2, deadline: today.addDays(-1)),
        ]),
        ['B', 'A'],
      );
    });

    test('equal score: the one with a deadline first', () {
      // A: 2 × 1 (deadline 40 days away) = 2; B: 2 × 1 (none) = 2.
      expect(
        order([
          scored('B', importance: 2),
          scored('A', importance: 2, deadline: today.addDays(40)),
        ]),
        ['A', 'B'],
      );
    });

    test('equal score and deadline: by title', () {
      expect(order([scored('b'), scored('A')]), ['A', 'b']);
    });
  });
}
