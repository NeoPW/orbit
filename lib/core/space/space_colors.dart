import 'package:flutter/material.dart';

import '../db/app_database.dart';
import '../widgets/area_dot.dart';

/// Colors an objective's star or a KR's planet can have, stored as
/// `#RRGGBB`; picked to glow on the night sky and stand apart.
const spacePalette = <String>[
  '#8F9DFF', // blue violet
  '#FFB547', // amber
  '#4FD8E8', // cyan
  '#FF7A9C', // rose
  '#7CE38B', // green
  '#C08BFF', // purple
  '#FF8A5C', // coral
  '#5CB8FF', // sky
  '#FFE066', // yellow
  '#F5F1E8', // white
];

/// The palette's first eight, for objectives without an own color.
final starColors = [for (final hex in spacePalette.take(8)) colorFromHex(hex)];

/// The automatic color of an objective at [sortOrder]: by position, so
/// neighbors differ.
Color objectiveColor(int sortOrder) =>
    starColors[sortOrder % starColors.length];

/// The objective's own color, else its automatic one.
Color colorOfObjective(Objective objective) => objective.color == null
    ? objectiveColor(objective.sortOrder)
    : colorFromHex(objective.color!);

/// The automatic color of the [index]th of [count] key results of an
/// objective in [star]: shades around the star's hue, so a system reads as a
/// family while its planets stay apart.
Color keyResultColor(Color star, int index, int count) {
  final hsl = HSLColor.fromColor(star);
  final spread = count <= 1 ? 0.0 : (index - (count - 1) / 2) * 26;
  return hsl
      .withHue((hsl.hue + spread) % 360)
      .withSaturation((hsl.saturation * 0.9).clamp(0.0, 1.0))
      .withLightness(
        (hsl.lightness + (index.isEven ? 0.06 : -0.04)).clamp(0.35, 0.8),
      )
      .toColor();
}

/// The KR's own color, else its automatic shade of [star].
Color colorOfKeyResult(KeyResult kr, Color star, int index, int count) =>
    kr.color == null
    ? keyResultColor(star, index, count)
    : colorFromHex(kr.color!);
