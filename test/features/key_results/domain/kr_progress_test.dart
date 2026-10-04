import 'package:flutter_test/flutter_test.dart';
import 'package:orbit/core/db/enums.dart';
import 'package:orbit/features/key_results/domain/kr_progress.dart';

double? numeric(double start, double target, double current) => krProgress(
  MeasureType.numeric,
  start: start,
  target: target,
  current: current,
);

void main() {
  group('numeric', () {
    test('halfway', () => expect(numeric(0, 100, 50), 0.5));
    test('decreasing target', () => expect(numeric(80, 70, 75), 0.5));
    test('beyond target is clamped to 1', () {
      expect(numeric(0, 100, 130), 1);
      expect(numeric(80, 70, 60), 1);
    });
    test('below start is clamped to 0', () => expect(numeric(10, 20, 5), 0));
    test('target equals start, reached', () => expect(numeric(5, 5, 5), 1));
    test('target equals start, not reached', () {
      expect(numeric(5, 5, 6), 0);
      expect(numeric(5, 5, 4), 0);
    });
    test('fractional values without floating-point surprises', () {
      expect(numeric(0.1, 0.3, 0.3), 1);
      expect(numeric(0.3, 0.3, 0.1 + 0.2), 1);
    });
    test('missing values count as no progress', () {
      expect(krProgress(MeasureType.numeric, start: 0, target: 10), 0);
    });
  });

  group('boolean', () {
    test('achieved', () {
      expect(krProgress(MeasureType.boolean, current: 1), 1);
    });
    test('not achieved', () {
      expect(krProgress(MeasureType.boolean, current: 0), 0);
      expect(krProgress(MeasureType.boolean), 0);
    });
  });

  test('habit progress is not available yet', () {
    expect(
      krProgress(MeasureType.habit, start: 0, target: 20, current: 5),
      isNull,
    );
  });
}
