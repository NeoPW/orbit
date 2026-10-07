// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'messenger.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning
/// The message shown at the top of the app, if any. A new message replaces
/// the current one; each disappears after [messageDuration].

@ProviderFor(Messenger)
final messengerProvider = MessengerProvider._();

/// The message shown at the top of the app, if any. A new message replaces
/// the current one; each disappears after [messageDuration].
final class MessengerProvider extends $NotifierProvider<Messenger, Message?> {
  /// The message shown at the top of the app, if any. A new message replaces
  /// the current one; each disappears after [messageDuration].
  MessengerProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'messengerProvider',
        isAutoDispose: false,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$messengerHash();

  @$internal
  @override
  Messenger create() => Messenger();

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(Message? value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<Message?>(value),
    );
  }
}

String _$messengerHash() => r'4a2aab02109768e7e0e0f8f90f9cfba224c4fb3d';

/// The message shown at the top of the app, if any. A new message replaces
/// the current one; each disappears after [messageDuration].

abstract class _$Messenger extends $Notifier<Message?> {
  Message? build();
  @$mustCallSuper
  @override
  WhenComplete runBuild() {
    final ref = this.ref as $Ref<Message?, Message?>;
    final element =
        ref.element
            as $ClassProviderElement<
              AnyNotifier<Message?, Message?>,
              Message?,
              Object?,
              Object?
            >;
    return element.handleCreate(ref, build);
  }
}
