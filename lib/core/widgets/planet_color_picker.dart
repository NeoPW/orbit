import 'package:flutter/material.dart';

import '../space/planets.dart';
import '../space/space_colors.dart';
import 'area_dot.dart';

/// Picks a color from [spacePalette], shown as planets. With [auto], the
/// first choice is "Auto" (null), previewed in that color.
class PlanetColorPicker extends StatelessWidget {
  const PlanetColorPicker({
    super.key,
    required this.label,
    required this.value,
    required this.onChanged,
    this.auto,
  });

  final String label;

  /// `#RRGGBB`, or null for Auto.
  final String? value;
  final ValueChanged<String?> onChanged;

  /// The color Auto stands for; null hides the Auto choice.
  final Color? auto;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: theme.textTheme.labelLarge),
        const SizedBox(height: 8),
        Wrap(
          spacing: 6,
          runSpacing: 6,
          children: [
            if (auto != null)
              _Swatch(
                semantics: 'Auto color',
                color: auto!,
                selected: value == null,
                badge: Icons.auto_awesome,
                onTap: () => onChanged(null),
              ),
            for (final hex in spacePalette)
              _Swatch(
                semantics: 'Color $hex',
                color: colorFromHex(hex),
                selected: value == hex,
                onTap: () => onChanged(hex),
              ),
          ],
        ),
      ],
    );
  }
}

class _Swatch extends StatelessWidget {
  const _Swatch({
    required this.semantics,
    required this.color,
    required this.selected,
    required this.onTap,
    this.badge,
  });

  final String semantics;
  final Color color;
  final bool selected;
  final VoidCallback onTap;
  final IconData? badge;

  @override
  Widget build(BuildContext context) => Semantics(
    label: semantics,
    selected: selected,
    button: true,
    child: InkWell(
      customBorder: const CircleBorder(),
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(2),
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          border: Border.all(
            width: 2,
            color: selected
                ? Theme.of(context).colorScheme.onSurface
                : Colors.transparent,
          ),
        ),
        child: Stack(
          alignment: Alignment.center,
          children: [
            Planet(color: color, size: 36),
            if (badge != null)
              Icon(badge, size: 14, color: Colors.black.withValues(alpha: 0.7)),
          ],
        ),
      ),
    ),
  );
}
