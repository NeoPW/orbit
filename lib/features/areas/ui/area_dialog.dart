import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/db/app_database.dart';
import '../../../core/theme/area_palette.dart';
import '../../../core/widgets/area_dot.dart';
import '../data/area_repository.dart';

/// Creates an area, or edits [area] when given.
Future<void> showAreaDialog(BuildContext context, {Area? area}) =>
    showDialog<void>(
      context: context,
      builder: (context) => _AreaDialog(area: area),
    );

class _AreaDialog extends ConsumerStatefulWidget {
  const _AreaDialog({this.area});

  final Area? area;

  @override
  ConsumerState<_AreaDialog> createState() => _AreaDialogState();
}

class _AreaDialogState extends ConsumerState<_AreaDialog> {
  late final _name = TextEditingController(text: widget.area?.name);
  late String _color = widget.area?.color ?? areaPalette.first;
  String? _nameError;
  bool _saving = false;

  @override
  void dispose() {
    _name.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    final repo = ref.read(areaRepositoryProvider);
    final name = _name.text.trim();
    String? error;
    if (name.isEmpty) {
      error = 'Enter a name';
    } else if (await repo.isNameTaken(name, excludeId: widget.area?.id)) {
      error = 'This name is already used';
    }
    if (error != null) {
      setState(() => _nameError = error);
      return;
    }

    setState(() => _saving = true);
    final area = widget.area;
    if (area == null) {
      await repo.create(name: name, color: _color);
    } else {
      await repo.update(area.copyWith(name: name, color: _color));
    }
    if (mounted) Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return AlertDialog(
      title: Text(widget.area == null ? 'New area' : 'Edit area'),
      content: SizedBox(
        width: 360,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            TextField(
              controller: _name,
              autofocus: true,
              decoration: InputDecoration(
                labelText: 'Name',
                errorText: _nameError,
              ),
              textCapitalization: TextCapitalization.sentences,
              onChanged: (_) {
                if (_nameError != null) setState(() => _nameError = null);
              },
              onSubmitted: (_) => _save(),
            ),
            const SizedBox(height: 16),
            Text('Color', style: Theme.of(context).textTheme.labelLarge),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                for (final color in areaPalette)
                  Semantics(
                    label: 'Color $color',
                    selected: color == _color,
                    button: true,
                    child: InkWell(
                      customBorder: const CircleBorder(),
                      onTap: () => setState(() => _color = color),
                      child: Container(
                        padding: const EdgeInsets.all(3),
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          border: Border.all(
                            width: 2,
                            color: color == _color
                                ? colorScheme.onSurface
                                : Colors.transparent,
                          ),
                        ),
                        child: AreaDot(color: color, size: 28),
                      ),
                    ),
                  ),
              ],
            ),
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: const Text('Cancel'),
        ),
        FilledButton(
          onPressed: _saving ? null : _save,
          child: const Text('Save'),
        ),
      ],
    );
  }
}
