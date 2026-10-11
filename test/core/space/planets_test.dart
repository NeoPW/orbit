import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:orbit/core/space/planets.dart';
import 'package:orbit/core/space/space_colors.dart';
import 'package:orbit/core/widgets/area_dot.dart';

import '../../helpers/fixtures.dart';

void main() {
  test('neighboring goals get different automatic colors', () {
    for (var i = 0; i < autoColors.length; i++) {
      expect(goalColor(i), isNot(goalColor(i + 1)));
    }
  });

  test('an own color wins over the automatic one', () {
    expect(colorOfGoal(goal('g', sortOrder: 1)), goalColor(1));
    expect(colorOfGoal(goal('g', color: '#FF7A9C')), colorFromHex('#FF7A9C'));
  });

  test('planets are dimmer at low progress', () {
    const color = Color(0xFF8F9DFF);
    final low = planetShade(color, 0);
    final high = planetShade(color, 1);
    expect(high, color);
    expect(low, isNot(color));
  });

  test('stable seeds do not depend on the run', () {
    expect(stableSeed('abc'), stableSeed('abc'));
    expect(stableSeed('abc'), isNot(stableSeed('abd')));
  });
}
