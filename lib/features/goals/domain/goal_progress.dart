/// A goal's progress: the average of its measures' progress (each 0–1),
/// or null for a goal without measures (goals spec, "Goal progress").
double? goalProgress(Iterable<double> measures) {
  if (measures.isEmpty) return null;
  return measures.fold(0.0, (sum, p) => sum + p) / measures.length;
}

/// True when the goal has measures and every one is reached (its planet
/// gets a ring, solar-system spec).
bool allMeasuresReached(Iterable<double> measures) =>
    measures.isNotEmpty && measures.every((p) => p >= 1);
