import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:orbit/core/theme/app_theme.dart';

import 'helpers/pump_app.dart';

void main() {
  testApp('app starts on Home with the dark Material 3 theme only', (
    tester,
  ) async {
    await pumpApp(tester);

    expect(find.text('Home'), findsWidgets);
    final app = tester.widget<MaterialApp>(find.byType(MaterialApp));
    expect(app.themeMode, ThemeMode.dark);
    expect(app.theme, same(darkTheme));
    expect(darkTheme.useMaterial3, isTrue);
    expect(darkTheme.colorScheme.brightness, Brightness.dark);
  });

  testApp('light system brightness still uses the dark theme', (tester) async {
    tester.platformDispatcher.platformBrightnessTestValue = Brightness.light;
    addTearDown(tester.platformDispatcher.clearPlatformBrightnessTestValue);
    await pumpApp(tester);

    final context = tester.element(find.byType(Scaffold).first);
    expect(Theme.of(context).brightness, Brightness.dark);
  });
}
