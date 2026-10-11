import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:orbit/core/space/planets.dart';
import 'package:orbit/core/space/space_colors.dart';

import '../../helpers/pump_app.dart';

void main() {
  const planets = [
    SystemPlanet(label: 'Run', color: Colors.blue, progress: 1),
    SystemPlanet(label: 'Swim', color: Colors.teal, progress: 0),
  ];

  testApp('a star system reads as progress and planet count', (tester) async {
    await pumpInScaffold(
      tester,
      const StarSystem(color: Colors.amber, progress: 0.5, planets: planets),
    );
    expect(find.bySemanticsLabel('50 percent, 2 key results'), findsOneWidget);
  });

  testApp('the detailed system labels its planets; tapping opens one', (
    tester,
  ) async {
    final tapped = <String>[];
    await pumpInScaffold(
      tester,
      StarSystem.detailed(
        color: Colors.amber,
        progress: 0.5,
        planets: [
          for (final p in planets)
            SystemPlanet(
              label: p.label,
              color: p.color,
              progress: p.progress,
              moons: const [Colors.red],
              onTap: () => tapped.add(p.label),
            ),
        ],
      ),
    );
    expect(find.text('Run'), findsOneWidget);
    expect(find.text('Swim'), findsOneWidget);
    await tester.tap(find.text('Swim'));
    expect(tapped, ['Swim']);
  });

  test('neighboring objectives get different colors', () {
    for (var i = 0; i < starColors.length; i++) {
      expect(objectiveColor(i), isNot(objectiveColor(i + 1)));
    }
  });

  test('a system\'s KR colors differ from each other', () {
    final colors = {
      for (var i = 0; i < 4; i++) keyResultColor(starColors.first, i, 4),
    };
    expect(colors, hasLength(4));
  });

  test('stable seeds do not depend on the run', () {
    expect(stableSeed('abc'), stableSeed('abc'));
    expect(stableSeed('abc'), isNot(stableSeed('abd')));
  });
}
