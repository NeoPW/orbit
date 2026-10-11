// Renders the app icon into the Android and web icon files.
// Run: flutter test tool/icon/render_icons_test.dart
import 'dart:io';
import 'dart:math';
import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:orbit/core/space/planets.dart';

const _night = Color(0xFF0B1026);
const _planet = Color(0xFF8F9DFF);
const _moon = Color(0xFF4FD8E8);

/// [background]: paint the night sky (else transparent, for the adaptive
/// foreground). [scale]: the drawing's size relative to the canvas.
/// [rounded]: corner radius relative to the size, 0 for a full square.
class IconPainter extends CustomPainter {
  IconPainter({this.background = true, this.scale = 1, this.rounded = 0});

  final bool background;
  final double scale;
  final double rounded;

  @override
  void paint(Canvas canvas, Size size) {
    final s = size.shortestSide;
    final center = size.center(Offset.zero);
    if (background) {
      final rect = Offset.zero & size;
      canvas.clipRRect(
        RRect.fromRectAndRadius(rect, Radius.circular(s * rounded)),
      );
      canvas.drawRect(
        rect,
        Paint()
          ..shader = const RadialGradient(
            center: Alignment(-0.2, -0.3),
            radius: 1,
            colors: [Color(0xFF1E2763), _night, Color(0xFF05070F)],
            stops: [0, 0.6, 1],
          ).createShader(rect),
      );
      final rng = Random(7);
      for (var i = 0; i < 40; i++) {
        canvas.drawCircle(
          Offset(rng.nextDouble() * s, rng.nextDouble() * s),
          s * (0.002 + rng.nextDouble() * 0.004),
          Paint()
            ..color = Colors.white.withValues(
              alpha: 0.25 + rng.nextDouble() * 0.5,
            ),
        );
      }
    }
    if (scale == 0) return;
    final u = s * scale;
    const tilt = -0.45;
    final orbit = Rect.fromCenter(
      center: Offset.zero,
      width: u * 0.84,
      height: u * 0.84 * 0.34,
    );
    final ring = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = u * 0.03
      ..strokeCap = StrokeCap.round;

    void drawOrbit({required bool back}) {
      canvas.save();
      canvas.translate(center.dx, center.dy);
      canvas.rotate(tilt);
      canvas.drawArc(
        orbit,
        back ? pi : 0,
        pi,
        false,
        ring..color = Colors.white.withValues(alpha: back ? 0.35 : 0.85),
      );
      canvas.restore();
    }

    drawOrbit(back: true);
    paintPlanet(canvas, center, u * 0.22, _planet, glow: 1);
    drawOrbit(back: false);
    // The moon on the front of the orbit.
    const angle = 0.95;
    final local = Offset(
      cos(angle) * orbit.width / 2,
      sin(angle) * orbit.height / 2,
    );
    final moon =
        center +
        Offset(
          local.dx * cos(tilt) - local.dy * sin(tilt),
          local.dx * sin(tilt) + local.dy * cos(tilt),
        );
    paintPlanet(canvas, moon, u * 0.065, _moon, glow: 1);
  }

  @override
  bool shouldRepaint(IconPainter old) => false;
}

Future<void> render(
  WidgetTester tester,
  String path,
  int px,
  IconPainter painter,
) async {
  final key = GlobalKey();
  await tester.pumpWidget(
    Center(
      child: RepaintBoundary(
        key: key,
        child: SizedBox.square(
          dimension: px.toDouble(),
          child: CustomPaint(painter: painter),
        ),
      ),
    ),
  );
  await tester.runAsync(() async {
    final boundary =
        key.currentContext!.findRenderObject()! as RenderRepaintBoundary;
    final image = await boundary.toImage();
    final bytes = await image.toByteData(format: ui.ImageByteFormat.png);
    File(path)
      ..createSync(recursive: true)
      ..writeAsBytesSync(bytes!.buffer.asUint8List());
  });
}

void main() {
  testWidgets('render icons', (tester) async {
    tester.view.physicalSize = const Size(2000, 2000);
    tester.view.devicePixelRatio = 1;
    const res = 'android/app/src/main/res';
    const densities = {
      'mdpi': 1.0,
      'hdpi': 1.5,
      'xhdpi': 2.0,
      'xxhdpi': 3.0,
      'xxxhdpi': 4.0,
    };
    for (final MapEntry(key: name, value: d) in densities.entries) {
      await render(
        tester,
        '$res/mipmap-$name/ic_launcher.png',
        (48 * d).round(),
        IconPainter(rounded: 0.22),
      );
      // Adaptive icon: 108 dp, of which the inner 72 dp are safe.
      await render(
        tester,
        '$res/mipmap-$name/ic_launcher_foreground.png',
        (108 * d).round(),
        IconPainter(background: false, scale: 0.62),
      );
      await render(
        tester,
        '$res/mipmap-$name/ic_launcher_background.png',
        (108 * d).round(),
        IconPainter(scale: 0),
      );
    }
    await render(
      tester,
      'web/icons/Icon-192.png',
      192,
      IconPainter(rounded: 0.22),
    );
    await render(
      tester,
      'web/icons/Icon-512.png',
      512,
      IconPainter(rounded: 0.22),
    );
    await render(
      tester,
      'web/icons/Icon-maskable-192.png',
      192,
      IconPainter(scale: 0.78),
    );
    await render(
      tester,
      'web/icons/Icon-maskable-512.png',
      512,
      IconPainter(scale: 0.78),
    );
    await render(tester, 'web/favicon.png', 64, IconPainter(rounded: 0.22));
    // Shown centered on the splash screen.
    await render(
      tester,
      '$res/drawable/splash_planet.png',
      288,
      IconPainter(background: false),
    );
  });
}
