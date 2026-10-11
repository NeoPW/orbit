import 'package:flutter/material.dart';

/// Orbit's colors: "night sky" navy surfaces, a luminous blue-violet
/// primary, cyan as secondary and amber reserved for urgency
/// (visual-design spec, "Orbit palette").
abstract final class OrbitPalette {
  static const dark = ColorScheme(
    brightness: Brightness.dark,
    primary: Color(0xFF8F9DFF),
    onPrimary: Color(0xFF0B1026),
    primaryContainer: Color(0xFF2B3580),
    onPrimaryContainer: Color(0xFFDDE1FF),
    secondary: Color(0xFF4FD8E8),
    onSecondary: Color(0xFF00363D),
    secondaryContainer: Color(0xFF0E4C55),
    onSecondaryContainer: Color(0xFFB8F3FA),
    tertiary: Color(0xFFFFB547),
    onTertiary: Color(0xFF3D2600),
    tertiaryContainer: Color(0xFF5C3B00),
    onTertiaryContainer: Color(0xFFFFDDB0),
    error: Color(0xFFFF6B6B),
    onError: Color(0xFF3B0000),
    errorContainer: Color(0xFF6B1A1A),
    onErrorContainer: Color(0xFFFFDAD6),
    surface: Color(0xFF0B1026),
    onSurface: Color(0xFFE7E9F7),
    onSurfaceVariant: Color(0xFFA6ACCF),
    surfaceContainerLowest: Color(0xFF080C1E),
    surfaceContainerLow: Color(0xFF10162F),
    surfaceContainer: Color(0xFF141B3A),
    surfaceContainerHigh: Color(0xFF1C2550),
    surfaceContainerHighest: Color(0xFF242E5E),
    outline: Color(0xFF4A5385),
    outlineVariant: Color(0xFF2C3566),
    inverseSurface: Color(0xFFE7E9F7),
    onInverseSurface: Color(0xFF141936),
    inversePrimary: Color(0xFF4A57D6),
    surfaceTint: Colors.transparent,
    shadow: Colors.black,
    scrim: Colors.black,
  );
}

/// Orbit colors that have no Material role: urgency, overdue and the
/// track of orbit rings.
@immutable
class OrbitColors extends ThemeExtension<OrbitColors> {
  const OrbitColors({
    required this.urgent,
    required this.onUrgent,
    required this.overdue,
    required this.onOverdue,
    required this.ringTrack,
  });

  static const dark = OrbitColors(
    urgent: Color(0xFFFFB547),
    onUrgent: Color(0xFF3D2600),
    overdue: Color(0xFFFF6B6B),
    onOverdue: Color(0xFF3B0000),
    ringTrack: Color(0xFF242E5E),
  );

  /// Deadlines within the lead time.
  final Color urgent;
  final Color onUrgent;

  /// Deadlines that have passed.
  final Color overdue;
  final Color onOverdue;
  final Color ringTrack;

  static OrbitColors of(BuildContext context) =>
      Theme.of(context).extension<OrbitColors>() ?? dark;

  @override
  OrbitColors copyWith({
    Color? urgent,
    Color? onUrgent,
    Color? overdue,
    Color? onOverdue,
    Color? ringTrack,
  }) => OrbitColors(
    urgent: urgent ?? this.urgent,
    onUrgent: onUrgent ?? this.onUrgent,
    overdue: overdue ?? this.overdue,
    onOverdue: onOverdue ?? this.onOverdue,
    ringTrack: ringTrack ?? this.ringTrack,
  );

  @override
  OrbitColors lerp(OrbitColors? other, double t) => other == null
      ? this
      : OrbitColors(
          urgent: Color.lerp(urgent, other.urgent, t)!,
          onUrgent: Color.lerp(onUrgent, other.onUrgent, t)!,
          overdue: Color.lerp(overdue, other.overdue, t)!,
          onOverdue: Color.lerp(onOverdue, other.onOverdue, t)!,
          ringTrack: Color.lerp(ringTrack, other.ringTrack, t)!,
        );
}
