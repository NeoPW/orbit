import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../features/settings/data/settings_repository.dart';
import '../time/today.dart';
import 'space_images.dart';

/// Today's Hubble image behind the whole app, darkened so text stays
/// readable; crossfades when the image changes.
class SpaceBackground extends ConsumerWidget {
  const SpaceBackground({super.key, required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final pinned = ref.watch(pinnedSpaceImageProvider).value;
    final image = spaceImageFor(ref.watch(todayProvider), pinned: pinned);
    final animate = !MediaQuery.disableAnimationsOf(context);
    return Stack(
      fit: StackFit.expand,
      children: [
        const ColoredBox(color: Color(0xFF05070F)),
        AnimatedSwitcher(
          duration: animate
              ? const Duration(milliseconds: 1200)
              : Duration.zero,
          child: Image.asset(
            image.asset,
            key: ValueKey(image.name),
            fit: BoxFit.cover,
            width: double.infinity,
            height: double.infinity,
            // Decode at screen size, not the full 1280 px, on small phones.
            cacheWidth:
                (MediaQuery.sizeOf(context).width *
                        MediaQuery.devicePixelRatioOf(context))
                    .round()
                    .clamp(480, 1280),
            errorBuilder: (_, _, _) => const SizedBox.expand(),
          ),
        ),
        // Darker at the top and bottom, where bars and buttons sit.
        const DecoratedBox(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [
                Color(0xE605070F),
                Color(0x9905070F),
                Color(0xA605070F),
                Color(0xF205070F),
              ],
              stops: [0, 0.3, 0.7, 1],
            ),
          ),
        ),
        child,
      ],
    );
  }
}
