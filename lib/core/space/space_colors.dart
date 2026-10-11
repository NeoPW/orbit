import 'package:flutter/material.dart';

import '../db/app_database.dart';
import '../widgets/area_dot.dart';

/// Colors a goal's planet can have, stored as
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

/// The palette's first eight, for goals without an own color.
final autoColors = [for (final hex in spacePalette.take(8)) colorFromHex(hex)];

/// The automatic color of a goal at [sortOrder]: by position, so neighbors
/// differ.
Color goalColor(int sortOrder) => autoColors[sortOrder % autoColors.length];

/// The goal's own color, else its automatic one.
Color colorOfGoal(Goal goal) =>
    goal.color == null ? goalColor(goal.sortOrder) : colorFromHex(goal.color!);
