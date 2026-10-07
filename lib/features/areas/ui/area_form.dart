import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/db/app_database.dart';
import '../../../core/theme/area_palette.dart';
import '../../../core/widgets/area_dot.dart';
import '../../../core/widgets/confirm_delete.dart';
import '../../../core/widgets/form_sheet.dart';
import '../data/area_repository.dart';

/// Opens the area form in a sheet: a new area, or [area] to edit.
Future<FormResult?> showAreaForm(BuildContext context, {Area? area}) =>
    showFormSheet(context, builder: (_) => _AreaForm(area: area));

class _AreaForm extends ConsumerStatefulWidget {
  const _AreaForm({this.area});

  final Area? area;

  @override
  ConsumerState<_AreaForm> createState() => _AreaFormState();
}

class _AreaFormState extends ConsumerState<_AreaForm> {
  final _formKey = GlobalKey<FormState>();
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
    if (mounted) closeFormSheet(context);
  }

  Future<void> _delete() async {
    final area = widget.area!;
    final confirmed = await confirmDelete(
      context,
      title: 'Delete "${area.name}"?',
      message: 'Projects in this area keep existing without an area.',
    );
    if (!confirmed) return;
    await ref.read(areaRepositoryProvider).delete(area.id);
    if (mounted) closeFormSheet(context, FormResult.deleted);
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return FormSheetFrame(
      formKey: _formKey,
      title: widget.area == null ? 'New area' : 'Edit area',
      onSave: _saving ? null : _save,
      onDelete: widget.area == null ? null : _delete,
      deleteTooltip: 'Delete area',
      children: [
        TextField(
          controller: _name,
          autofocus: widget.area == null,
          decoration: InputDecoration(labelText: 'Name', errorText: _nameError),
          textCapitalization: TextCapitalization.sentences,
          onChanged: (_) {
            if (_nameError != null) setState(() => _nameError = null);
          },
          onSubmitted: (_) => _save(),
        ),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
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
      ],
    );
  }
}
