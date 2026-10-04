import '../../../core/db/enums.dart';

const _epsilon = 1e-9;

/// Progress of a KR from 0 to 1 (docs/SPEC.md §5), or null for habit KRs,
/// whose progress needs habit checks (milestone 2).
///
/// Numeric: `(current - start) / (target - start)` clamped to 0–1; works for
/// decreasing targets. When target equals start, progress is 1 if current
/// equals target and 0 otherwise. Missing values count as no progress.
/// Boolean: 1 when achieved (current is 1), else 0.
double? krProgress(
  MeasureType measureType, {
  double? start,
  double? target,
  double? current,
}) {
  switch (measureType) {
    case MeasureType.habit:
      return null;
    case MeasureType.boolean:
      return current != null && (current - 1).abs() < _epsilon ? 1 : 0;
    case MeasureType.numeric:
      if (start == null || target == null || current == null) return 0;
      final span = target - start;
      if (span.abs() < _epsilon) {
        return (current - target).abs() < _epsilon ? 1 : 0;
      }
      return ((current - start) / span).clamp(0.0, 1.0);
  }
}
