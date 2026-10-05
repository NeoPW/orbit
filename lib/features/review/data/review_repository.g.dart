// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'review_repository.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning

@ProviderFor(reviewRepository)
final reviewRepositoryProvider = ReviewRepositoryProvider._();

final class ReviewRepositoryProvider
    extends
        $FunctionalProvider<
          ReviewRepository,
          ReviewRepository,
          ReviewRepository
        >
    with $Provider<ReviewRepository> {
  ReviewRepositoryProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'reviewRepositoryProvider',
        isAutoDispose: false,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$reviewRepositoryHash();

  @$internal
  @override
  $ProviderElement<ReviewRepository> $createElement($ProviderPointer pointer) =>
      $ProviderElement(pointer);

  @override
  ReviewRepository create(Ref ref) {
    return reviewRepository(ref);
  }

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(ReviewRepository value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<ReviewRepository>(value),
    );
  }
}

String _$reviewRepositoryHash() => r'1029383fcffb247bbf90cbec8c30a303972feb50';

/// The review of a week, draft or completed.

@ProviderFor(reviewForWeek)
final reviewForWeekProvider = ReviewForWeekFamily._();

/// The review of a week, draft or completed.

final class ReviewForWeekProvider
    extends
        $FunctionalProvider<
          AsyncValue<WeeklyReview?>,
          WeeklyReview?,
          Stream<WeeklyReview?>
        >
    with $FutureModifier<WeeklyReview?>, $StreamProvider<WeeklyReview?> {
  /// The review of a week, draft or completed.
  ReviewForWeekProvider._({
    required ReviewForWeekFamily super.from,
    required CalendarDate super.argument,
  }) : super(
         retry: null,
         name: r'reviewForWeekProvider',
         isAutoDispose: true,
         dependencies: null,
         $allTransitiveDependencies: null,
       );

  @override
  String debugGetCreateSourceHash() => _$reviewForWeekHash();

  @override
  String toString() {
    return r'reviewForWeekProvider'
        ''
        '($argument)';
  }

  @$internal
  @override
  $StreamProviderElement<WeeklyReview?> $createElement(
    $ProviderPointer pointer,
  ) => $StreamProviderElement(pointer);

  @override
  Stream<WeeklyReview?> create(Ref ref) {
    final argument = this.argument as CalendarDate;
    return reviewForWeek(ref, argument);
  }

  @override
  bool operator ==(Object other) {
    return other is ReviewForWeekProvider && other.argument == argument;
  }

  @override
  int get hashCode {
    return argument.hashCode;
  }
}

String _$reviewForWeekHash() => r'ef7785761e586ec2c3b92e4d492cf3f58c527662';

/// The review of a week, draft or completed.

final class ReviewForWeekFamily extends $Family
    with $FunctionalFamilyOverride<Stream<WeeklyReview?>, CalendarDate> {
  ReviewForWeekFamily._()
    : super(
        retry: null,
        name: r'reviewForWeekProvider',
        dependencies: null,
        $allTransitiveDependencies: null,
        isAutoDispose: true,
      );

  /// The review of a week, draft or completed.

  ReviewForWeekProvider call(CalendarDate weekStart) =>
      ReviewForWeekProvider._(argument: weekStart, from: this);

  @override
  String toString() => r'reviewForWeekProvider';
}

@ProviderFor(review)
final reviewProvider = ReviewFamily._();

final class ReviewProvider
    extends
        $FunctionalProvider<
          AsyncValue<WeeklyReview?>,
          WeeklyReview?,
          Stream<WeeklyReview?>
        >
    with $FutureModifier<WeeklyReview?>, $StreamProvider<WeeklyReview?> {
  ReviewProvider._({
    required ReviewFamily super.from,
    required String super.argument,
  }) : super(
         retry: null,
         name: r'reviewProvider',
         isAutoDispose: true,
         dependencies: null,
         $allTransitiveDependencies: null,
       );

  @override
  String debugGetCreateSourceHash() => _$reviewHash();

  @override
  String toString() {
    return r'reviewProvider'
        ''
        '($argument)';
  }

  @$internal
  @override
  $StreamProviderElement<WeeklyReview?> $createElement(
    $ProviderPointer pointer,
  ) => $StreamProviderElement(pointer);

  @override
  Stream<WeeklyReview?> create(Ref ref) {
    final argument = this.argument as String;
    return review(ref, argument);
  }

  @override
  bool operator ==(Object other) {
    return other is ReviewProvider && other.argument == argument;
  }

  @override
  int get hashCode {
    return argument.hashCode;
  }
}

