import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:orbit/core/space/space_images.dart';
import 'package:orbit/core/time/calendar_date.dart';

void main() {
  test('each day shows the next image, round the whole list', () {
    final start = CalendarDate(2026, 1, 1);
    final days = [
      for (var i = 0; i < spaceImages.length; i++)
        spaceImageFor(start.addDays(i)).name,
    ];
    expect(days.toSet(), hasLength(spaceImages.length));
    expect(
      spaceImageFor(start.addDays(spaceImages.length)).name,
      spaceImageFor(start).name,
    );
  });

  test('the same day always gives the same image', () {
    final day = CalendarDate(2026, 10, 7);
    expect(spaceImageFor(day).name, spaceImageFor(day).name);
  });

  test('a pinned image wins; an unknown one is ignored', () {
    final day = CalendarDate(2026, 10, 7);
    expect(spaceImageFor(day, pinned: 'crab_nebula').name, 'crab_nebula');
    expect(spaceImageFor(day, pinned: 'gone').name, spaceImageFor(day).name);
  });

  test('every image has a title, credit and source', () {
    for (final image in spaceImages) {
      expect(image.title, isNotEmpty);
      expect(image.credit, isNotEmpty);
      expect(image.source, startsWith('https://esahubble.org/images/'));
      expect(File(image.asset).existsSync(), isTrue, reason: image.asset);
    }
  });
}
