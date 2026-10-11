import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:orbit/core/space/solar_system.dart';

import '../../helpers/pump_app.dart';

SolarPlanet planet(String id, {int moons = 0, bool ringed = false}) =>
    SolarPlanet(
      id: id,
      label: 'Goal $id',
      color: Colors.blue,
      ringed: ringed,
      moons: [for (var i = 0; i < moons; i++) Colors.orange],
    );

SolarAsteroid asteroid(String id) =>
    SolarAsteroid(id: id, label: 'Project $id', color: Colors.grey);

double distance(Offset a, Offset b) => (a - b).distance;

void main() {
  const size = Size(400, 240);

  group('layout', () {
    test('the first goal orbits closest to the sun', () {
      final layout = SolarLayout(size, [planet('a'), planet('b')], const []);
      expect(
        layout.planets.first.orbit.width,
        lessThan(layout.planets.last.orbit.width),
      );
      expect(layout.planets.map((p) => p.planet.id), ['a', 'b']);
    });

    test('planets stay on their orbit ellipse', () {
      final layout = SolarLayout(size, [planet('a'), planet('b')], const []);
      for (final placed in layout.planets) {
        final d = placed.center - layout.sun;
        final onEllipse =
            (d.dx * d.dx) / (placed.orbit.width * placed.orbit.width) +
            (d.dy * d.dy) / (placed.orbit.height * placed.orbit.height);
        expect(onEllipse, closeTo(1, 1e-9));
      }
    });

    test('positions are the same on every layout', () {
      final a = SolarLayout(size, [planet('a')], [asteroid('x')]);
      final b = SolarLayout(size, [planet('a')], [asteroid('x')]);
      expect(a.planets.single.center, b.planets.single.center);
      expect(a.asteroids.single.center, b.asteroids.single.center);
      expect(a.asteroids.single.outline, b.asteroids.single.outline);
    });

    test('at most twelve asteroids, outside the outermost orbit', () {
      final layout = SolarLayout(
        size,
        [planet('a')],
        [for (var i = 0; i < 15; i++) asteroid('$i')],
      );
      expect(layout.asteroids, hasLength(SolarLayout.maxAsteroids));
      final outermost = layout.planets.single.orbit.width;
      for (final placed in layout.asteroids) {
        final d = placed.center - layout.sun;
        // Measured along the belt's ellipse: beyond the planet's orbit.
        final scale =
            (d.dx * d.dx) / (outermost * outermost) +
            (d.dy * d.dy) /
                (layout.planets.single.orbit.height *
                    layout.planets.single.orbit.height);
        expect(scale, greaterThan(1));
      }
    });

    test('asteroids are irregular rocks', () {
      final rock = SolarLayout(size, const [], [
        asteroid('x'),
      ]).asteroids.single;
      final radii = rock.outline.map((p) => p.distance).toSet();
      expect(rock.outline, hasLength(7));
      expect(radii.length, greaterThan(1));
    });
  });

  group('row layout for Home', () {
    const size = Size(400, 150);

    test('Compact on Home: sun at the left edge, planets in a row', () {
      final layout = SolarLayout.row(
        size,
        [planet('a'), planet('b'), planet('c')],
        [asteroid('x')],
      );
      expect(layout.sun.dx, 0);
      final xs = [for (final p in layout.planets) p.center.dx];
      expect(xs, [...xs]..sort());
      for (final p in layout.planets) {
        expect(p.center.dy, layout.sun.dy);
        // On its orbit arc around the sun.
        expect(p.center.dx - layout.sun.dx, p.orbit.width);
      }
      expect(layout.planets.map((p) => p.labelBelow), [true, false, true]);
      final rock = layout.asteroids.single;
      expect(rock.center.dx, greaterThan(xs.last));
      expect(rock.center.dy, inInclusiveRange(0, size.height));
    });
  });

  group('widget', () {
    testApp('labels the planets and opens a goal on tap', (tester) async {
      String? opened;
      await pumpInScaffold(
        tester,
        SolarSystem(
          planets: [planet('a'), planet('b')],
          onPlanet: (p) => opened = p.id,
        ),
      );
      expect(find.text('Goal a'), findsOneWidget);
      expect(find.text('Goal b'), findsOneWidget);
      await tester.tap(find.text('Goal b'));
      expect(opened, 'b');
    });

    testApp('asteroids are unlabeled but open their project', (tester) async {
      String? opened;
      await pumpInScaffold(
        tester,
        SolarSystem(
          planets: const [],
          asteroids: [asteroid('x')],
          onAsteroid: (a) => opened = a.id,
        ),
      );
      expect(find.text('Project x'), findsNothing);
      await tester.tap(find.bySemanticsLabel('Project x'));
      expect(opened, 'x');
    });

    testApp('nothing moves: no animation is running', (tester) async {
      await pumpInScaffold(
        tester,
        SolarSystem(planets: [planet('a', moons: 3, ringed: true)]),
      );
      expect(tester.hasRunningAnimations, isFalse);
    });

    testApp('grows with more than four goals', (tester) async {
      final small = SolarSystem(
        planets: [for (var i = 0; i < 4; i++) planet('$i')],
      );
      final big = SolarSystem(
        planets: [for (var i = 0; i < 5; i++) planet('$i')],
      );
      expect(small.height, lessThan(big.height));
    });
  });
}
