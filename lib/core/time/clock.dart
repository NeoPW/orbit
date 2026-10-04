import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'clock.g.dart';

/// Returns the current time in UTC. Injected so tests control "now".
typedef Clock = DateTime Function();

@Riverpod(keepAlive: true)
Clock clock(Ref ref) =>
    () => DateTime.now().toUtc();
