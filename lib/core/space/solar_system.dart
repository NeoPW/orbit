import 'dart:math';

import 'package:flutter/material.dart';

import 'planets.dart';

/// A goal in the [SolarSystem].
class SolarPlanet {
  const SolarPlanet({
    required this.id,
    required this.label,
    required this.color,
    this.progress,
    this.ringed = false,
    this.moons = const [],
  });

  final String id;
  final String label;
  final Color color;

  /// 0–1; null for a goal without measures.
  final double? progress;

  /// Every measure reached.
  final bool ringed;

  /// The area colors of its active projects.
  final List<Color> moons;
}

/// A project without an active goal: a loose asteroid.
class SolarAsteroid {
  const SolarAsteroid({
    required this.id,
    required this.label,
    required this.color,
  });

  final String id;
  final String label;
  final Color color;
}

/// A planet placed on its orbit.
class PlacedPlanet {
  const PlacedPlanet(
    this.planet,
    this.center,
    this.orbit,
    this.angle, {
    required this.labelBelow,
  });

  final SolarPlanet planet;
  final Offset center;

  /// Whether the label goes below the planet (else above).
  final bool labelBelow;

  /// Half axes of the orbit's ellipse around the sun.
  final Size orbit;
  final double angle;
}

/// An asteroid placed on the belt, with its outline around [center].
class PlacedAsteroid {
  const PlacedAsteroid(this.asteroid, this.center, this.outline);

  final SolarAsteroid asteroid;
  final Offset center;
  final List<Offset> outline;
}

/// Where everything of a [SolarSystem] goes in [size] (solar-system spec):
/// the sun in the middle, one orbit per planet in the given order (the first
/// innermost), and outside the outermost orbit a belt with at most
/// [SolarLayout.maxAsteroids] asteroids. Planet positions depend only on
/// the order, asteroid positions on their IDs, so they stay put between
/// frames and runs.
class SolarLayout {
  SolarLayout._({
    required this.sun,
    required this.sunRadius,
    required this.planetRadius,
    required this.planets,
    required this.belt,
    required this.asteroids,
  });

  static const maxAsteroids = 12;

  factory SolarLayout(
    Size size,
    List<SolarPlanet> planets,
    List<SolarAsteroid> asteroids,
  ) {
    final sun = size.center(Offset.zero);
    final sunRadius = min(size.height * 0.07, 16.0);
    final planetRadius = (size.height * 0.055).clamp(8.0, 15.0);
    // Room for the labels below the planets and at the sides.
    final maxX = max(size.width / 2 - 48, sunRadius * 4);
    final maxY = max(size.height / 2 - 30, sunRadius * 2);
    final flatten = maxY / maxX;
    final shown = asteroids.take(maxAsteroids).toList();
    final outermost = shown.isEmpty ? maxX : maxX * 0.82;
    // The innermost orbit keeps its label clear of the sun.
    final first = min(max(sunRadius * 3.2, outermost * 0.42), outermost);

    final placedPlanets = <PlacedPlanet>[];
    for (final (i, planet) in planets.indexed) {
      final rx = planets.length == 1
          ? (first + outermost) / 2
          : first + (outermost - first) * i / (planets.length - 1);
      final orbit = Size(rx, rx * flatten);
      // Golden-angle steps keep neighboring planets far apart.
      final angle = (0.9 + i * 2.39996) % (2 * pi);
      final center =
          sun + Offset(cos(angle) * orbit.width, sin(angle) * orbit.height);
      placedPlanets.add(
        PlacedPlanet(
          planet,
          center,
          orbit,
          angle,
          // Below in the lower half, above in the upper half: clear of the
          // sun.
          labelBelow: center.dy >= sun.dy,
        ),
      );
    }

    final belt = Size(maxX, maxY);
    final placedAsteroids = [
      for (final asteroid in shown)
        _placeAsteroid(asteroid, sun, belt, planetRadius),
    ];

    return SolarLayout._(
      sun: sun,
      sunRadius: sunRadius,
      planetRadius: planetRadius,
      planets: placedPlanets,
      belt: belt,
      asteroids: placedAsteroids,
    );
  }

