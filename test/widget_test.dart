import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:orbit/core/theme/app_theme.dart';

import 'helpers/pump_app.dart';

void main() {
  testApp('app starts on Home with Material 3 light and dark themes', (
    tester,
  ) async {
    await pumpApp(tester);

    expect(find.text('Home'), findsWidgets);
    final app = tester.widget<MaterialApp>(find.byType(MaterialApp));
    expect(app.themeMode, ThemeMode.system);
    expect(app.theme, same(lightTheme));
    expect(app.darkTheme, same(darkTheme));
    expect(lightTheme.useMaterial3, isTrue);
    expect(darkTheme.colorScheme.brightness, Brightness.dark);
  });

  testApp('dark system brightness uses the dark theme', (tester) async {
    tester.platformDispatcher.platformBrightnessTestValue = Brightness.dark;
    addTearDown(tester.platformDispatcher.clearPlatformBrightnessTestValue);
    await pumpApp(tester);

    final context = tester.element(find.byType(Scaffold).first);
    expect(Theme.of(context).brightness, Brightness.dark);
  });
}
