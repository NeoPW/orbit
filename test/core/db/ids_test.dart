import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:orbit/core/db/ids.dart';
import 'package:orbit/core/time/clock.dart';

final _uuidV4 = RegExp(
  r'^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$',
);

void main() {
  test('idGenerator produces distinct UUID v4 values', () {
    final container = ProviderContainer();
    addTearDown(container.dispose);
    final next = container.read(idGeneratorProvider);

    final ids = List.generate(100, (_) => next());
    expect(ids, everyElement(matches(_uuidV4)));
    expect(ids.toSet(), hasLength(100));
  });

  test('clock returns UTC', () {
    final container = ProviderContainer();
    addTearDown(container.dispose);
    expect(container.read(clockProvider)().isUtc, isTrue);
  });

  group('naturalKeyId', () {
    test('the same key always gives the same UUID', () {
      expect(
        naturalKeyId('habit_check:h1:2026-10-05'),
        naturalKeyId('habit_check:h1:2026-10-05'),
      );
    });

    test('different keys give different UUIDs', () {
      expect(
        naturalKeyId('habit_check:h1:2026-10-05'),
        isNot(naturalKeyId('habit_check:h1:2026-10-06')),
      );
    });

    test('is a UUID v5', () {
      expect(
        naturalKeyId('weekly_review:2026-10-05'),
        matches(RegExp(r'^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab]')),
      );
    });
  });
}
