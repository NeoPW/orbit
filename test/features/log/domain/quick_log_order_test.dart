import 'package:flutter_test/flutter_test.dart';
import 'package:orbit/features/log/domain/quick_log_order.dart';

import '../../../helpers/fixtures.dart';

void main() {
  test('recently logged projects first, newest first', () {
    final ordered = orderQuickLogProjects(
      [
        project('a', title: 'A'),
        project('b', title: 'B'),
        project('c', title: 'C'),
      ],
      {'b': DateTime.utc(2026, 10, 4), 'a': DateTime.utc(2026, 9, 28)},
    );
    expect(ordered.map((p) => p.title), ['B', 'A', 'C']);
  });

  test('never-logged projects by title, case-insensitive', () {
    final ordered = orderQuickLogProjects([
      project('1', title: 'thesis'),
      project('2', title: 'Garden'),
      project('3', title: 'Apartment'),
    ], {});
    expect(ordered.map((p) => p.title), ['Apartment', 'Garden', 'thesis']);
  });

  test('targets: projects then tasks, each recent first', () {
    final ordered = orderQuickLogTargets(
      projects: [
        project('p1', title: 'Thesis'),
        project('p2', title: 'Garden'),
      ],
      tasks: [
        task('t1', title: 'Tax return'),
        task('t2', title: 'Book physio'),
      ],
      lastLoggedProjects: {'p1': DateTime.utc(2026, 10, 4)},
      lastLoggedTasks: {'t1': DateTime.utc(2026, 10, 4)},
    );
    expect(ordered.projects.map((p) => p.title), ['Thesis', 'Garden']);
    expect(ordered.tasks.map((t) => t.title), ['Tax return', 'Book physio']);
  });
}