  /// The low layout for Home (solar-system spec, "Compact on Home"): the sun
  /// cut in half at the left edge, the planets in a row to its right in the
  /// given order, each where its orbit arc crosses the sun's axis, and the
  /// asteroids on a belt arc beyond the last planet. Labels alternate below
  /// and above, so neighbors don't overlap.
  factory SolarLayout.row(
    Size size,
    List<SolarPlanet> planets,
    List<SolarAsteroid> asteroids,
  ) {
    // Small enough that its corona fits the height (see the painter).
    final sunRadius = min(size.height * 0.17, 26.0);
    final sun = Offset(0, size.height / 2);
    final planetRadius = (size.height * 0.055).clamp(8.0, 15.0);
    final shown = asteroids.take(maxAsteroids).toList();
    final first = sunRadius + 52;
    // Loose asteroids sit up to 5 % outside the belt; keep them in view.
    final beltX = size.width / 1.05 - 12;
    final last = max(first, shown.isEmpty ? size.width - 44 : beltX - 40);
    // Arcs, not flat rings: taller than half the height, so they leave the
    // picture at the top and bottom.
    const flatten = 0.85;

    final placedPlanets = [
      for (final (i, planet) in planets.indexed)
        () {
          final rx = planets.length == 1
              ? (first + last) / 2
              : first + (last - first) * i / (planets.length - 1);
          return PlacedPlanet(
            planet,
            sun + Offset(rx, 0),
            Size(rx, rx * flatten),
            0,
            labelBelow: i.isEven,
          );
        }(),
    ];

    final belt = Size(beltX, beltX * flatten);
    // Only the part of the belt inside the picture.
    final visible = asin(((size.height / 2 - 12) / belt.height).clamp(0, 1));
    final placedAsteroids = [
      for (final asteroid in shown)
        _placeAsteroid(
          asteroid,
          sun,
          belt,
          planetRadius,
          angles: (-visible, visible),
        ),
    ];

    return SolarLayout._(
      sun: sun,
      sunRadius: sunRadius,
      planetRadius: planetRadius,
      planets: placedPlanets,
      belt: belt,
      asteroids: placedAsteroids,
    );
  }

  static PlacedAsteroid _placeAsteroid(
    SolarAsteroid asteroid,
    Offset sun,
    Size belt,
    double planetRadius, {
    (double, double) angles = (0, 2 * pi),
  }) {
    final random = Random(seedOf(asteroid.id));
    final angle = angles.$1 + random.nextDouble() * (angles.$2 - angles.$1);
    // Loose: a little inside or outside the belt.
    final spread = 0.93 + random.nextDouble() * 0.12;
    final center =
        sun +
        Offset(
          cos(angle) * belt.width * spread,
          sin(angle) * belt.height * spread,
        );
    final size = planetRadius * (0.4 + random.nextDouble() * 0.2);
    const corners = 7;
    final outline = [
      for (var i = 0; i < corners; i++)
        Offset.fromDirection(
          i * 2 * pi / corners,
          size * (0.7 + random.nextDouble() * 0.45),
        ),
    ];
    return PlacedAsteroid(asteroid, center, outline);
  }

  final Offset sun;
  final double sunRadius;
  final double planetRadius;
  final List<PlacedPlanet> planets;

  /// Half axes of the asteroid belt's ellipse.
  final Size belt;
  final List<PlacedAsteroid> asteroids;
}

/// A seed from [id] that is the same on every run and platform.
int seedOf(String id) => stableSeed(id);

/// The whole of the user's work as one solar system (solar-system spec): a
/// sun, the [planets] (goals) with labels and moons, and the [asteroids]
/// (projects without an active goal). Tapping a planet calls [onPlanet],
/// an asteroid [onAsteroid]. Drawn once, without animation.
class SolarSystem extends StatelessWidget {
  const SolarSystem({
    super.key,
    required this.planets,
    this.asteroids = const [],
    this.onPlanet,
    this.onAsteroid,
    this.sunColor = const Color(0xFFFFB547),
    this.compact = false,
  });

  /// Low, for Home: [compactHeight] high with the [SolarLayout.row] layout.
  final bool compact;

  static const compactHeight = 150.0;

  final List<SolarPlanet> planets;
  final List<SolarAsteroid> asteroids;
  final ValueChanged<SolarPlanet>? onPlanet;
  final ValueChanged<SolarAsteroid>? onAsteroid;
  final Color sunColor;

