// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'habit_repository.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning

@ProviderFor(habitRepository)
final habitRepositoryProvider = HabitRepositoryProvider._();

final class HabitRepositoryProvider
    extends
        $FunctionalProvider<HabitRepository, HabitRepository, HabitRepository>
    with $Provider<HabitRepository> {
  HabitRepositoryProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'habitRepositoryProvider',
        isAutoDispose: false,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$habitRepositoryHash();

  @$internal
  @override
  $ProviderElement<HabitRepository> $createElement($ProviderPointer pointer) =>
      $ProviderElement(pointer);

  @override
  HabitRepository create(Ref ref) {
    return habitRepository(ref);
  }

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(HabitRepository value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<HabitRepository>(value),
    );
  }
}

String _$habitRepositoryHash() => r'06c6c2c51d66f4d11df39548481037700572f7dc';

/// All habits, active first, then by title.

@ProviderFor(habits)
final habitsProvider = HabitsProvider._();

/// All habits, active first, then by title.

final class HabitsProvider
    extends
        $FunctionalProvider<
          AsyncValue<List<Habit>>,
          List<Habit>,
          Stream<List<Habit>>
        >
    with $FutureModifier<List<Habit>>, $StreamProvider<List<Habit>> {
  /// All habits, active first, then by title.
  HabitsProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'habitsProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$habitsHash();

  @$internal
  @override
  $StreamProviderElement<List<Habit>> $createElement(
    $ProviderPointer pointer,
  ) => $StreamProviderElement(pointer);

  @override
  Stream<List<Habit>> create(Ref ref) {
    return habits(ref);
  }
}

String _$habitsHash() => r'9b84f4aa7573d1eeaa23ba609477fdffd36eef64';

@ProviderFor(habit)
final habitProvider = HabitFamily._();

final class HabitProvider
    extends $FunctionalProvider<AsyncValue<Habit?>, Habit?, Stream<Habit?>>
    with $FutureModifier<Habit?>, $StreamProvider<Habit?> {
  HabitProvider._({
    required HabitFamily super.from,
    required String super.argument,
  }) : super(
         retry: null,
         name: r'habitProvider',
         isAutoDispose: true,
         dependencies: null,
         $allTransitiveDependencies: null,
       );

  @override
  String debugGetCreateSourceHash() => _$habitHash();

  @override
  String toString() {
    return r'habitProvider'
        ''
        '($argument)';
  }

  @$internal
  @override
  $StreamProviderElement<Habit?> $createElement($ProviderPointer pointer) =>
      $StreamProviderElement(pointer);

  @override
  Stream<Habit?> create(Ref ref) {
    final argument = this.argument as String;
    return habit(ref, argument);
  }

  @override
  bool operator ==(Object other) {
    return other is HabitProvider && other.argument == argument;
  }

  @override
  int get hashCode {
    return argument.hashCode;
  }
}

String _$habitHash() => r'9049ff20592ee5252b50a25c7d131f1dc387fc61';

final class HabitFamily extends $Family
    with $FunctionalFamilyOverride<Stream<Habit?>, String> {
  HabitFamily._()
    : super(
        retry: null,
        name: r'habitProvider',
        dependencies: null,
        $allTransitiveDependencies: null,
        isAutoDispose: true,
      );

  HabitProvider call(String id) => HabitProvider._(argument: id, from: this);

  @override
  String toString() => r'habitProvider';
}
