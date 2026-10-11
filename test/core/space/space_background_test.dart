import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:orbit/core/db/app_database.dart';
import 'package:orbit/core/router/routes.dart';
import 'package:orbit/core/space/space_background.dart';
import 'package:orbit/core/space/space_images.dart';
import 'package:orbit/core/theme/app_theme.dart';
import 'package:orbit/core/time/today.dart';

import '../../helpers/pump_app.dart';

/// The asset behind the app.
String background(WidgetTester tester) {
  final image = tester.widget<Image>(
    find
        .descendant(
          of: find.byType(SpaceBackground),
          matching: find.byType(Image),
        )
        .first,
  );
  return ((image.image as ResizeImage).imageProvider as AssetImage).assetName;
}

void main() {
  final day = CalendarDate(2026, 10, 11);

  group('space background', () {
    testApp('every screen shows the same photo on one day', (tester) async {
      final app = await pumpApp(
        tester,
        overrides: [todayProvider.overrideWithValue(day)],
      );
      final onHome = background(tester);
      expect(onHome, spaceImageFor(day).asset);
      for (final route in [Routes.plan, Routes.review]) {
        app.router.go(route);
        await tester.pumpAndSettle();
        expect(background(tester), onHome);
      }
    });

    testApp('the next day shows the next photo', (tester) async {
      await pumpApp(
        tester,
        overrides: [todayProvider.overrideWithValue(day.addDays(1))],
      );
      expect(background(tester), spaceImageFor(day.addDays(1)).asset);
      expect(background(tester), isNot(spaceImageFor(day).asset));
    });

    test('the photos are bundled assets, so they work offline', () {
      for (final image in spaceImages) {
        expect(image.asset, startsWith('assets/space/'));
      }
    });
  });

  group('surfaces', () {
    test('cards, top bars and the navigation are translucent', () {
      expect(darkTheme.cardTheme.color!.a, lessThan(1));
      expect(darkTheme.appBarTheme.backgroundColor!.a, lessThan(1));
      expect(darkTheme.navigationBarTheme.backgroundColor!.a, lessThan(1));
    });

    test('sheets and dialogs are opaque', () {
      expect(darkTheme.bottomSheetTheme.backgroundColor!.a, 1);
      expect(darkTheme.bottomSheetTheme.modalBackgroundColor!.a, 1);
      expect(darkTheme.dialogTheme.backgroundColor!.a, 1);
    });
  });
}
