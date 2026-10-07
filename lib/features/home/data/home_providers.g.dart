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

/// Habits checked of due today, and open tasks due today or overdue.

@ProviderFor(todayProgress)
final todayProgressProvider = TodayProgressProvider._();

/// Habits checked of due today, and open tasks due today or overdue.

final class TodayProgressProvider
    extends
        $FunctionalProvider<
          AsyncValue<TodayProgress>,
          AsyncValue<TodayProgress>,
          AsyncValue<TodayProgress>
        >
    with $Provider<AsyncValue<TodayProgress>> {
  /// Habits checked of due today, and open tasks due today or overdue.
  TodayProgressProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'todayProgressProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$todayProgressHash();

  @$internal
  @override
  $ProviderElement<AsyncValue<TodayProgress>> $createElement(
    $ProviderPointer pointer,
  ) => $ProviderElement(pointer);

  @override
  AsyncValue<TodayProgress> create(Ref ref) {
    return todayProgress(ref);
  }

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(AsyncValue<TodayProgress> value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<AsyncValue<TodayProgress>>(value),
    );
  }
}

String _$todayProgressHash() => r'e9b202386a25544445e3be146c8fa9dd6bd20d8a';

/// Home's "Tasks": open tasks outside projects, by deadline (overdue first,
/// none last), then by creation (home spec, "Tasks on Home").

@ProviderFor(homeTasks)
final homeTasksProvider = HomeTasksProvider._();

/// Home's "Tasks": open tasks outside projects, by deadline (overdue first,
/// none last), then by creation (home spec, "Tasks on Home").

final class HomeTasksProvider
    extends
        $FunctionalProvider<
          AsyncValue<List<HomeTask>>,
          AsyncValue<List<HomeTask>>,
          AsyncValue<List<HomeTask>>
        >
    with $Provider<AsyncValue<List<HomeTask>>> {
  /// Home's "Tasks": open tasks outside projects, by deadline (overdue first,
  /// none last), then by creation (home spec, "Tasks on Home").
  HomeTasksProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'homeTasksProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$homeTasksHash();

  @$internal
  @override
  $ProviderElement<AsyncValue<List<HomeTask>>> $createElement(
    $ProviderPointer pointer,
  ) => $ProviderElement(pointer);

  @override
  AsyncValue<List<HomeTask>> create(Ref ref) {
    return homeTasks(ref);
  }

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(AsyncValue<List<HomeTask>> value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<AsyncValue<List<HomeTask>>>(value),
    );
  }
}

String _$homeTasksHash() => r'ecc199766f1cdcbcd998ad7e26b751f5c64cfdb9';
