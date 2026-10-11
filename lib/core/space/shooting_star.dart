import 'dart:math';

import 'package:flutter/material.dart';

/// Draws a shooting star across [child] once each time [shots] grows.
/// Nothing is drawn when animations are disabled.
class ShootingStar extends StatefulWidget {
  const ShootingStar({super.key, required this.shots, required this.child});

  final int shots;
  final Widget child;

  @override
  State<ShootingStar> createState() => _ShootingStarState();
}

class _ShootingStarState extends State<ShootingStar>
    with SingleTickerProviderStateMixin {
  late final _controller = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 1100),
  );

  @override
  void didUpdateWidget(ShootingStar old) {
    super.didUpdateWidget(old);
    if (widget.shots > old.shots && !MediaQuery.disableAnimationsOf(context)) {
      _controller.forward(from: 0);
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => Stack(
    children: [
      widget.child,
      Positioned.fill(
        child: IgnorePointer(
          child: AnimatedBuilder(
            animation: _controller,
            builder: (context, _) => _controller.isAnimating
                ? CustomPaint(
                    painter: _StarPainter(
                      Curves.easeOutCubic.transform(_controller.value),
                    ),
                  )
                : const SizedBox.shrink(),
          ),
        ),
      ),
    ],
  );
}

class _StarPainter extends CustomPainter {
  _StarPainter(this.t);

  final double t;

  @override
  void paint(Canvas canvas, Size size) {
    // From the top right towards the bottom left, fading out at the end.
    final from = Offset(size.width * 0.95, size.height * 0.05);
    final to = Offset(size.width * 0.15, size.height * 0.85);
    final head = Offset.lerp(from, to, t)!;
    final tail = Offset.lerp(from, to, max(0, t - 0.35))!;
    final fade = t < 0.8 ? 1.0 : (1 - t) / 0.2;
    canvas.drawLine(
      tail,
      head,
      Paint()
        ..strokeWidth = 2.2
        ..strokeCap = StrokeCap.round
        ..shader = LinearGradient(
          colors: [
            Colors.white.withValues(alpha: 0),
            Colors.white.withValues(alpha: 0.9 * fade),
          ],
        ).createShader(Rect.fromPoints(tail, head)),
    );
    canvas.drawCircle(
      head,
      6,
      Paint()
        ..color = Colors.white.withValues(alpha: 0.35 * fade)
        ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 4),
    );
    canvas.drawCircle(
      head,
      1.8,
      Paint()..color = Colors.white.withValues(alpha: fade),
    );
  }

  @override
  bool shouldRepaint(_StarPainter old) => old.t != t;
}
