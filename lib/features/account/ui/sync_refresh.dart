import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/sync_scheduler.dart';

/// Pull to refresh runs a sync when signed in (sync spec, "When sync
/// runs"); otherwise the indicator ends right away.
class SyncRefresh extends ConsumerWidget {
  const SyncRefresh({super.key, required this.child});

  /// A scrollable, e.g. a [ListView].
  final Widget child;

  @override
  Widget build(BuildContext context, WidgetRef ref) => RefreshIndicator(
    onRefresh: () => ref.read(syncSchedulerProvider.notifier).syncNow(),
    child: child,
  );
}