String _$reviewHash() => r'8419ed6ae4834adb310fcbe553fc7023da2ee585';

final class ReviewFamily extends $Family
    with $FunctionalFamilyOverride<Stream<WeeklyReview?>, String> {
  ReviewFamily._()
    : super(
        retry: null,
        name: r'reviewProvider',
        dependencies: null,
        $allTransitiveDependencies: null,
        isAutoDispose: true,
      );

  ReviewProvider call(String id) => ReviewProvider._(argument: id, from: this);

  @override
  String toString() => r'reviewProvider';
}

/// Completed reviews, newest week first.

@ProviderFor(completedReviews)
final completedReviewsProvider = CompletedReviewsProvider._();

/// Completed reviews, newest week first.

final class CompletedReviewsProvider
    extends
        $FunctionalProvider<
          AsyncValue<List<WeeklyReview>>,
          List<WeeklyReview>,
          Stream<List<WeeklyReview>>
        >
    with
        $FutureModifier<List<WeeklyReview>>,
        $StreamProvider<List<WeeklyReview>> {
  /// Completed reviews, newest week first.
  CompletedReviewsProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'completedReviewsProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$completedReviewsHash();

  @$internal
  @override
  $StreamProviderElement<List<WeeklyReview>> $createElement(
    $ProviderPointer pointer,
  ) => $StreamProviderElement(pointer);

  @override
  Stream<List<WeeklyReview>> create(Ref ref) {
    return completedReviews(ref);
  }
}

String _$completedReviewsHash() => r'379ceb936a96e1036b8d5e27864d1a666fd2ed17';

/// Latest earlier snapshot per KR, for weeks before [weekStart].

@ProviderFor(latestSnapshotsBefore)
final latestSnapshotsBeforeProvider = LatestSnapshotsBeforeFamily._();

/// Latest earlier snapshot per KR, for weeks before [weekStart].

final class LatestSnapshotsBeforeProvider
    extends
        $FunctionalProvider<
          AsyncValue<Map<String, double>>,
          Map<String, double>,
          Stream<Map<String, double>>
        >
    with
        $FutureModifier<Map<String, double>>,
        $StreamProvider<Map<String, double>> {
  /// Latest earlier snapshot per KR, for weeks before [weekStart].
  LatestSnapshotsBeforeProvider._({
    required LatestSnapshotsBeforeFamily super.from,
    required CalendarDate super.argument,
  }) : super(
         retry: null,
         name: r'latestSnapshotsBeforeProvider',
         isAutoDispose: true,
         dependencies: null,
         $allTransitiveDependencies: null,
       );

  @override
  String debugGetCreateSourceHash() => _$latestSnapshotsBeforeHash();

  @override
  String toString() {
    return r'latestSnapshotsBeforeProvider'
        ''
        '($argument)';
  }

  @$internal
  @override
  $StreamProviderElement<Map<String, double>> $createElement(
    $ProviderPointer pointer,
  ) => $StreamProviderElement(pointer);

  @override
  Stream<Map<String, double>> create(Ref ref) {
    final argument = this.argument as CalendarDate;
    return latestSnapshotsBefore(ref, argument);
  }

  @override
  bool operator ==(Object other) {
    return other is LatestSnapshotsBeforeProvider && other.argument == argument;
  }

  @override
  int get hashCode {
    return argument.hashCode;
  }
}

String _$latestSnapshotsBeforeHash() =>
    r'0d74d6ddde2d645bea0caeb36e69c5aa1c851e9d';

/// Latest earlier snapshot per KR, for weeks before [weekStart].

final class LatestSnapshotsBeforeFamily extends $Family
    with $FunctionalFamilyOverride<Stream<Map<String, double>>, CalendarDate> {
  LatestSnapshotsBeforeFamily._()
    : super(
        retry: null,
        name: r'latestSnapshotsBeforeProvider',
        dependencies: null,
        $allTransitiveDependencies: null,
        isAutoDispose: true,
      );

  /// Latest earlier snapshot per KR, for weeks before [weekStart].

  LatestSnapshotsBeforeProvider call(CalendarDate weekStart) =>
      LatestSnapshotsBeforeProvider._(argument: weekStart, from: this);

  @override
  String toString() => r'latestSnapshotsBeforeProvider';
}
