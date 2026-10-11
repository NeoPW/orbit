import 'dart:math';

import 'package:flutter/material.dart';

/// The structure on a planet's surface.
enum PlanetSurface { bands, craters, patches }

/// The surface for a planet with [seed], the same on every run.
PlanetSurface surfaceOf(int seed) =>
    PlanetSurface.values[seed % PlanetSurface.values.length];

/// Paints a lit sphere: a highlight towards the top left, the night side
/// towards the bottom right and a soft atmosphere around it. With a
/// [surface], the sphere gets bands, craters or patches laid out from
/// [seed].
void paintPlanet(
  Canvas canvas,
  Offset center,
  double radius,
  Color color, {
  double glow = 0.5,
  PlanetSurface? surface,
  int seed = 0,
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
  if (surface == null) {
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
            Color.lerp(color, _night, 0.8)!,
          ],
          stops: const [0, 0.45, 1],
        ).createShader(rect),
    );
    return;
  }
  canvas.save();
  canvas.clipPath(Path()..addOval(rect));
  canvas.drawCircle(center, radius, Paint()..color = color);
  final random = Random(seed);
  switch (surface) {
    case PlanetSurface.bands:
      _paintBands(canvas, center, radius, color, random);
    case PlanetSurface.craters:
      _paintCraters(canvas, center, radius, color, random);
    case PlanetSurface.patches:
      _paintPatches(canvas, center, radius, color, random);
  }
  // Light from the top left, night towards the bottom right.
  canvas.drawCircle(
    center,
    radius,
    Paint()
      ..shader = RadialGradient(
        center: const Alignment(-0.4, -0.45),
        radius: 1.15,
        colors: [
          Colors.white.withValues(alpha: 0.4),
          Colors.white.withValues(alpha: 0),
          _night.withValues(alpha: 0.88),
        ],
        stops: const [0, 0.45, 1],
      ).createShader(rect),
  );
  canvas.restore();
  // A thin lit rim of atmosphere on the day side.
  canvas.drawArc(
    rect,
    pi * 0.85,
    pi * 0.8,
    false,
    Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = max(0.6, radius * 0.06)
      ..color = Color.lerp(color, Colors.white, 0.6)!.withValues(alpha: 0.45),
  );
}

const _night = Color(0xFF02030A);

Color _lighter(Color color, double t) => Color.lerp(color, Colors.white, t)!;
Color _darker(Color color, double t) => Color.lerp(color, _night, t)!;

/// Gas-giant bands with wavy edges, sometimes with a storm.
void _paintBands(
  Canvas canvas,
  Offset center,
  double radius,
  Color color,
  Random random,
) {
  canvas.save();
  canvas.translate(center.dx, center.dy);
  canvas.rotate(-0.3 + random.nextDouble() * 0.25);
  final phase = random.nextDouble() * 2 * pi;
  double edge(double x, double y) =>
      y + sin(x / radius * 4 + phase + y) * radius * 0.04;
  var y = -radius * (0.9 + random.nextDouble() * 0.2);
  while (y < radius) {
    final height = radius * (0.1 + random.nextDouble() * 0.2);
    final light = random.nextBool();
    final path = Path()..moveTo(-radius * 1.2, edge(-radius * 1.2, y));
    for (var x = -radius; x <= radius * 1.2; x += radius * 0.2) {
      path.lineTo(x, edge(x, y));
    }
    for (var x = radius * 1.2; x >= -radius * 1.2; x -= radius * 0.2) {
      path.lineTo(x, edge(x, y + height));
    }
    path.close();
    canvas.drawPath(
      path,
      Paint()
        ..color = (light ? _lighter(color, 0.35) : _darker(color, 0.35))
            .withValues(alpha: 0.3 + random.nextDouble() * 0.35),
    );
    y += height + radius * (0.03 + random.nextDouble() * 0.12);
  }
  if (random.nextBool()) {
    final storm = Rect.fromCenter(
      center: Offset(radius * 0.25, radius * 0.3),
      width: radius * 0.42,
      height: radius * 0.22,
    );
    canvas.drawOval(storm, Paint()..color = _darker(color, 0.45));
    canvas.drawOval(
      storm.deflate(radius * 0.04),
      Paint()..color = _lighter(color, 0.3).withValues(alpha: 0.8),
    );
  }
  canvas.restore();
}

