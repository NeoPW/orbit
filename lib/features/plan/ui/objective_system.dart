import 'package:flutter/material.dart';

import '../../../core/space/planets.dart';
import '../../../core/space/space_colors.dart';
import '../../../core/widgets/area_dot.dart';
import '../domain/plan_overview.dart';

/// An active objective's star system: its KRs as planets in shades of the
/// objective's color, their active projects as moons in area colors.
class ObjectiveSystem {
  ObjectiveSystem(this.plan, {this.onKeyResult})
    : color = colorOfObjective(plan.objective);

  final ObjectivePlan plan;
  final void Function(String keyResultId)? onKeyResult;
  final Color color;

  /// The average progress of the KRs, 0 without KRs.
  double get progress => plan.keyResults.isEmpty
      ? 0
      : plan.keyResults.fold(0.0, (sum, kr) => sum + kr.progress) /
            plan.keyResults.length;

  Color keyResult(int index) => colorOfKeyResult(
    plan.keyResults[index].keyResult,
    color,
    index,
    plan.keyResults.length,
  );

  List<SystemPlanet> get planets => [
    for (final (i, kr) in plan.keyResults.indexed)
      SystemPlanet(
        label: kr.keyResult.title,
        color: keyResult(i),
        progress: kr.progress,
        moons: [
          for (final entry in kr.projects)
            entry.area == null
                ? Colors.white70
                : colorFromHex(entry.area!.color),
        ],
        onTap: onKeyResult == null ? null : () => onKeyResult!(kr.keyResult.id),
      ),
  ];

  StarSystem compact({double size = 56}) => StarSystem(
    color: color,
    progress: progress,
    planets: planets,
    size: size,
    seed: stableSeed(plan.objective.id),
  );

  StarSystem detailed({double height = 220}) => StarSystem.detailed(
    color: color,
    progress: progress,
    planets: planets,
    height: height,
    seed: stableSeed(plan.objective.id),
  );
}
