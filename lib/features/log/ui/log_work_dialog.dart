import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/log_repository.dart';
import '../domain/duration.dart';
import 'duration_field.dart';

/// Logs work on a project or a task (with the task's project or KR) with
/// an optional duration and note.
Future<void> showLogWorkDialog(
  BuildContext context, {
  String? projectId,
  String? keyResultId,
  String? taskId,
}) => showDialog<void>(
  context: context,
  builder: (context) => _LogWorkDialog(
    projectId: projectId,
    keyResultId: keyResultId,
    taskId: taskId,
  ),
);

class _LogWorkDialog extends ConsumerStatefulWidget {
  const _LogWorkDialog({this.projectId, this.keyResultId, this.taskId});

  final String? projectId;
  final String? keyResultId;
  final String? taskId;

  @override
  ConsumerState<_LogWorkDialog> createState() => _LogWorkDialogState();
}

class _LogWorkDialogState extends ConsumerState<_LogWorkDialog> {
  final _duration = TextEditingController();
  final _note = TextEditingController();
  String? _durationError;
  bool _saving = false;

  @override
  void dispose() {
    _duration.dispose();
    _note.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    final error = durationErrorText(_duration.text);
    if (error != null) {
      setState(() => _durationError = error);
      return;
    }
    setState(() => _saving = true);
    await ref
        .read(logRepositoryProvider)
        .createManual(
          projectId: widget.projectId,
          keyResultId: widget.keyResultId,
          taskId: widget.taskId,
          durationMinutes: parseDuration(_duration.text),
          note: _note.text,
        );
    if (mounted) Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Log work'),
      content: SizedBox(
        width: 360,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            DurationField(
              controller: _duration,
              errorText: _durationError,
              onChanged: (_) {
                if (_durationError != null) {
                  setState(() => _durationError = null);
                }
              },
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _note,
              decoration: const InputDecoration(labelText: 'Note (optional)'),
              textCapitalization: TextCapitalization.sentences,
              minLines: 1,
              maxLines: 3,
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
