import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_riverpod/misc.dart' show ProviderListenable;
import 'package:orbit/core/db/app_database.dart';
import 'package:orbit/core/db/database_providers.dart';

/// A container whose providers use [db].
ProviderContainer containerWith(AppDatabase db, {List overrides = const []}) {
  final container = ProviderContainer(
    overrides: [appDatabaseProvider.overrideWithValue(db), ...overrides],
  );
  return container;
}

/// Waits until [provider] has a value matching [test].
Future<T> valueWhere<T>(
  ProviderContainer container,
  ProviderListenable<AsyncValue<T>> provider,
  bool Function(T value) test,
) {
  final completer = Completer<T>();
  final sub = container.listen(provider, (_, next) {
    final value = next.value;
    if (next.hasValue && test(value as T) && !completer.isCompleted) {
      completer.complete(value);
    }
  }, fireImmediately: true);
  return completer.future
      .timeout(const Duration(seconds: 5))
      .whenComplete(sub.close);
}
