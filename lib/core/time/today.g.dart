// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'today.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning
/// Today's local calendar date. Moves to the next date at local midnight
/// and when the app returns to the foreground on a later date, and only
/// notifies when the date actually changed. Tests override it with a fixed
/// date.

@ProviderFor(Today)
final todayProvider = TodayProvider._();

/// Today's local calendar date. Moves to the next date at local midnight
/// and when the app returns to the foreground on a later date, and only
/// notifies when the date actually changed. Tests override it with a fixed
/// date.
final class TodayProvider extends $NotifierProvider<Today, CalendarDate> {
  /// Today's local calendar date. Moves to the next date at local midnight
  /// and when the app returns to the foreground on a later date, and only
  /// notifies when the date actually changed. Tests override it with a fixed
  /// date.
  TodayProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'todayProvider',
        isAutoDispose: false,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$todayHash();

  @$internal
  @override
  Today create() => Today();

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(CalendarDate value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<CalendarDate>(value),
    );
  }
}

String _$todayHash() => r'b294b4ed1d7ffa1ca5148a84cb2201184cf2ce8f';

/// Today's local calendar date. Moves to the next date at local midnight
/// and when the app returns to the foreground on a later date, and only
/// notifies when the date actually changed. Tests override it with a fixed
/// date.

abstract class _$Today extends $Notifier<CalendarDate> {
  CalendarDate build();
  @$mustCallSuper
  @override
  WhenComplete runBuild() {
    final ref = this.ref as $Ref<CalendarDate, CalendarDate>;
    final element =
        ref.element
            as $ClassProviderElement<
              AnyNotifier<CalendarDate, CalendarDate>,
              CalendarDate,
              Object?,
              Object?
            >;
    return element.handleCreate(ref, build);
  }
}
