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

  static const light = ColorScheme(
    brightness: Brightness.light,
    primary: Color(0xFF4A57D6),
    onPrimary: Color(0xFFFFFFFF),
    primaryContainer: Color(0xFFDDE1FF),
    onPrimaryContainer: Color(0xFF121A6B),
    secondary: Color(0xFF0A8FA3),
    onSecondary: Color(0xFFFFFFFF),
    secondaryContainer: Color(0xFFC6F3F8),
    onSecondaryContainer: Color(0xFF00363D),
    tertiary: Color(0xFFB86E00),
    onTertiary: Color(0xFFFFFFFF),
    tertiaryContainer: Color(0xFFFFE1B8),
    onTertiaryContainer: Color(0xFF3D2600),
    error: Color(0xFFC93C3C),
    onError: Color(0xFFFFFFFF),
    errorContainer: Color(0xFFFFDAD6),
    onErrorContainer: Color(0xFF410002),
    surface: Color(0xFFF4F5FB),
    onSurface: Color(0xFF141936),
    onSurfaceVariant: Color(0xFF525A82),
    surfaceContainerLowest: Color(0xFFFFFFFF),
    surfaceContainerLow: Color(0xFFFAFBFE),
    surfaceContainer: Color(0xFFFFFFFF),
    surfaceContainerHigh: Color(0xFFECEEF8),
    surfaceContainerHighest: Color(0xFFE3E6F3),
    outline: Color(0xFF8088AE),
    outlineVariant: Color(0xFFD9DCEC),
    inverseSurface: Color(0xFF141936),
    onInverseSurface: Color(0xFFF4F5FB),
    inversePrimary: Color(0xFF8F9DFF),
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

  static const light = OrbitColors(
    urgent: Color(0xFFB86E00),
    onUrgent: Color(0xFFFFFFFF),
    overdue: Color(0xFFC93C3C),
    onOverdue: Color(0xFFFFFFFF),
    ringTrack: Color(0xFFE3E6F3),
  );

  /// Deadlines within the lead time.
  final Color urgent;
  final Color onUrgent;

  /// Deadlines that have passed.
  final Color overdue;
  final Color onOverdue;
  final Color ringTrack;

  static OrbitColors of(BuildContext context) =>
      Theme.of(context).extension<OrbitColors>() ??
      (Theme.of(context).brightness == Brightness.dark ? dark : light);

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
