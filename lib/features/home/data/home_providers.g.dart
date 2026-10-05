// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'home_providers.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning
/// Home's "Habits due today".

@ProviderFor(homeHabits)
final homeHabitsProvider = HomeHabitsProvider._();

/// Home's "Habits due today".

final class HomeHabitsProvider
    extends
        $FunctionalProvider<
          AsyncValue<List<HomeHabit>>,
          AsyncValue<List<HomeHabit>>,
          AsyncValue<List<HomeHabit>>
        >
    with $Provider<AsyncValue<List<HomeHabit>>> {
  /// Home's "Habits due today".
  HomeHabitsProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'homeHabitsProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$homeHabitsHash();

  @$internal
  @override
  $ProviderElement<AsyncValue<List<HomeHabit>>> $createElement(
    $ProviderPointer pointer,
  ) => $ProviderElement(pointer);

  @override
  AsyncValue<List<HomeHabit>> create(Ref ref) {
    return homeHabits(ref);
  }

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(AsyncValue<List<HomeHabit>> value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<AsyncValue<List<HomeHabit>>>(value),
    );
  }
}

String _$homeHabitsHash() => r'367a4eda1df9c62c8d15b98012e83ece7bc68b70';

/// Home's "Upcoming deadlines".

@ProviderFor(upcomingDeadlines)
final upcomingDeadlinesProvider = UpcomingDeadlinesProvider._();

/// Home's "Upcoming deadlines".

final class UpcomingDeadlinesProvider
    extends
        $FunctionalProvider<
          AsyncValue<List<UpcomingDeadline>>,
          AsyncValue<List<UpcomingDeadline>>,
          AsyncValue<List<UpcomingDeadline>>
        >
    with $Provider<AsyncValue<List<UpcomingDeadline>>> {
  /// Home's "Upcoming deadlines".
  UpcomingDeadlinesProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'upcomingDeadlinesProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$upcomingDeadlinesHash();

  @$internal
  @override
  $ProviderElement<AsyncValue<List<UpcomingDeadline>>> $createElement(
    $ProviderPointer pointer,
  ) => $ProviderElement(pointer);

  @override
  AsyncValue<List<UpcomingDeadline>> create(Ref ref) {
    return upcomingDeadlines(ref);
  }

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(AsyncValue<List<UpcomingDeadline>> value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<AsyncValue<List<UpcomingDeadline>>>(
        value,
      ),
    );
  }
}

String _$upcomingDeadlinesHash() => r'060c6d2ca9afcb670c75d7589eb56a0b8677ea6b';

/// Home's "Active projects", ordered by score.

@ProviderFor(homeProjects)
final homeProjectsProvider = HomeProjectsProvider._();

/// Home's "Active projects", ordered by score.

final class HomeProjectsProvider
    extends
        $FunctionalProvider<
          AsyncValue<List<HomeProject>>,
          AsyncValue<List<HomeProject>>,
          AsyncValue<List<HomeProject>>
        >
    with $Provider<AsyncValue<List<HomeProject>>> {
  /// Home's "Active projects", ordered by score.
  HomeProjectsProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'homeProjectsProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$homeProjectsHash();

  @$internal
  @override
  $ProviderElement<AsyncValue<List<HomeProject>>> $createElement(
    $ProviderPointer pointer,
  ) => $ProviderElement(pointer);

  @override
  AsyncValue<List<HomeProject>> create(Ref ref) {
    return homeProjects(ref);
  }

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(AsyncValue<List<HomeProject>> value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<AsyncValue<List<HomeProject>>>(
        value,
      ),
    );
  }
}

String _$homeProjectsHash() => r'2045bcb96d23873c690cafb6c90d58dcaa51569d';
