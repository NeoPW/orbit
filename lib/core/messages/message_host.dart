import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'messenger.dart';

/// Shows the current [Messenger] message as a card at the top of [child],
/// above every route, so it survives closing sheets and changing pages.
class MessageHost extends ConsumerWidget {
  const MessageHost({super.key, required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final message = ref.watch(messengerProvider);
    final animate = !MediaQuery.disableAnimationsOf(context);
    return Stack(
      children: [
        child,
        Positioned(
          top: 0,
          left: 0,
          right: 0,
          child: SafeArea(
            bottom: false,
            child: AnimatedSwitcher(
              duration: animate
                  ? const Duration(milliseconds: 200)
                  : Duration.zero,
              transitionBuilder: (child, animation) => FadeTransition(
                opacity: animation,
                child: SlideTransition(
                  position: Tween(
                    begin: const Offset(0, -0.5),
                    end: Offset.zero,
                  ).animate(animation),
                  child: child,
                ),
              ),
              child: message == null
                  ? const SizedBox.shrink()
                  : Dismissible(
                      key: ValueKey(message.id),
                      direction: DismissDirection.up,
                      onDismissed: (_) =>
                          ref.read(messengerProvider.notifier).dismiss(),
                      child: _MessageCard(message: message),
                    ),
            ),
          ),
        ),
      ],
    );
  }
}

class _MessageCard extends ConsumerWidget {
  const _MessageCard({required this.message});

  final Message message;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final colors = theme.colorScheme;
    final action = message.action;
    return Align(
      alignment: Alignment.topCenter,
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 560),
        child: Padding(
          padding: const EdgeInsets.fromLTRB(12, 8, 12, 0),
          child: Material(
            color: colors.surfaceContainerHigh,
            elevation: 3,
            shadowColor: Colors.black54,
            borderRadius: BorderRadius.circular(16),
            child: Padding(
              padding: EdgeInsets.fromLTRB(16, 4, action == null ? 16 : 4, 4),
              child: ConstrainedBox(
                constraints: const BoxConstraints(minHeight: 48),
                child: Row(
                  children: [
                    Icon(message.icon, size: 20, color: colors.primary),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        message.text,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: theme.textTheme.bodyMedium,
                      ),
                    ),
                    if (action != null)
                      TextButton(
                        onPressed: () {
                          ref.read(messengerProvider.notifier).dismiss();
                          action.onPressed();
                        },
                        child: Text(action.label),
                      ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