/// A rocky surface: mottled maria and craters with lit rims.
void _paintCraters(
  Canvas canvas,
  Offset center,
  double radius,
  Color color,
  Random random,
) {
  Offset somewhere(double spread) =>
      center +
      Offset(
        (random.nextDouble() * 2 - 1) * radius * spread,
        (random.nextDouble() * 2 - 1) * radius * spread,
      );
  for (var i = 0; i < 3; i++) {
    canvas.drawCircle(
      somewhere(0.7),
      radius * (0.25 + random.nextDouble() * 0.25),
      Paint()..color = _darker(color, 0.3).withValues(alpha: 0.35),
    );
  }
  final count = radius < 6 ? 3 : 7;
  for (var i = 0; i < count; i++) {
    final at = somewhere(0.85);
    final size = radius * (0.07 + random.nextDouble() * 0.15);
    canvas.drawCircle(
      at,
      size,
      Paint()..color = _darker(color, 0.45).withValues(alpha: 0.7),
    );
    // The rim catches the light on the far side from it.
    canvas.drawArc(
      Rect.fromCircle(center: at, radius: size),
      -pi * 0.25,
      pi,
      false,
      Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = max(0.5, size * 0.3)
        ..color = _lighter(color, 0.45).withValues(alpha: 0.6),
    );
  }
}

