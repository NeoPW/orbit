// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'notification_scheduler.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning
/// The platform's scheduler. Tests override it with a fake.

@ProviderFor(notificationScheduler)
final notificationSchedulerProvider = NotificationSchedulerProvider._();

/// The platform's scheduler. Tests override it with a fake.

final class NotificationSchedulerProvider
    extends
        $FunctionalProvider<
          NotificationScheduler,
          NotificationScheduler,
          NotificationScheduler
        >
    with $Provider<NotificationScheduler> {
  /// The platform's scheduler. Tests override it with a fake.
  NotificationSchedulerProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'notificationSchedulerProvider',
        isAutoDispose: false,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$notificationSchedulerHash();

  @$internal
  @override
  $ProviderElement<NotificationScheduler> $createElement(
    $ProviderPointer pointer,
  ) => $ProviderElement(pointer);

  @override
  NotificationScheduler create(Ref ref) {
    return notificationScheduler(ref);
  }

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(NotificationScheduler value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<NotificationScheduler>(value),
    );
  }
}

String _$notificationSchedulerHash() =>
    r'20437e91538a331f2b13dd69f34012f208cdd2fa';

/// Whether the system allows notifications; re-read by invalidating it.

@ProviderFor(notificationsAllowed)
final notificationsAllowedProvider = NotificationsAllowedProvider._();

/// Whether the system allows notifications; re-read by invalidating it.

final class NotificationsAllowedProvider
    extends $FunctionalProvider<AsyncValue<bool>, bool, FutureOr<bool>>
    with $FutureModifier<bool>, $FutureProvider<bool> {
  /// Whether the system allows notifications; re-read by invalidating it.
  NotificationsAllowedProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'notificationsAllowedProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$notificationsAllowedHash();

  @$internal
  @override
  $FutureProviderElement<bool> $createElement($ProviderPointer pointer) =>
      $FutureProviderElement(pointer);

  @override
  FutureOr<bool> create(Ref ref) {
    return notificationsAllowed(ref);
  }
}

String _$notificationsAllowedHash() =>
    r'638df6ca9b2d227f14f89dd066c6b629e698c398';

@ProviderFor(NotificationTap)
final notificationTapProvider = NotificationTapProvider._();

final class NotificationTapProvider
    extends $NotifierProvider<NotificationTap, NotificationTapEvent?> {
  NotificationTapProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'notificationTapProvider',
        isAutoDispose: false,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$notificationTapHash();

  @$internal
  @override
  NotificationTap create() => NotificationTap();

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(NotificationTapEvent? value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<NotificationTapEvent?>(value),
    );
  }
}

String _$notificationTapHash() => r'02aa4e1dccbad119465d84ec2e21a11a6e528619';

abstract class _$NotificationTap extends $Notifier<NotificationTapEvent?> {
  NotificationTapEvent? build();
  @$mustCallSuper
  @override
  WhenComplete runBuild() {
    final ref = this.ref as $Ref<NotificationTapEvent?, NotificationTapEvent?>;
    final element =
        ref.element
            as $ClassProviderElement<
              AnyNotifier<NotificationTapEvent?, NotificationTapEvent?>,
              NotificationTapEvent?,
              Object?,
              Object?
            >;
    return element.handleCreate(ref, build);
  }
}
