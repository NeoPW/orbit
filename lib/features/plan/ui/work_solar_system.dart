import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/router/routes.dart';
import '../../../core/space/solar_system.dart';
import '../../../core/space/space_colors.dart';
import '../../../core/widgets/area_dot.dart';
import '../data/plan_providers.dart';
import '../domain/plan_overview.dart';

/// The neutral color of a project without an area.
const _noArea = Color(0xFFC9CEE8);

Color _areaColor(ProjectEntry entry) =>
    entry.area == null ? _noArea : colorFromHex(entry.area!.color);

/// The solar system of all work (solar-system spec): the active goals as
/// planets with their active projects as moons, and the active projects
/// without an active goal as asteroids. Full size on the Plan tab, [compact]
/// on Home. Taps open the page unless [onGoal] / [onProject] are given.
/// Left out when there is nothing to show.
class WorkSolarSystem extends ConsumerWidget {
  const WorkSolarSystem({
    super.key,
    this.compact = false,
    this.onGoal,
    this.onProject,
  });

  final bool compact;
  final ValueChanged<String>? onGoal;
  final ValueChanged<String>? onProject;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final overview = ref.watch(planOverviewProvider).value;
    if (overview == null ||
        (overview.goals.isEmpty && overview.projectsWithoutGoal.isEmpty)) {
      return const SizedBox.shrink();
    }
    return SolarSystem(
      compact: compact,
      sunColor: Theme.of(context).colorScheme.tertiary,
      planets: [
        for (final plan in overview.goals)
          SolarPlanet(
            id: plan.goal.id,
            label: plan.goal.title,
            color: colorOfGoal(plan.goal),
            progress: plan.progress,
            ringed: plan.allReached,
            moons: [for (final entry in plan.projects) _areaColor(entry)],
          ),
      ],
      asteroids: [
        for (final entry in overview.projectsWithoutGoal)
          SolarAsteroid(
            id: entry.project.id,
            label: entry.project.title,
            color: _areaColor(entry),
          ),
      ],
      onPlanet: (planet) => onGoal != null
          ? onGoal!(planet.id)
          : context.push(Routes.goal(planet.id)),
      onAsteroid: (asteroid) => onProject != null
          ? onProject!(asteroid.id)
          : context.push(Routes.projectDetail(asteroid.id)),
    );
  }
}
