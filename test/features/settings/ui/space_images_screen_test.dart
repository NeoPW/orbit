import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:orbit/core/db/app_database.dart';
import 'package:orbit/core/router/routes.dart';
import 'package:orbit/core/space/space_background.dart';
import 'package:orbit/core/space/space_images.dart';

import '../../../helpers/pump_app.dart';
import '../../../helpers/test_db.dart';

void main() {
  late AppDatabase db;
  setUp(() => db = newTestDatabase());

  Future<String?> pinned() async => (await (db.select(
    db.settings,
  )..where((s) => s.key.equals('space_image'))).getSingleOrNull())?.value;

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

  testApp('Settings links to the space images', (tester) async {
    final app = await pumpApp(
      tester,
      db: db,
      location: Routes.settings,
      height: 1400,
    );
    await tester.tap(find.text('Space images'));
    await tester.pumpAndSettle();
    expect(app.router.state.uri.path, Routes.spaceImages);
    expect(find.text('A new image every day'), findsOneWidget);
  });

  testApp('picking an image pins it as the background', (tester) async {
    await pumpApp(tester, db: db, location: Routes.spaceImages);
    await tester.tap(find.bySemanticsLabel('Pillars of Creation'));
    await tester.pumpAndSettle();
    expect(await pinned(), 'pillars_of_creation');
    expect(background(tester), spaceImages.first.asset);

    await tester.tap(find.text('A new image every day'));
    await tester.pumpAndSettle();
    expect(await pinned(), isNull);
  });

  testApp('each image shows its credit', (tester) async {
    await pumpApp(tester, db: db, location: Routes.spaceImages);
    expect(find.text(spaceImages.first.credit), findsOneWidget);
    expect(find.textContaining('CC BY 4.0'), findsNothing); // below the grid
    await tester.scrollUntilVisible(find.textContaining('CC BY 4.0'), 400);
    expect(find.textContaining('CC BY 4.0'), findsOneWidget);
  });
}
