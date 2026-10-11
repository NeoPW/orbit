// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'review_providers.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning
/// The Monday of the current week (weekly-review spec, "Review tab").

@ProviderFor(currentWeek)
final currentWeekProvider = CurrentWeekProvider._();

/// The Monday of the current week (weekly-review spec, "Review tab").

final class CurrentWeekProvider
    extends $FunctionalProvider<CalendarDate, CalendarDate, CalendarDate>
    with $Provider<CalendarDate> {
  /// The Monday of the current week (weekly-review spec, "Review tab").
  CurrentWeekProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'currentWeekProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$currentWeekHash();

  @$internal
  @override
  $ProviderElement<CalendarDate> $createElement($ProviderPointer pointer) =>
      $ProviderElement(pointer);

  @override
  CalendarDate create(Ref ref) {
    return currentWeek(ref);
  }

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(CalendarDate value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<CalendarDate>(value),
    );
  }
}

String _$currentWeekHash() => r'1641491c49c41fa1f2a9598e4ee32160f285ec0b';

/// The Monday of the week a review made today is about.

@ProviderFor(reviewWeek)
final reviewWeekProvider = ReviewWeekProvider._();

/// The Monday of the week a review made today is about.

final class ReviewWeekProvider
    extends $FunctionalProvider<CalendarDate, CalendarDate, CalendarDate>
    with $Provider<CalendarDate> {
  /// The Monday of the week a review made today is about.
  ReviewWeekProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'reviewWeekProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$reviewWeekHash();

  @$internal
  @override
  $ProviderElement<CalendarDate> $createElement($ProviderPointer pointer) =>
      $ProviderElement(pointer);

  @override
  CalendarDate create(Ref ref) {
    return reviewWeek(ref);
  }

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(CalendarDate value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<CalendarDate>(value),
    );
  }
}

String _$reviewWeekHash() => r'071fd5206263a6c83a479f1be66adeea23eae196';

@ProviderFor(weekLogEntries)
final weekLogEntriesProvider = WeekLogEntriesFamily._();

final class WeekLogEntriesProvider
    extends
        $FunctionalProvider<
          AsyncValue<List<LogEntry>>,
          List<LogEntry>,
          Stream<List<LogEntry>>
        >
    with $FutureModifier<List<LogEntry>>, $StreamProvider<List<LogEntry>> {
  WeekLogEntriesProvider._({
    required WeekLogEntriesFamily super.from,
    required CalendarDate super.argument,
  }) : super(
         retry: null,
         name: r'weekLogEntriesProvider',
         isAutoDispose: true,
         dependencies: null,
         $allTransitiveDependencies: null,
       );

  @override
  String debugGetCreateSourceHash() => _$weekLogEntriesHash();

  @override
  String toString() {
    return r'weekLogEntriesProvider'
        ''
        '($argument)';
  }

  @$internal
  @override
  $StreamProviderElement<List<LogEntry>> $createElement(
    $ProviderPointer pointer,
  ) => $StreamProviderElement(pointer);

  @override
  Stream<List<LogEntry>> create(Ref ref) {
    final argument = this.argument as CalendarDate;
    return weekLogEntries(ref, argument);
  }

  @override
  bool operator ==(Object other) {
    return other is WeekLogEntriesProvider && other.argument == argument;
  }

  @override
  int get hashCode {
    return argument.hashCode;
  }
}

String _$weekLogEntriesHash() => r'347f61b1c2cf61c3bce6d16a4befb17598ee91bc';

final class WeekLogEntriesFamily extends $Family
    with $FunctionalFamilyOverride<Stream<List<LogEntry>>, CalendarDate> {
  WeekLogEntriesFamily._()
    : super(
        retry: null,
        name: r'weekLogEntriesProvider',
        dependencies: null,
        $allTransitiveDependencies: null,
        isAutoDispose: true,
      );

  WeekLogEntriesProvider call(CalendarDate weekStart) =>
      WeekLogEntriesProvider._(argument: weekStart, from: this);

  @override
  String toString() => r'weekLogEntriesProvider';
}

