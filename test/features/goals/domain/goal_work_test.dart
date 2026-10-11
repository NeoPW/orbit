import 'package:flutter_test/flutter_test.dart';
import 'package:orbit/features/goals/domain/goal_work.dart';

import '../../../helpers/fixtures.dart';

void main() {
  final at = DateTime(2026, 10, 7, 10);
  final projectGoals = {'marathon': 'fit', 'garden': null};
  final tasks = {
    'physio': task('physio', goalId: 'fit'),
    'shoes': task('shoes', projectId: 'marathon'),
    'loose': task('loose'),
  };

  Map<String, WorkTotal> work(List entries) =>
      workPerGoal(entries.cast(), projectGoals: projectGoals, tasks: tasks);

  test('work through a project counts for its goal', () {
    expect(
      work([
        logEntry('a', projectId: 'marathon', at: at, minutes: 30),
        logEntry('b', projectId: 'marathon', at: at, minutes: 30),
      ]),
      {'fit': const WorkTotal(2, 60)},
    );
  });

  test('work on a task of the goal or of its project counts', () {
    expect(
      work([
        logEntry('a', taskId: 'physio', at: at, minutes: 45),
        logEntry('b', taskId: 'shoes', at: at),
      ]),
      {'fit': const WorkTotal(2, 45)},
    );
  });

  test('an entry on the goal itself counts', () {
    expect(work([logEntry('a', goalId: 'fit', at: at, minutes: 10)]), {
      'fit': const WorkTotal(1, 10),
    });
  });

  test('work without a goal counts for none', () {
    expect(
      work([
        logEntry('a', projectId: 'garden', at: at, minutes: 20),
        logEntry('b', taskId: 'loose', at: at),
        logEntry('c', at: at),
      ]),
      isEmpty,
    );
  });

  test('a project linked later counts its earlier work for the goal', () {
    // The project's current goal decides, whenever the entry was logged.
    expect(
      work([logEntry('a', projectId: 'marathon', at: DateTime(2026, 9, 1))]),
      {'fit': const WorkTotal(1, 0)},
    );
  });
}
