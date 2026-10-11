import 'dart:math';

import 'package:flutter/material.dart';

/// Paints a lit sphere: a highlight towards the top left, the night side
/// towards the bottom right and a soft atmosphere around it.
void paintPlanet(
  Canvas canvas,
  Offset center,
  double radius,
  Color color, {
  double glow = 0.5,
}) {
  if (glow > 0) {
    canvas.drawCircle(
      center,
      radius * 1.6,
      Paint()
        ..shader = RadialGradient(
          colors: [
            color.withValues(alpha: 0.35 * glow),
            color.withValues(alpha: 0),
          ],
        ).createShader(Rect.fromCircle(center: center, radius: radius * 1.6)),
    );
  }
  final rect = Rect.fromCircle(center: center, radius: radius);
  canvas.drawCircle(
    center,
    radius,
    Paint()
      ..shader = RadialGradient(
        center: const Alignment(-0.4, -0.45),
        radius: 1.15,
        colors: [
          Color.lerp(color, Colors.white, 0.55)!,
          color,
          Color.lerp(color, const Color(0xFF02030A), 0.8)!,
        ],
        stops: const [0, 0.45, 1],
      ).createShader(rect),
  );
}

/// Paints a star: a white-hot core in [color] with a corona around it.
/// [intensity] (0–1) scales the corona.
void paintStar(
  Canvas canvas,
  Offset center,
  double radius,
  Color color, {
  double intensity = 1,
}) {
  final corona = radius * (2.4 + 1.2 * intensity);
  canvas.drawCircle(
    center,
    corona,
    Paint()
      ..shader = RadialGradient(
        colors: [
          color.withValues(alpha: 0.55 * intensity + 0.15),
          color.withValues(alpha: 0.12 * intensity + 0.04),
          color.withValues(alpha: 0),
        ],
        stops: const [0, 0.4, 1],
      ).createShader(Rect.fromCircle(center: center, radius: corona)),
  );
  canvas.drawCircle(
    center,
    radius,
    Paint()
      ..shader = RadialGradient(
        colors: [Colors.white, Color.lerp(color, Colors.white, 0.45)!, color],
        stops: const [0, 0.55, 1],
      ).createShader(Rect.fromCircle(center: center, radius: radius)),
  );
}

/// One planet, e.g. for a list row.
class Planet extends StatelessWidget {
  const Planet({super.key, required this.color, this.size = 16, this.glow});

  final Color color;
  final double size;
  final double? glow;

  @override
  Widget build(BuildContext context) => SizedBox.square(
    dimension: size,
    child: CustomPaint(
      painter: _PlanetPainter(color: color, glow: glow ?? 0.5),
    ),
  );
}

class _PlanetPainter extends CustomPainter {
  _PlanetPainter({required this.color, required this.glow});

  final Color color;
  final double glow;

  @override
  void paint(Canvas canvas, Size size) => paintPlanet(
    canvas,
    size.center(Offset.zero),
    size.shortestSide / 2 / 1.25,
    color,
    glow: glow,
  );

  @override
  bool shouldRepaint(_PlanetPainter old) =>
      old.color != color || old.glow != glow;
}

/// A planet of a [StarSystem]: a key result, with its projects as moons.
class SystemPlanet {
  const SystemPlanet({
    required this.label,
    required this.color,
    required this.progress,
    this.moons = const [],
    this.onTap,
  });

  final String label;
  final Color color;

  /// 0–1. Brighter as it grows; a reached KR gets a ring.
  final double progress;

  /// One color per moon.
  final List<Color> moons;
  final VoidCallback? onTap;

  @override
  bool operator ==(Object other) =>
      other is SystemPlanet &&
      other.label == label &&
      other.color == color &&
      other.progress == progress &&
      _listEquals(other.moons, moons);

  @override
  int get hashCode =>
      Object.hash(label, color, progress, Object.hashAll(moons));
}

/// An objective as its own solar system: a star in the objective's color
/// with its key results as planets and their projects as moons.
///
/// Compact (the default): a square icon of `size`, without labels or moons.
/// [StarSystem.detailed]: as wide as it may be and [height] tall, with
/// labeled, tappable planets and their moons.
class StarSystem extends StatelessWidget {
  const StarSystem({
    super.key,
    required this.color,
    required this.progress,
    required this.planets,
    double size = 56,
    this.seed = 0,
  }) : height = size,
       detailed = false;

  const StarSystem.detailed({
    super.key,
    required this.color,
    required this.progress,
    required this.planets,
    this.height = 220,
    this.seed = 0,
  }) : detailed = true;

  final Color color;

  /// 0–1, the objective's progress: the star burns brighter with it.
  final double progress;
  final List<SystemPlanet> planets;
  final double height;
  final bool detailed;