@ProviderFor(weekCompletedTasks)
final weekCompletedTasksProvider = WeekCompletedTasksFamily._();

final class WeekCompletedTasksProvider
    extends
        $FunctionalProvider<
          AsyncValue<List<Task>>,
          List<Task>,
          Stream<List<Task>>
        >
    with $FutureModifier<List<Task>>, $StreamProvider<List<Task>> {
  WeekCompletedTasksProvider._({
    required WeekCompletedTasksFamily super.from,
    required CalendarDate super.argument,
  }) : super(
         retry: null,
         name: r'weekCompletedTasksProvider',
         isAutoDispose: true,
         dependencies: null,
         $allTransitiveDependencies: null,
       );

  @override
  String debugGetCreateSourceHash() => _$weekCompletedTasksHash();

  @override
  String toString() {
    return r'weekCompletedTasksProvider'
        ''
        '($argument)';
  }

  @$internal
  @override
  $StreamProviderElement<List<Task>> $createElement($ProviderPointer pointer) =>
      $StreamProviderElement(pointer);

  @override
  Stream<List<Task>> create(Ref ref) {
    final argument = this.argument as CalendarDate;
    return weekCompletedTasks(ref, argument);
  }

  @override
  bool operator ==(Object other) {
    return other is WeekCompletedTasksProvider && other.argument == argument;
  }

  @override
  int get hashCode {
    return argument.hashCode;
  }
}

String _$weekCompletedTasksHash() =>
    r'124f6056ae54150c6ebbc81d8fa6e69c6b38977f';

final class WeekCompletedTasksFamily extends $Family
    with $FunctionalFamilyOverride<Stream<List<Task>>, CalendarDate> {
  WeekCompletedTasksFamily._()
    : super(
        retry: null,
        name: r'weekCompletedTasksProvider',
        dependencies: null,
        $allTransitiveDependencies: null,
        isAutoDispose: true,
      );

  WeekCompletedTasksProvider call(CalendarDate weekStart) =>
      WeekCompletedTasksProvider._(argument: weekStart, from: this);

  @override
  String toString() => r'weekCompletedTasksProvider';
}

/// The summary of the week starting [weekStart], updated live.

@ProviderFor(weekSummary)
final weekSummaryProvider = WeekSummaryFamily._();

/// The summary of the week starting [weekStart], updated live.

final class WeekSummaryProvider
    extends
        $FunctionalProvider<
          AsyncValue<WeekSummary>,
          AsyncValue<WeekSummary>,
          AsyncValue<WeekSummary>
        >
    with $Provider<AsyncValue<WeekSummary>> {
  /// The summary of the week starting [weekStart], updated live.
  WeekSummaryProvider._({
    required WeekSummaryFamily super.from,
    required CalendarDate super.argument,
  }) : super(
         retry: null,
         name: r'weekSummaryProvider',
         isAutoDispose: true,
         dependencies: null,
         $allTransitiveDependencies: null,
       );

  @override
  String debugGetCreateSourceHash() => _$weekSummaryHash();

  @override
  String toString() {
    return r'weekSummaryProvider'
        ''
        '($argument)';
  }

  @$internal
  @override
  $ProviderElement<AsyncValue<WeekSummary>> $createElement(
    $ProviderPointer pointer,
  ) => $ProviderElement(pointer);

  @override
  AsyncValue<WeekSummary> create(Ref ref) {
    final argument = this.argument as CalendarDate;
    return weekSummary(ref, argument);
  }

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(AsyncValue<WeekSummary> value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<AsyncValue<WeekSummary>>(value),
    );
  }

  @override
  bool operator ==(Object other) {
    return other is WeekSummaryProvider && other.argument == argument;
  }

  @override
  int get hashCode {
    return argument.hashCode;
  }
}

String _$weekSummaryHash() => r'b59b12b4339df293360de53a5957efd55cf910a5';

