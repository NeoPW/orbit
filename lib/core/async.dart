import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Combines several [AsyncValue]s: the first error wins, otherwise loading
/// until all have a value, then [build] (which may use `requireValue`).
AsyncValue<R> combineAsync<R>(
  List<AsyncValue<Object?>> values,
  R Function() build,
) {
  for (final value in values) {
    if (value.hasError) {
      return AsyncError<R>(value.error!, value.stackTrace ?? StackTrace.empty);
    }
  }
  if (values.every((value) => value.hasValue)) return AsyncData(build());
  return const AsyncLoading();
}
