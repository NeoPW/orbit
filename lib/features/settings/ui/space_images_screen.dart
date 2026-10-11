import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/space/space_images.dart';
import '../../../core/time/today.dart';
import '../../../core/widgets/max_width_body.dart';
import '../data/settings_repository.dart';

/// The bundled Hubble photos with their credits (CC BY 4.0). One can be
/// pinned as the background; otherwise it changes every day.
class SpaceImagesScreen extends ConsumerWidget {
  const SpaceImagesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final pinned = ref.watch(pinnedSpaceImageProvider).value;
    final today = spaceImageFor(ref.watch(todayProvider));
    final repo = ref.read(settingsRepositoryProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Space images')),
      body: MaxWidthBody(
        child: CustomScrollView(
          slivers: [
            SliverToBoxAdapter(
              child: Card(
                margin: const EdgeInsets.fromLTRB(16, 8, 16, 16),
                child: ListTile(
                  leading: Icon(
                    pinned == null
                        ? Icons.check_circle
                        : Icons.radio_button_unchecked,
                    color: pinned == null ? theme.colorScheme.primary : null,
                  ),
                  title: const Text('A new image every day'),
                  subtitle: Text('Today: ${today.title}'),
                  onTap: () => repo.setPinnedSpaceImage(null),
                ),
              ),
            ),
            SliverPadding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              sliver: SliverGrid.builder(
                gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
                  maxCrossAxisExtent: 260,
                  mainAxisSpacing: 12,
                  crossAxisSpacing: 12,
                  childAspectRatio: 0.7,
                ),
                itemCount: spaceImages.length,
                itemBuilder: (context, i) {
                  final image = spaceImages[i];
                  return _ImageTile(
                    image: image,
                    selected: image.name == pinned,
                    onTap: () => repo.setPinnedSpaceImage(image.name),
                  );
                },
              ),
            ),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
                child: Text(
                  'All images: ESA/Hubble, licensed under CC BY 4.0 '
                  '(creativecommons.org/licenses/by/4.0). '
                  'Sources at esahubble.org.',
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ImageTile extends StatelessWidget {
  const _ImageTile({
    required this.image,
    required this.selected,
    required this.onTap,
  });

  final SpaceImage image;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Semantics(
      selected: selected,
      button: true,
      label: image.title,
      child: Material(
        clipBehavior: Clip.antiAlias,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: BorderSide(
            color: selected ? theme.colorScheme.primary : Colors.transparent,
            width: 2,
          ),
        ),
        child: InkWell(
          onTap: onTap,
          child: Stack(
            fit: StackFit.expand,
            children: [
              Image.asset(
                image.asset,
                fit: BoxFit.cover,
                cacheWidth: 400,
                errorBuilder: (_, _, _) =>
                    const ColoredBox(color: Color(0xFF05070F)),
              ),
              const DecoratedBox(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    stops: [0.45, 1],
                    colors: [Colors.transparent, Color(0xE6000000)],
                  ),
                ),
              ),
              Positioned(
                left: 10,
                right: 10,
                bottom: 8,
                child: ExcludeSemantics(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        image.title,
                        style: theme.textTheme.titleSmall?.copyWith(
                          color: Colors.white,
                        ),
                      ),
                      Text(
                        image.credit,
                        maxLines: 4,
                        overflow: TextOverflow.ellipsis,
                        style: theme.textTheme.labelSmall?.copyWith(
                          color: Colors.white70,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              if (selected)
                Positioned(
                  top: 8,
                  right: 8,
                  child: Icon(
                    Icons.check_circle,
                    color: theme.colorScheme.primary,
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}
