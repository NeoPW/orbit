import 'package:flutter/material.dart';

/// A heading for a section of a screen, with an optional action on the
/// right.
class SectionHeading extends StatelessWidget {
  const SectionHeading(this.text, {super.key, this.action});

  final String text;
  final Widget? action;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 20, 8, 4),
      child: Row(
        children: [
          Expanded(
            child: Text(text, style: Theme.of(context).textTheme.titleMedium),
          ),
          ?action,
        ],
      ),
    );
  }
}

/// An empty section: an icon, one muted line and optionally the action
/// that fills it (visual-design spec, "Empty states").
class SectionEmptyText extends StatelessWidget {
  const SectionEmptyText(
    this.text, {
    super.key,
    this.icon = Icons.blur_on_outlined,
    this.action,
  });

  final String text;
  final IconData icon;
  final Widget? action;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 4, 8, 4),
      child: Row(
        children: [
          Icon(icon, size: 20, color: colors.outline),
          const SizedBox(width: 12),
          Expanded(
            child: Text(text, style: TextStyle(color: colors.onSurfaceVariant)),
          ),
          ?action,
        ],
      ),
    );
  }
}
