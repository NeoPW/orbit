import 'package:flutter/material.dart';

import 'orbit_palette.dart';

/// The app font, bundled (assets/fonts).
const appFontFamily = 'Inter';

final lightTheme = _theme(OrbitPalette.light, OrbitColors.light);
final darkTheme = _theme(OrbitPalette.dark, OrbitColors.dark);

ThemeData _theme(ColorScheme colors, OrbitColors orbit) {
  final base = ThemeData(
    useMaterial3: true,
    colorScheme: colors,
    fontFamily: appFontFamily,
  );
  final text = _textTheme(base.textTheme, colors);
  final rounded12 = RoundedRectangleBorder(
    borderRadius: BorderRadius.circular(12),
  );
  return base.copyWith(
    textTheme: text,
    scaffoldBackgroundColor: colors.surface,
    extensions: [orbit],
    appBarTheme: AppBarTheme(
      backgroundColor: colors.surface,
      foregroundColor: colors.onSurface,
      surfaceTintColor: Colors.transparent,
      elevation: 0,
      scrolledUnderElevation: 0,
      centerTitle: false,
      titleTextStyle: text.titleLarge,
    ),
    cardTheme: CardThemeData(
      color: colors.surfaceContainer,
      elevation: 0,
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(color: colors.outlineVariant.withValues(alpha: 0.5)),
      ),
    ),
    chipTheme: ChipThemeData(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
      side: BorderSide(color: colors.outlineVariant),
      labelStyle: text.labelMedium,
      padding: const EdgeInsets.symmetric(horizontal: 6),
    ),
    listTileTheme: ListTileThemeData(
      contentPadding: const EdgeInsets.symmetric(horizontal: 16),
      minVerticalPadding: 6,
      visualDensity: VisualDensity.compact,
      titleTextStyle: text.bodyLarge,
      subtitleTextStyle: text.bodySmall?.copyWith(
        color: colors.onSurfaceVariant,
      ),
    ),
    navigationBarTheme: NavigationBarThemeData(
      height: 68,
      backgroundColor: colors.surfaceContainerLow,
      indicatorColor: colors.primaryContainer,
      labelTextStyle: WidgetStatePropertyAll(text.labelMedium),
    ),
    navigationRailTheme: NavigationRailThemeData(
      backgroundColor: colors.surfaceContainerLow,
      indicatorColor: colors.primaryContainer,
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: colors.surfaceContainerHigh,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide.none,
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide.none,
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: colors.primary, width: 2),
      ),
    ),
    floatingActionButtonTheme: FloatingActionButtonThemeData(
      backgroundColor: colors.primary,
      foregroundColor: colors.onPrimary,
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(shape: rounded12),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(shape: rounded12),
    ),
    dividerTheme: DividerThemeData(color: colors.outlineVariant, space: 1),
    progressIndicatorTheme: ProgressIndicatorThemeData(
      linearTrackColor: orbit.ringTrack,
    ),
    pageTransitionsTheme: const PageTransitionsTheme(
      builders: {
        TargetPlatform.android: FadeForwardsPageTransitionsBuilder(),
        TargetPlatform.iOS: FadeForwardsPageTransitionsBuilder(),
        TargetPlatform.linux: FadeForwardsPageTransitionsBuilder(),
        TargetPlatform.macOS: FadeForwardsPageTransitionsBuilder(),
        TargetPlatform.windows: FadeForwardsPageTransitionsBuilder(),
        TargetPlatform.fuchsia: FadeForwardsPageTransitionsBuilder(),
      },
    ),
  );
}

/// Bold titles, slightly smaller body text, muted secondary text.
TextTheme _textTheme(TextTheme base, ColorScheme colors) {
  TextStyle? weight(TextStyle? style, FontWeight w, [double? size]) =>
      style?.copyWith(fontWeight: w, fontSize: size ?? style.fontSize);
  return base.copyWith(
    headlineSmall: weight(base.headlineSmall, FontWeight.w700, 24),
    titleLarge: weight(base.titleLarge, FontWeight.w600, 20),
    titleMedium: weight(base.titleMedium, FontWeight.w600, 16),
    titleSmall: weight(base.titleSmall, FontWeight.w600, 14),
    bodyLarge: base.bodyLarge?.copyWith(fontSize: 15),
    bodySmall: base.bodySmall?.copyWith(
      fontSize: 12.5,
      color: colors.onSurfaceVariant,
    ),
    labelLarge: weight(base.labelLarge, FontWeight.w500),
    labelMedium: weight(base.labelMedium, FontWeight.w500),
    labelSmall: weight(base.labelSmall, FontWeight.w500),
  );
}
