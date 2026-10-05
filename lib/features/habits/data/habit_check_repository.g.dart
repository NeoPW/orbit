// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'habit_check_repository.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning

@ProviderFor(habitCheckRepository)
final habitCheckRepositoryProvider = HabitCheckRepositoryProvider._();

final class HabitCheckRepositoryProvider
    extends
        $FunctionalProvider<
          HabitCheckRepository,
          HabitCheckRepository,
          HabitCheckRepository
        >
    with $Provider<HabitCheckRepository> {
  HabitCheckRepositoryProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'habitCheckRepositoryProvider',
        isAutoDispose: false,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$habitCheckRepositoryHash();

  @$internal
  @override
  $ProviderElement<HabitCheckRepository> $createElement(
    $ProviderPointer pointer,
  ) => $ProviderElement(pointer);

  @override
  HabitCheckRepository create(Ref ref) {
    return habitCheckRepository(ref);
  }

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(HabitCheckRepository value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<HabitCheckRepository>(value),
    );
  }
}

String _$habitCheckRepositoryHash() =>
    r'4f3a74a51145f6ded7f4aa3d894e295f4a5e0da6';

/// Live checks of all habits on or after [from].

@ProviderFor(habitChecksSince)
final habitChecksSinceProvider = HabitChecksSinceFamily._();

/// Live checks of all habits on or after [from].

final class HabitChecksSinceProvider
    extends
        $FunctionalProvider<
          AsyncValue<List<HabitCheck>>,
          List<HabitCheck>,
          Stream<List<HabitCheck>>
        >
    with $FutureModifier<List<HabitCheck>>, $StreamProvider<List<HabitCheck>> {
  /// Live checks of all habits on or after [from].
  HabitChecksSinceProvider._({
    required HabitChecksSinceFamily super.from,
    required CalendarDate super.argument,
  }) : super(
         retry: null,
         name: r'habitChecksSinceProvider',
         isAutoDispose: true,
         dependencies: null,
         $allTransitiveDependencies: null,
       );

  @override
  String debugGetCreateSourceHash() => _$habitChecksSinceHash();

  @override
  String toString() {
    return r'habitChecksSinceProvider'
        ''
        '($argument)';
  }

  @$internal
  @override
  $StreamProviderElement<List<HabitCheck>> $createElement(
    $ProviderPointer pointer,
  ) => $StreamProviderElement(pointer);

  @override
  Stream<List<HabitCheck>> create(Ref ref) {
    final argument = this.argument as CalendarDate;
    return habitChecksSince(ref, argument);
  }

  @override
  bool operator ==(Object other) {
    return other is HabitChecksSinceProvider && other.argument == argument;
  }

  @override
  int get hashCode {
    return argument.hashCode;
  }
}

String _$habitChecksSinceHash() => r'ad91e18955d7c1acdecc32e48462810c8d04750c';

/// Live checks of all habits on or after [from].

final class HabitChecksSinceFamily extends $Family
    with $FunctionalFamilyOverride<Stream<List<HabitCheck>>, CalendarDate> {
  HabitChecksSinceFamily._()
    : super(
        retry: null,
        name: r'habitChecksSinceProvider',
        dependencies: null,
        $allTransitiveDependencies: null,
        isAutoDispose: true,
      );

  /// Live checks of all habits on or after [from].

  HabitChecksSinceProvider call(CalendarDate from) =>
      HabitChecksSinceProvider._(argument: from, from: this);

  @override
  String toString() => r'habitChecksSinceProvider';
}
