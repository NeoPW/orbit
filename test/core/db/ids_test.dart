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
}
