import 'dart:math';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:orbit/core/theme/app_theme.dart';
import 'package:orbit/core/theme/orbit_palette.dart';

/// WCAG relative luminance.
double luminance(Color c) {
  double channel(double v) =>
      v <= 0.03928 ? v / 12.92 : pow((v + 0.055) / 1.055, 2.4).toDouble();
  return 0.2126 * channel(c.r) + 0.7152 * channel(c.g) + 0.0722 * channel(c.b);
}

double contrast(Color a, Color b) {
  final la = luminance(a), lb = luminance(b);
  return (max(la, lb) + 0.05) / (min(la, lb) + 0.05);
}

void main() {
  test('both themes use Inter', () {
    for (final theme in [lightTheme, darkTheme]) {
      expect(theme.textTheme.bodyMedium!.fontFamily, appFontFamily);
      expect(theme.textTheme.titleLarge!.fontFamily, 'Inter');
    }
  });

  test('both themes carry the Orbit colors', () {
    expect(darkTheme.colorScheme.surface, OrbitPalette.dark.surface);
    expect(lightTheme.colorScheme.primary, OrbitPalette.light.primary);
    expect(darkTheme.extension<OrbitColors>(), OrbitColors.dark);
    expect(lightTheme.extension<OrbitColors>(), OrbitColors.light);
  });

  for (final (name, scheme) in [
    ('dark', OrbitPalette.dark),
    ('light', OrbitPalette.light),
  ]) {
    test('$name: body text contrast is at least 4.5:1', () {
      for (final background in [scheme.surface, scheme.surfaceContainer]) {
        for (final text in [scheme.onSurface, scheme.onSurfaceVariant]) {
          expect(
            contrast(text, background),
            greaterThanOrEqualTo(4.5),
            reason: '$text on $background',
          );
        }
      }
      expect(contrast(scheme.onPrimary, scheme.primary), greaterThan(4.5));
    });
  }
}
