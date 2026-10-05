import 'package:flutter/widgets.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/sync_scheduler.dart';

/// Keeps the sync scheduler running while the app runs.
class SyncScope extends ConsumerWidget {
  const SyncScope({super.key, required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    ref.watch(syncSchedulerProvider);
    return child;
  }
}
