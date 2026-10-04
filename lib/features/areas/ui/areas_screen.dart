import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/widgets/area_dot.dart';
import '../../../core/widgets/async_body.dart';
import '../../../core/widgets/confirm_delete.dart';
import '../../../core/widgets/empty_state.dart';
import '../../../core/widgets/max_width_body.dart';
import '../../../core/db/app_database.dart';
import '../data/area_repository.dart';
import 'area_dialog.dart';

class AreasScreen extends ConsumerWidget {
  const AreasScreen({super.key});

  Future<void> _delete(BuildContext context, WidgetRef ref, Area area) async {
    final confirmed = await confirmDelete(
      context,
      title: 'Delete "${area.name}"?',
      message: 'Projects in this area keep existing without an area.',
    );
    if (confirmed) await ref.read(areaRepositoryProvider).delete(area.id);
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(title: const Text('Areas')),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => showAreaDialog(context),
        icon: const Icon(Icons.add),
        label: const Text('New area'),
      ),
      body: AsyncBody(
        value: ref.watch(areasProvider),
        data: (areas) => areas.isEmpty
            ? const EmptyState(
                icon: Icons.category_outlined,
                message: 'No areas yet.',
              )
            : MaxWidthBody(
                child: ListView(
                  padding: const EdgeInsets.only(bottom: 88),
                  children: [
                    for (final area in areas)
                      ListTile(
                        leading: AreaDot(color: area.color, size: 20),
                        title: Text(area.name),
                        onTap: () => showAreaDialog(context, area: area),
                        trailing: IconButton(
                          tooltip: 'Delete ${area.name}',
                          icon: const Icon(Icons.delete_outline),
                          onPressed: () => _delete(context, ref, area),
                        ),
                      ),
                  ],
                ),
              ),
      ),
    );
  }
}
