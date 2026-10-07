import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/router/routes.dart';

/// The Plan tab's More sheet (plan-overview spec, "More sheet"): large
/// tiles for Habits, Areas and Archive.
Future<void> showMoreSheet(BuildContext context) async {
  final route = await showModalBottomSheet<String>(
    context: context,
    showDragHandle: true,
    constraints: const BoxConstraints(maxWidth: 640),
    builder: (context) => SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
        child: Row(
          children: [
            for (final (label, icon, route) in [
              ('Habits', Icons.repeat, Routes.habits),
              ('Areas', Icons.category_outlined, Routes.areas),
              ('Archive', Icons.archive_outlined, Routes.archive),
            ])
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 4),
                  child: _Tile(
                    label: label,
                    icon: icon,
                    onTap: () => Navigator.of(context).pop(route),
                  ),
                ),
              ),
          ],
        ),
      ),
    ),
  );
  if (route != null && context.mounted) await context.push(route);
}

class _Tile extends StatelessWidget {
  const _Tile({required this.label, required this.icon, required this.onTap});

  final String label;
  final IconData icon;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colors = theme.colorScheme;
    return Card(
      margin: EdgeInsets.zero,
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 8),
          child: Column(
            children: [
              CircleAvatar(
                radius: 26,
                backgroundColor: colors.primaryContainer,
                foregroundColor: colors.onPrimaryContainer,
                child: Icon(icon, size: 26),
              ),
              const SizedBox(height: 10),
              Text(label, style: theme.textTheme.titleSmall),
            ],
          ),
        ),
      ),
    );
  }
}
