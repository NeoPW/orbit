// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'reminder_sync.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning
/// The current [ReminderInputs], updated after every relevant write.

@ProviderFor(reminderInputs)
final reminderInputsProvider = ReminderInputsProvider._();

/// The current [ReminderInputs], updated after every relevant write.

final class ReminderInputsProvider
    extends
        $FunctionalProvider<
          AsyncValue<ReminderInputs>,
          AsyncValue<ReminderInputs>,
          AsyncValue<ReminderInputs>
        >
    with $Provider<AsyncValue<ReminderInputs>> {
  /// The current [ReminderInputs], updated after every relevant write.
  ReminderInputsProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'reminderInputsProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$reminderInputsHash();

  @$internal
  @override
  $ProviderElement<AsyncValue<ReminderInputs>> $createElement(
    $ProviderPointer pointer,
  ) => $ProviderElement(pointer);

  @override
  AsyncValue<ReminderInputs> create(Ref ref) {
    return reminderInputs(ref);
  }

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(AsyncValue<ReminderInputs> value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<AsyncValue<ReminderInputs>>(value),
    );
  }
}

String _$reminderInputsHash() => r'1551e511c4ff011fc2f9ce3b7c9c1bac54d27e79';

/// Keeps the scheduled reminders equal to the current plan (notifications
/// spec, "Reminders stay up to date"): re-plans after changes (debounced),
/// and when the app returns to the foreground. Watched by
/// `ReminderSyncScope` while the app runs.

@ProviderFor(ReminderSync)
final reminderSyncProvider = ReminderSyncProvider._();

/// Keeps the scheduled reminders equal to the current plan (notifications
/// spec, "Reminders stay up to date"): re-plans after changes (debounced),
/// and when the app returns to the foreground. Watched by
/// `ReminderSyncScope` while the app runs.
final class ReminderSyncProvider extends $NotifierProvider<ReminderSync, void> {
  /// Keeps the scheduled reminders equal to the current plan (notifications
  /// spec, "Reminders stay up to date"): re-plans after changes (debounced),
  /// and when the app returns to the foreground. Watched by
  /// `ReminderSyncScope` while the app runs.
  ReminderSyncProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'reminderSyncProvider',
        isAutoDispose: false,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$reminderSyncHash();

  @$internal
  @override
  ReminderSync create() => ReminderSync();

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(void value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<void>(value),
    );
  }
}

String _$reminderSyncHash() => r'e2639c5529432bdbc3ae26cb6894ab2982e63d7e';

/// Keeps the scheduled reminders equal to the current plan (notifications
/// spec, "Reminders stay up to date"): re-plans after changes (debounced),
/// and when the app returns to the foreground. Watched by
/// `ReminderSyncScope` while the app runs.

abstract class _$ReminderSync extends $Notifier<void> {
  void build();
  @$mustCallSuper
  @override
  WhenComplete runBuild() {
    final ref = this.ref as $Ref<void, void>;
    final element =
        ref.element
            as $ClassProviderElement<
              AnyNotifier<void, void>,
              void,
              Object?,
              Object?
            >;
    return element.handleCreate(ref, build);
  }
}