/// The summary of the week starting [weekStart], updated live.

final class WeekSummaryFamily extends $Family
    with $FunctionalFamilyOverride<AsyncValue<WeekSummary>, CalendarDate> {
  WeekSummaryFamily._()
    : super(
        retry: null,
        name: r'weekSummaryProvider',
        dependencies: null,
        $allTransitiveDependencies: null,
        isAutoDispose: true,
      );

  /// The summary of the week starting [weekStart], updated live.

  WeekSummaryProvider call(CalendarDate weekStart) =>
      WeekSummaryProvider._(argument: weekStart, from: this);

  @override
  String toString() => r'weekSummaryProvider';
}

/// The active goals with the current progress of their measures and the
/// change since the latest review before [weekStart], live. The weekly
/// review edits and saves these, also for a week already reviewed.

@ProviderFor(currentGoalProgress)
final currentGoalProgressProvider = CurrentGoalProgressFamily._();

/// The active goals with the current progress of their measures and the
/// change since the latest review before [weekStart], live. The weekly
/// review edits and saves these, also for a week already reviewed.

final class CurrentGoalProgressProvider
    extends
        $FunctionalProvider<
          AsyncValue<List<GoalProgressChange>>,
          AsyncValue<List<GoalProgressChange>>,
          AsyncValue<List<GoalProgressChange>>
        >
    with $Provider<AsyncValue<List<GoalProgressChange>>> {
  /// The active goals with the current progress of their measures and the
  /// change since the latest review before [weekStart], live. The weekly
  /// review edits and saves these, also for a week already reviewed.
  CurrentGoalProgressProvider._({
    required CurrentGoalProgressFamily super.from,
    required CalendarDate super.argument,
  }) : super(
         retry: null,
         name: r'currentGoalProgressProvider',
         isAutoDispose: true,
         dependencies: null,
         $allTransitiveDependencies: null,
       );

  @override
  String debugGetCreateSourceHash() => _$currentGoalProgressHash();

  @override
  String toString() {
    return r'currentGoalProgressProvider'
        ''
        '($argument)';
  }

  @$internal
  @override
  $ProviderElement<AsyncValue<List<GoalProgressChange>>> $createElement(
    $ProviderPointer pointer,
  ) => $ProviderElement(pointer);

  @override
  AsyncValue<List<GoalProgressChange>> create(Ref ref) {
    final argument = this.argument as CalendarDate;
    return currentGoalProgress(ref, argument);
  }

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(AsyncValue<List<GoalProgressChange>> value) {
    return $ProviderOverride(
      origin: this,
      providerOverride:
          $SyncValueProvider<AsyncValue<List<GoalProgressChange>>>(value),
    );
  }

  @override
  bool operator ==(Object other) {
    return other is CurrentGoalProgressProvider && other.argument == argument;
  }

  @override
  int get hashCode {
    return argument.hashCode;
  }
}

String _$currentGoalProgressHash() =>
    r'0faa1d53035eab08e17a81b6a1429fa34cf4f51c';

/// The active goals with the current progress of their measures and the
/// change since the latest review before [weekStart], live. The weekly
/// review edits and saves these, also for a week already reviewed.

final class CurrentGoalProgressFamily extends $Family
    with
        $FunctionalFamilyOverride<
          AsyncValue<List<GoalProgressChange>>,
          CalendarDate
        > {
  CurrentGoalProgressFamily._()
    : super(
        retry: null,
        name: r'currentGoalProgressProvider',
        dependencies: null,
        $allTransitiveDependencies: null,
        isAutoDispose: true,
      );

  /// The active goals with the current progress of their measures and the
  /// change since the latest review before [weekStart], live. The weekly
  /// review edits and saves these, also for a week already reviewed.

  CurrentGoalProgressProvider call(CalendarDate weekStart) =>
      CurrentGoalProgressProvider._(argument: weekStart, from: this);

  @override
  String toString() => r'currentGoalProgressProvider';
}
