import 'package:flutter_test/flutter_test.dart';
import 'package:orbit/features/goals/domain/goal_progress.dart';

void main() {
  test('a goal is the average of its measures', () {
    expect(goalProgress([0.4, 0.8]), closeTo(0.6, 1e-9));
  });

  test('a goal without measures has no progress', () {
    expect(goalProgress(const []), isNull);
  });

  test('all measures reached', () {
    expect(allMeasuresReached([1, 1]), isTrue);
    expect(allMeasuresReached([1, 0.2]), isFalse);
    expect(allMeasuresReached(const []), isFalse);
  });
}
