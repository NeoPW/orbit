// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'timer_repository.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning

@ProviderFor(timerRepository)
final timerRepositoryProvider = TimerRepositoryProvider._();

final class TimerRepositoryProvider
    extends
        $FunctionalProvider<TimerRepository, TimerRepository, TimerRepository>
    with $Provider<TimerRepository> {
  TimerRepositoryProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'timerRepositoryProvider',
        isAutoDispose: false,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$timerRepositoryHash();

  @$internal
  @override
  $ProviderElement<TimerRepository> $createElement($ProviderPointer pointer) =>
      $ProviderElement(pointer);

  @override
  TimerRepository create(Ref ref) {
    return timerRepository(ref);
  }

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(TimerRepository value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<TimerRepository>(value),
    );
  }
}

String _$timerRepositoryHash() => r'86596c19f0f7fc649736093ee8e5cbdbff140115';

/// The running timer, if any.

@ProviderFor(runningTimer)
final runningTimerProvider = RunningTimerProvider._();

/// The running timer, if any.

final class RunningTimerProvider
    extends
        $FunctionalProvider<
          AsyncValue<WorkTimer?>,
          WorkTimer?,
          Stream<WorkTimer?>
        >
    with $FutureModifier<WorkTimer?>, $StreamProvider<WorkTimer?> {
  /// The running timer, if any.
  RunningTimerProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'runningTimerProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$runningTimerHash();

  @$internal
  @override
  $StreamProviderElement<WorkTimer?> $createElement($ProviderPointer pointer) =>
      $StreamProviderElement(pointer);

  @override
  Stream<WorkTimer?> create(Ref ref) {
    return runningTimer(ref);
  }
}

String _$runningTimerHash() => r'0234f25217c1c7394e23ca7df9515985db2bdb91';