/// Continents in a shifted hue with wisps of cloud over them.
void _paintPatches(
  Canvas canvas,
  Offset center,
  double radius,
  Color color,
  Random random,
) {
  final hsl = HSLColor.fromColor(color);
  final land = hsl
      .withHue((hsl.hue + 35 + random.nextDouble() * 30) % 360)
      .withLightness((hsl.lightness * 0.8).clamp(0.0, 1.0))
      .toColor();
  for (var i = 0; i < 4; i++) {
    final at =
        center +
        Offset.fromDirection(
          random.nextDouble() * 2 * pi,
          radius * random.nextDouble() * 0.7,
        );
    final size = radius * (0.25 + random.nextDouble() * 0.3);
    const corners = 9;
    final points = [
      for (var c = 0; c < corners; c++)
        at +
            Offset.fromDirection(
              c * 2 * pi / corners,
              size * (0.6 + random.nextDouble() * 0.5),
            ),
    ];
    final path = Path()..moveTo(points.last.dx, points.last.dy);
    for (var c = 0; c < corners; c++) {
      final next = points[(c + 1) % corners];
      final mid = Offset.lerp(points[c], next, 0.5)!;
      path.quadraticBezierTo(points[c].dx, points[c].dy, mid.dx, mid.dy);
    }
    canvas.drawPath(path, Paint()..color = land.withValues(alpha: 0.75));
  }
  final cloud = Paint()
    ..style = PaintingStyle.stroke
    ..strokeCap = StrokeCap.round
    ..strokeWidth = max(0.6, radius * 0.08)
    ..color = Colors.white.withValues(alpha: 0.3);
  for (var i = 0; i < 3; i++) {
    final y = center.dy + (random.nextDouble() * 2 - 1) * radius * 0.7;
    final x = center.dx + (random.nextDouble() * 2 - 1) * radius * 0.5;
    canvas.drawLine(
      Offset(x - radius * 0.35, y),
      Offset(x + radius * 0.35, y - radius * 0.06),
      cloud,
    );
  }
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

/// Paints a ring around a planet at [center] with [radius]: the back half
/// ([back] true) goes behind the planet, the front half in front of it.
void paintRing(
  Canvas canvas,
  Offset center,
  double radius,
  Color color, {
  required bool back,
}) {
  canvas.save();
  canvas.translate(center.dx, center.dy);
  canvas.rotate(-0.35);
  canvas.drawArc(
    Rect.fromCenter(center: Offset.zero, width: radius * 3.4, height: radius),
    back ? pi : 0,
    pi,
    false,
    Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = max(1, radius * 0.25)
      ..color = Color.lerp(
        color,
        Colors.white,
        0.4,
      )!.withValues(alpha: back ? 0.4 : 0.85),
  );
  canvas.restore();
}

/// The color a goal's planet is drawn in: dimmer at low [progress] (null
/// for a goal without measures, drawn at medium brightness).
Color planetShade(Color color, double? progress) {
  final dim = Color.lerp(color, const Color(0xFF3A3F5C), 0.6)!;
  return Color.lerp(dim, color, 0.3 + 0.7 * (progress ?? 0.5))!;
}

/// Paints a goal's planet with its [moons] (project area colors) around it,
/// and a ring when [ringed].
void paintGoalPlanet(
  Canvas canvas,
  Offset center,
  double radius,
  Color color, {
  double? progress,
  bool ringed = false,
  List<Color> moons = const [],
  int seed = 0,
}) {
  final shade = planetShade(color, progress);
  final count = min(moons.length, 6);
  final orbit = Size(radius * 2, radius * 2 * 0.62);
  final moonRadius = max(3.2, radius * 0.4);
  if (count > 0) {
    canvas.drawOval(
      Rect.fromCenter(
        center: center,
        width: orbit.width * 2,
        height: orbit.height * 2,
      ),
      Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = 0.6
        ..color = Colors.white.withValues(alpha: 0.12),
    );
  }
  // Moons on the far side of the orbit go behind the planet.
  void paintMoons({required bool far}) {
    for (var i = 0; i < count; i++) {
      final angle = seed * 0.37 - pi / 2 + 0.5 + i * 2 * pi / count;
      if ((sin(angle) < 0) != far) continue;
      paintPlanet(
        canvas,
        center + Offset(cos(angle) * orbit.width, sin(angle) * orbit.height),
        moonRadius,
        moons[i],
        glow: 0.25,
        surface: PlanetSurface.craters,
        seed: seed * 7 + i,
      );
    }
  }

  paintMoons(far: true);
  if (ringed) paintRing(canvas, center, radius, shade, back: true);
  paintPlanet(
    canvas,
    center,
    radius,
    shade,
    glow: 0.3 + 0.6 * (progress ?? 0.5),
    surface: surfaceOf(seed),
    seed: seed,
  );
  if (ringed) paintRing(canvas, center, radius, shade, back: false);
  paintMoons(far: false);
}

/// A goal's planet with its moons, e.g. in a page header or a list.
class GoalPlanet extends StatelessWidget {
  const GoalPlanet({
    super.key,
    required this.color,
    this.progress,
    this.ringed = false,
    this.moons = const [],
    this.size = 48,
    this.seed = 0,
  });

  final Color color;

  /// 0–1; null for a goal without measures.
  final double? progress;
  final bool ringed;

  /// One area color per moon (at most six are drawn).
  final List<Color> moons;
  final double size;
  final int seed;

  @override
  Widget build(BuildContext context) => ExcludeSemantics(
    child: SizedBox.square(
      dimension: size,
      child: CustomPaint(
        painter: _GoalPlanetPainter(
          color: color,
          progress: progress,
          ringed: ringed,
          moons: moons,
          seed: seed,
        ),
      ),
    ),
  );
}

class _GoalPlanetPainter extends CustomPainter {
  _GoalPlanetPainter({
    required this.color,
    required this.progress,
    required this.ringed,
    required this.moons,
    required this.seed,
  });

  final Color color;
  final double? progress;
  final bool ringed;
  final List<Color> moons;
  final int seed;

  @override
  void paint(Canvas canvas, Size size) => paintGoalPlanet(
    canvas,
    size.center(Offset.zero),
    // Room for the moons' orbit around the planet.
    // The same size with or without moons, so planets compare.
    size.shortestSide / 2 / 2.5,
    color,
    progress: progress,
    ringed: ringed,
    moons: moons,
    seed: seed,
  );

  @override
  bool shouldRepaint(_GoalPlanetPainter old) =>
      old.color != color ||
      old.progress != progress ||
      old.ringed != ringed ||
      old.seed != seed ||
      !_listEquals(old.moons, moons);
}

bool _listEquals<T>(List<T> a, List<T> b) {
  if (a.length != b.length) return false;
  for (var i = 0; i < a.length; i++) {
    if (a[i] != b[i]) return false;
  }
  return true;
}

/// A seed for drawing positions that is the same on every run and platform
/// (unlike [String.hashCode]).
int stableSeed(String id) =>
    id.codeUnits.fold(0, (sum, c) => sum * 31 + c) & 0xFFFF;