  /// Varies the planets' positions per objective.
  final int seed;

  static const maxPlanets = 6;

  @override
  Widget build(BuildContext context) {
    final percent = (progress.clamp(0.0, 1.0) * 100).round();
    final count = planets.length;
    final label = '$percent percent, $count key result${count == 1 ? '' : 's'}';
    final shown = planets.take(maxPlanets).toList();
    if (!detailed) {
      return Semantics(
        label: label,
        child: SizedBox.square(
          dimension: height,
          child: CustomPaint(
            painter: _SystemPainter(
              geometry: _Geometry.compact(height, shown.length, seed),
              star: color,
              progress: progress.clamp(0.0, 1.0),
              planets: shown,
              moons: false,
            ),
          ),
        ),
      );
    }
    final theme = Theme.of(context);
    return Semantics(
      label: label,
      container: true,
      child: SizedBox(
        height: height,
        child: LayoutBuilder(
          builder: (context, constraints) {
            final geometry = _Geometry.detailed(
              Size(constraints.maxWidth, height),
              shown.length,
              seed,
            );
            return Stack(
              clipBehavior: Clip.none,
              children: [
                Positioned.fill(
                  child: CustomPaint(
                    painter: _SystemPainter(
                      geometry: geometry,
                      star: color,
                      progress: progress.clamp(0.0, 1.0),
                      planets: shown,
                      moons: true,
                    ),
                  ),
                ),
                for (var i = 0; i < shown.length; i++)
                  _label(theme, shown[i], geometry.planet(i), geometry),
              ],
            );
          },
        ),
      ),
    );
  }

