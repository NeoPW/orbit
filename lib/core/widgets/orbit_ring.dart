import 'dart:math';

import 'package:flutter/material.dart';

import '../theme/orbit_palette.dart';

/// Progress as an orbit: a faint track, the done part as an arc and a small
/// "planet" at its end (visual-design spec, "Progress as orbit rings").
class OrbitRing extends StatelessWidget {
  const OrbitRing({
    super.key,
    required this.progress,
    this.size = 48,
    this.strokeWidth = 4,
    this.label,
    this.color,
  });

  /// 0–1.
  final double progress;
  final double size;
  final double strokeWidth;

  /// Shown in the middle, e.g. "2/4".
  final String? label;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final value = progress.clamp(0.0, 1.0);
    return Semantics(
      label: label ?? '${(value * 100).round()} percent',
      child: SizedBox.square(
        dimension: size,
        child: CustomPaint(
          painter: _OrbitPainter(
            progress: value,
            strokeWidth: strokeWidth,
            track: OrbitColors.of(context).ringTrack,
            arc: color ?? theme.colorScheme.primary,
          ),
          child: label == null
              ? null
              : Center(
                  child: ExcludeSemantics(
                    child: Text(
                      label!,
                      style: theme.textTheme.labelMedium?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ),
        ),
      ),
    );
  }
}

class _OrbitPainter extends CustomPainter {
  _OrbitPainter({
    required this.progress,
    required this.strokeWidth,
    required this.track,
    required this.arc,
  });

  final double progress;
  final double strokeWidth;
  final Color track;
  final Color arc;

  @override
  void paint(Canvas canvas, Size size) {
    final center = size.center(Offset.zero);
    final radius = (size.shortestSide - strokeWidth) / 2 - 2;
    final stroke = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth
      ..strokeCap = StrokeCap.round;
    canvas.drawCircle(center, radius, stroke..color = track);
    if (progress <= 0) return;
    final sweep = 2 * pi * progress;
    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius),
      -pi / 2,
      sweep,
      false,
      stroke..color = arc,
    );
    final end = -pi / 2 + sweep;
    canvas.drawCircle(
      center + Offset(cos(end), sin(end)) * radius,
      strokeWidth * 0.9,
      Paint()..color = arc,
    );
  }

  @override
  bool shouldRepaint(_OrbitPainter old) =>
      old.progress != progress || old.arc != arc || old.track != track;
}
