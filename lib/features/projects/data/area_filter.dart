/// Which projects to show by area (Backlog filter).
sealed class AreaFilter {
  const AreaFilter();
}

/// Projects in any area or none.
class AllAreas extends AreaFilter {
  const AllAreas();

  @override
  bool operator ==(Object other) => other is AllAreas;

  @override
  int get hashCode => (AllAreas).hashCode;
}

/// Projects without an area.
class NoArea extends AreaFilter {
  const NoArea();

  @override
  bool operator ==(Object other) => other is NoArea;

  @override
  int get hashCode => (NoArea).hashCode;
}

/// Projects in one area.
class InArea extends AreaFilter {
  const InArea(this.areaId);

  final String areaId;

  @override
  bool operator ==(Object other) => other is InArea && other.areaId == areaId;

  @override
  int get hashCode => Object.hash(InArea, areaId);
}