  /// The planet's tap target with its label below it.
  Widget _label(
    ThemeData theme,
    SystemPlanet planet,
    Offset at,
    _Geometry geometry,
  ) {
    const width = 120.0;
    final r = geometry.planetRadius;
    return Positioned(
      left: at.dx - width / 2,
      top: at.dy - r * 1.6,
      width: width,
      child: Semantics(
        container: true,
        button: planet.onTap != null,
        label: planet.label,
        child: GestureDetector(
          behavior: HitTestBehavior.opaque,
          onTap: planet.onTap,
          child: ExcludeSemantics(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                SizedBox(height: r * 3.4),
                Text(
                  planet.label,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  textAlign: TextAlign.center,
                  style: theme.textTheme.labelSmall?.copyWith(
                    color: Colors.white.withValues(alpha: 0.9),
                    shadows: const [
                      Shadow(blurRadius: 6, color: Colors.black),
                      Shadow(blurRadius: 2, color: Colors.black),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// Where the star, orbits and planets of a system go.
class _Geometry {
  _Geometry({
    required this.center,
    required this.starRadius,
    required this.planetRadius,
    required this.orbits,
    required this.tilt,
    required this.angles,
  });

  /// A square icon: tilted, flat orbits.
  factory _Geometry.compact(double size, int count, int seed) {
    final extent = size / 2;
    final planetRadius = size * 0.075;
    final first = extent * 0.5;
    final last = extent - planetRadius * 1.2;
    return _Geometry(
      center: Offset(extent, extent),
      starRadius: size * 0.12,
      planetRadius: planetRadius,
      tilt: -0.42,
      orbits: [
        for (var i = 0; i < count; i++)
          _orbit(first, last, i, count, flatten: 0.38),
      ],
      angles: _angles(count, seed),
    );
  }

  /// A wide band: almost level orbits, room below each planet for its
  /// label.
  factory _Geometry.detailed(Size size, int count, int seed) {
    final planetRadius = (size.height * 0.055).clamp(8.0, 14.0);
    final starRadius = size.height * 0.09;
    final maxX = size.width / 2 - 56;
    final maxY = size.height / 2 - 28;
    final first = starRadius * 3;
    return _Geometry(
      center: size.center(Offset.zero),
      starRadius: starRadius,
      planetRadius: planetRadius,
      tilt: -0.08,
      orbits: [
        for (var i = 0; i < count; i++)
          _orbit(first, max(first, maxX), i, count, flatten: maxY / maxX),
      ],
      angles: _angles(count, seed),
    );
  }

  static Size _orbit(
    double first,
    double last,
    int i,
    int count, {
    required double flatten,
  }) {
    final rx = count == 1
        ? (first + last) / 2
        : first + (last - first) * i / (count - 1);
    return Size(rx, rx * flatten);
  }

  /// Spread around the star, so planets on neighboring orbits do not line
  /// up.
  static List<double> _angles(int count, int seed) => [
    for (var i = 0; i < count; i++)
      (seed * 0.37 + 0.6 + i * 2.39996) % (2 * pi),
  ];

  final Offset center;
  final double starRadius;
  final double planetRadius;

  /// Half axes of each orbit's ellipse, before the tilt.
  final List<Size> orbits;
  final double tilt;
  final List<double> angles;

  Offset planet(int i) {
    final a = angles[i];
    final local = Offset(cos(a) * orbits[i].width, sin(a) * orbits[i].height);
    return center +
        Offset(
          local.dx * cos(tilt) - local.dy * sin(tilt),
          local.dx * sin(tilt) + local.dy * cos(tilt),
        );
  }

  /// In front of the star (lower half of the orbit) or behind it.
  bool inFront(int i) => sin(angles[i]) > 0;

  @override
  bool operator ==(Object other) =>
      other is _Geometry &&
      other.center == center &&
      other.starRadius == starRadius &&
      other.tilt == tilt &&
      _listEquals(other.orbits, orbits) &&
      _listEquals(other.angles, angles);

  @override
  int get hashCode => Object.hash(center, starRadius, orbits.length);
}

class _SystemPainter extends CustomPainter {
  _SystemPainter({
    required this.geometry,
    required this.star,
    required this.progress,
    required this.planets,
    required this.moons,
  });

  final _Geometry geometry;
  final Color star;
  final double progress;
  final List<SystemPlanet> planets;
  final bool moons;

  @override
  void paint(Canvas canvas, Size size) {
    final g = geometry;
    final orbitPaint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = moons ? 1 : 0.8
      ..color = star.withValues(alpha: 0.22);
    for (final orbit in g.orbits) {
      canvas.save();
      canvas.translate(g.center.dx, g.center.dy);
      canvas.rotate(g.tilt);
      canvas.drawOval(
        Rect.fromCenter(
          center: Offset.zero,
          width: orbit.width * 2,
          height: orbit.height * 2,
        ),
        orbitPaint,
      );
      canvas.restore();
    }
    // Planets behind the star first, so the star covers them.
    for (var i = 0; i < planets.length; i++) {
      if (!g.inFront(i)) _planet(canvas, i);
    }
    paintStar(
      canvas,
      g.center,
      g.starRadius,
      star,
      intensity: 0.35 + 0.65 * progress,
    );
    for (var i = 0; i < planets.length; i++) {
      if (g.inFront(i)) _planet(canvas, i);
    }
  }

  void _planet(Canvas canvas, int i) {
    final planet = planets[i];
    final at = geometry.planet(i);
    final r = geometry.planetRadius;
    final p = planet.progress.clamp(0.0, 1.0);
    final dim = Color.lerp(planet.color, const Color(0xFF3A3F5C), 0.65)!;
    final color = Color.lerp(dim, planet.color, 0.25 + 0.75 * p)!;
    final done = p >= 1;
    if (done) _ring(canvas, at, r, color, back: true);
    paintPlanet(canvas, at, r, color, glow: 0.2 + 0.6 * p);
    if (done) _ring(canvas, at, r, color, back: false);
    if (!moons) return;
    final count = min(planet.moons.length, 6);
    for (var m = 0; m < count; m++) {
      final angle = -pi / 2 + 0.5 + m * 2 * pi / count;
      final orbit = r * 2.2;
      paintPlanet(
        canvas,
        at + Offset(cos(angle) * orbit, sin(angle) * orbit * 0.6),
        max(3.0, r * 0.45),
        planet.moons[m],
        glow: 0.4,
      );
    }
  }

  void _ring(
    Canvas canvas,
    Offset center,
    double r,
    Color color, {
    required bool back,
  }) {
    canvas.save();
    canvas.translate(center.dx, center.dy);
    canvas.rotate(-0.35);
    canvas.drawArc(
      Rect.fromCenter(center: Offset.zero, width: r * 3.4, height: r),
      back ? pi : 0,
      pi,
      false,
      Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = max(1, r * 0.25)
        ..color = Color.lerp(
          color,
          Colors.white,
          0.4,
        )!.withValues(alpha: back ? 0.4 : 0.85),
    );
    canvas.restore();
  }

  @override
  bool shouldRepaint(_SystemPainter old) =>
      old.geometry != geometry ||
      old.star != star ||
      old.progress != progress ||
      old.moons != moons ||
      !_listEquals(old.planets, planets);
}

bool _listEquals<T>(List<T> a, List<T> b) {
  if (a.length != b.length) return false;
  for (var i = 0; i < a.length; i++) {
    if (a[i] != b[i]) return false;
  }
  return true;
}

/// A seed for [StarSystem.seed] that is the same on every run and platform
/// (unlike [String.hashCode]).
int stableSeed(String id) =>
    id.codeUnits.fold(0, (sum, c) => sum * 31 + c) & 0xFFFF;
