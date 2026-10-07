import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/db/app_database.dart';
import '../../../core/router/routes.dart';
import '../../../core/widgets/date_field.dart';
import '../data/task_repository.dart';
import '../domain/task_assignment.dart';
import 'assignment_picker.dart';

/// Quick task creation from Home and Plan (home spec, "New task from
/// Home"): title, optional deadline and assignment. Only a title makes a
/// standalone task.
Future<void> showNewTaskSheet(BuildContext context) =>
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      showDragHandle: true,
      constraints: const BoxConstraints(maxWidth: 640),
      builder: (_) => _NewTaskSheet(messenger: ScaffoldMessenger.of(context)),
    );

class _NewTaskSheet extends ConsumerStatefulWidget {
  const _NewTaskSheet({required this.messenger});

  /// The caller's messenger, which outlives the sheet.
  final ScaffoldMessengerState messenger;

  @override
  ConsumerState<_NewTaskSheet> createState() => _NewTaskSheetState();
}

class _NewTaskSheetState extends ConsumerState<_NewTaskSheet> {
  final _title = TextEditingController();
  CalendarDate? _dueDate;
  TaskAssignment _assignment = const Standalone();
  String? _titleError;
  bool _saving = false;

  @override
  void dispose() {
    _title.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    final title = _title.text.trim();
    if (title.isEmpty) {
      setState(() => _titleError = 'Enter a title');
      return;
    }
    setState(() => _saving = true);
    final task = await ref
        .read(taskRepositoryProvider)
        .create(title: title, dueDate: _dueDate, assignment: _assignment);
    if (!mounted) return;
    final router = GoRouter.of(context);
    Navigator.of(context).pop();
    widget.messenger
      ..hideCurrentSnackBar()
      ..showSnackBar(
        SnackBar(
          content: Text('Task "$title" created'),
          action: SnackBarAction(
            label: 'Open',
            onPressed: () => router.push(Routes.task(task.id)),
          ),
        ),
      );
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.fromLTRB(
        16,
        0,
        16,
        16 + MediaQuery.viewInsetsOf(context).bottom,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text('New task', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 12),
          TextField(
            controller: _title,
            autofocus: true,
            decoration: InputDecoration(
              labelText: 'Title',
              errorText: _titleError,
            ),
            textCapitalization: TextCapitalization.sentences,
            onChanged: (_) {
              if (_titleError != null) setState(() => _titleError = null);
            },
            onSubmitted: (_) => _save(),
          ),
          const SizedBox(height: 12),
          DateField(
            label: 'Deadline',
            value: _dueDate,
            clearable: true,
            onChanged: (date) => setState(() => _dueDate = date),
          ),
          const SizedBox(height: 12),
          AssignmentPicker(
            value: _assignment,
            onChanged: (value) => setState(() => _assignment = value),
          ),
          const SizedBox(height: 16),
          FilledButton(
            onPressed: _saving ? null : _save,
            child: const Text('Save'),
          ),
        ],
      ),
    );
  }
}
