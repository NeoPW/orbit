import 'package:flutter/material.dart';

/// Parses `#RRGGBB` into an opaque color.
Color colorFromHex(String hex) =>
    Color(0xFF000000 | int.parse(hex.replaceFirst('#', ''), radix: 16));

/// A small colored circle for an area.
class AreaDot extends StatelessWidget {
  const AreaDot({super.key, required this.color, this.size = 10});

  /// `#RRGGBB`.
  final String color;
  final double size;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: colorFromHex(color),
        shape: BoxShape.circle,
      ),
    );
  }
}
