// Renders a few screens with real fonts and images into build/screenshots,
// to look at the design without a device.
// Run: flutter test tool/screenshots/screenshots_test.dart
import 'dart:io';
import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:orbit/core/db/app_database.dart';
import 'package:orbit/features/areas/data/area_repository.dart';
import 'package:orbit/core/db/ids.dart';

import '../../test/helpers/pump_app.dart';
import '../../test/helpers/seed.dart';
import '../../test/helpers/test_db.dart';

Future<void> loadFonts() async {
  Future<void> family(String name, List<String> files) async {
    final loader = FontLoader(name);
    for (final file in files) {
      final bytes = File(file).readAsBytesSync();
      loader.addFont(Future.value(ByteData.sublistView(bytes)));
    }
    await loader.load();
  }

  await family('Inter', [
    for (final w in ['Regular', 'Medium', 'SemiBold', 'Bold'])
      'assets/fonts/Inter-$w.ttf',
  ]);
  await family('SpaceGrotesk', ['assets/fonts/SpaceGrotesk.ttf']);
  // flutter_tester lives in <flutter>/bin/cache/artifacts/engine/<platform>.
  var cache = File(Platform.resolvedExecutable).parent;
  while (cache.uri.pathSegments.reversed.elementAt(1) != 'cache') {
    cache = cache.parent;
  }
  await family('MaterialIcons', [
    '${cache.path}/artifacts/material_fonts/MaterialIcons-Regular.otf',
  ]);
}

Future<void> shoot(WidgetTester tester, String name) async {
  // Let asset images decode, then draw them.
  for (var i = 0; i < 3; i++) {
    await tester.runAsync(
      () => Future<void>.delayed(const Duration(milliseconds: 300)),
    );
    await tester.pump(const Duration(seconds: 2));
  }
  await tester.runAsync(() async {
    final view = tester.binding.renderViews.first;
    final layer = view.debugLayer! as OffsetLayer;
    final size = view.size;
    final image = await layer.toImage(Offset.zero & size, pixelRatio: 2);
    final bytes = await image.toByteData(format: ui.ImageByteFormat.png);
    File('build/screenshots/$name.png')
      ..createSync(recursive: true)
      ..writeAsBytesSync(bytes!.buffer.asUint8List());
  });
}

void main() {
  late AppDatabase db;
  late Seed seed;

  setUp(() async {
    await loadFonts();
    db = newTestDatabase();
    seed = Seed(db);
    final areas = AreaRepository(db, () => DateTime.now().toUtc(), uuidV4);
    final work = await areas.create(name: 'Work', color: '#4FD8E8');
    final health = await areas.create(name: 'Health', color: '#FF8A65');
    final fit = await seed.objective(title: 'Get fit');
    final run = await seed.kr(fit.id, current: 64);
    await seed.kr(fit.id, title: 'Swim 20 times', current: 20, target: 20);
    await seed.kr(fit.id, title: 'Lift 3x a week', current: 5);
    final thesis = await seed.objective(title: 'Finish thesis');
    await seed.objectives.update(thesis.copyWith(color: const Value('#7CE38B')));
    await seed.projects.create(
      title: 'Marathon plan',
      areaId: health.id,
      keyResultId: run.id,
      importance: 5,
      nextStep: 'Book race',
    );
    final chapters = await seed.kr(
      thesis.id,
      title: 'Write 6 chapters',
      current: 2,
      target: 6,
    );
    await seed.projects.create(
      title: 'Chapter 3',
      areaId: work.id,
      keyResultId: chapters.id,
      importance: 4,
      nextStep: 'Outline',
    );
    await seed.projects.create(title: 'Garden', importance: 2);
  });

  testApp('screenshots', (tester) async {
    await pumpApp(tester, db: db, height: 860);
    await shoot(tester, 'home');
    await tester.tap(find.text('Plan').last);
    await tester.pumpAndSettle();
    await shoot(tester, 'plan');
    await tester.tap(find.text('Get fit'));
    await tester.pumpAndSettle();
    await shoot(tester, 'objective');
    await tester.tap(find.byTooltip('Edit objective'));
    await tester.pumpAndSettle();
    await tester.drag(find.byType(Scrollable).last, const Offset(0, -400));
    await tester.pumpAndSettle();
    await shoot(tester, 'objective_form');
  });

  testApp('project', (tester) async {
    final app = await pumpApp(tester, db: db, height: 860);
    final marathon = (await db.select(db.projects).get()).firstWhere(
      (p) => p.title == 'Marathon plan',
    );
    app.router.push('/projects/${marathon.id}');
    await tester.pumpAndSettle();
    await shoot(tester, 'project');
  });

  testApp('space images', (tester) async {
    await pumpApp(tester, db: db, location: '/settings/space-images');
    await shoot(tester, 'space_images');
  });
}