  /// Taller with more than four goals, so their orbits stay apart.
  double get height => compact
      ? compactHeight
      : planets.length > 4
      ? 280
      : 240;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final goals = planets.length == 1 ? '1 goal' : '${planets.length} goals';
    return Semantics(
      container: true,
      label: 'Solar system with $goals',
      child: SizedBox(
        height: height,
        child: LayoutBuilder(
          builder: (context, constraints) {
            final size = Size(constraints.maxWidth, height);
            final layout = compact
                ? SolarLayout.row(size, planets, asteroids)
                : SolarLayout(size, planets, asteroids);
            return Stack(
              // The row's sun and arcs run past the edges.
              clipBehavior: compact ? Clip.hardEdge : Clip.none,
              children: [
                Positioned.fill(
                  child: CustomPaint(
                    painter: _SolarPainter(
                      layout,
                      sunColor: sunColor,
                      // A soft corona that stays inside the low strip.
                      sunIntensity: compact ? 0.3 : 0.8,
                    ),
                  ),
                ),
                for (final placed in layout.planets)
                  _planetLabel(theme, placed, layout),
                for (final placed in layout.asteroids)
                  Positioned(
                    left: placed.center.dx - 16,
                    top: placed.center.dy - 16,
                    width: 32,
                    height: 32,
                    child: Semantics(
                      container: true,
                      button: onAsteroid != null,
                      label: placed.asteroid.label,
                      child: GestureDetector(
                        behavior: HitTestBehavior.opaque,
                        onTap: onAsteroid == null
                            ? null
                            : () => onAsteroid!(placed.asteroid),
                      ),
                    ),
                  ),
              ],
            );
          },
        ),
      ),
    );
  }
}

/// The planet's tap target with its label, below or above the planet as
/// the layout says.
extension on SolarSystem {
  Widget _planetLabel(
    ThemeData theme,
    PlacedPlanet placed,
    SolarLayout layout,
  ) {
    final r = layout.planetRadius;
    final below = placed.labelBelow;
    const labelHeight = 18.0;
    final label = Text(
      placed.planet.label,
      maxLines: 1,
      overflow: TextOverflow.ellipsis,
      textAlign: TextAlign.center,
      style: theme.textTheme.labelSmall?.copyWith(
        color: Colors.white.withValues(alpha: 0.92),
        shadows: const [
          Shadow(blurRadius: 6, color: Colors.black),
          Shadow(blurRadius: 2, color: Colors.black),
        ],
      ),
    );
    final planetArea = SizedBox(height: r * 3.2);
    return Positioned(
      left: placed.center.dx - 60,
      top: below
          ? placed.center.dy - r * 1.6
          : placed.center.dy - r * 1.6 - labelHeight,
      width: 120,
      child: Semantics(
        container: true,
        button: onPlanet != null,
        label: placed.planet.label,
        child: GestureDetector(
          behavior: HitTestBehavior.opaque,
          onTap: onPlanet == null ? null : () => onPlanet!(placed.planet),
          child: ExcludeSemantics(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: below
                  ? [planetArea, SizedBox(height: labelHeight, child: label)]
                  : [SizedBox(height: labelHeight, child: label), planetArea],
            ),
          ),
        ),
      ),
    );
  }
}

class _SolarPainter extends CustomPainter {
  _SolarPainter(
    this.layout, {
    required this.sunColor,
    required this.sunIntensity,
  });

  final SolarLayout layout;
  final Color sunColor;
  final double sunIntensity;

  @override
  void paint(Canvas canvas, Size size) {
    final orbit = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1;
    for (final placed in layout.planets) {
      canvas.drawOval(
        Rect.fromCenter(
          center: layout.sun,
          width: placed.orbit.width * 2,
          height: placed.orbit.height * 2,
        ),
        orbit..color = placed.planet.color.withValues(alpha: 0.22),
      );
    }
    if (layout.asteroids.isNotEmpty) {
      // A faint dotted belt.
      final dot = Paint()..color = Colors.white.withValues(alpha: 0.14);
      for (var a = 0.0; a < 2 * pi; a += pi / 40) {
        canvas.drawCircle(
          layout.sun +
              Offset(cos(a) * layout.belt.width, sin(a) * layout.belt.height),
          0.8,
          dot,
        );
      }
    }
    paintStar(
      canvas,
      layout.sun,
      layout.sunRadius,
      sunColor,
      intensity: sunIntensity,
    );
    for (final placed in layout.planets) {
      paintGoalPlanet(
        canvas,
        placed.center,
        layout.planetRadius,
        placed.planet.color,
        progress: placed.planet.progress,
        ringed: placed.planet.ringed,
        moons: placed.planet.moons,
        seed: seedOf(placed.planet.id),
      );
    }
    for (final placed in layout.asteroids) {
      final path = Path()
        ..addPolygon([for (final p in placed.outline) placed.center + p], true);
      final bounds = path.getBounds();
      canvas.drawPath(
        path,
        Paint()
          ..shader = RadialGradient(
            center: const Alignment(-0.4, -0.4),
            colors: [
              Color.lerp(placed.asteroid.color, Colors.white, 0.35)!,
              Color.lerp(placed.asteroid.color, const Color(0xFF02030A), 0.55)!,
            ],
          ).createShader(bounds),
      );
    }
  }

  @override
  bool shouldRepaint(_SolarPainter old) =>
      old.layout != layout ||
      old.sunColor != sunColor ||
      old.sunIntensity != sunIntensity;
}
