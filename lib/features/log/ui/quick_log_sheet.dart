import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/db/app_database.dart';
import '../../projects/data/project_repository.dart';
import '../data/log_repository.dart';
import '../domain/duration.dart';
import '../domain/quick_log_order.dart';
import 'duration_field.dart';

/// Quick log: optional duration and note, then tapping an active project
/// saves the entry (work-log spec). Two taps from Home for a plain entry.
Future<void> showQuickLog(BuildContext context) => showModalBottomSheet<void>(
  context: context,
  isScrollControlled: true,
  useSafeArea: true,
  showDragHandle: true,
  constraints: const BoxConstraints(maxWidth: 640),
  builder: (_) => _QuickLogSheet(messenger: ScaffoldMessenger.of(context)),
);

class _QuickLogSheet extends ConsumerStatefulWidget {
  const _QuickLogSheet({required this.messenger});

  /// The caller's messenger, which outlives the sheet.
  final ScaffoldMessengerState messenger;

  @override
  ConsumerState<_QuickLogSheet> createState() => _QuickLogSheetState();
}

class _QuickLogSheetState extends ConsumerState<_QuickLogSheet> {
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

  Future<void> _log(Project project) async {
    final error = durationErrorText(_duration.text);
    if (error != null) {
      setState(() => _durationError = error);
      return;
    }
    if (_saving) return;
    setState(() => _saving = true);
    await ref
        .read(logRepositoryProvider)
        .createManual(
          projectId: project.id,
          durationMinutes: parseDuration(_duration.text),
          note: _note.text,
        );
    if (!mounted) return;
    Navigator.of(context).pop();
    widget.messenger
      ..hideCurrentSnackBar()
      ..showSnackBar(
        SnackBar(content: Text('Logged work on ${project.title}')),
      );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final projects = ref.watch(activeProjectsProvider).value;
    final lastLogged = ref.watch(lastLoggedAtProvider).value;
    final ordered = projects == null || lastLogged == null
        ? null
        : orderQuickLogProjects(projects, lastLogged);

    return Padding(
      // Keeps the fields above the on-screen keyboard.
      padding: EdgeInsets.only(bottom: MediaQuery.viewInsetsOf(context).bottom),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
            child: Text('Log work', style: theme.textTheme.titleLarge),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                SizedBox(
                  width: 140,
                  child: DurationField(
                    controller: _duration,
                    errorText: _durationError,
                    onChanged: (_) {
                      if (_durationError != null) {
                        setState(() => _durationError = null);
                      }
                    },
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: TextField(
                    controller: _note,
                    decoration: const InputDecoration(
                      labelText: 'Note (optional)',
                    ),
                    textCapitalization: TextCapitalization.sentences,
                  ),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 4),
            child: Text('Choose a project', style: theme.textTheme.labelLarge),
          ),
          Flexible(
            child: switch (ordered) {
              null => const Padding(
                padding: EdgeInsets.all(24),
                child: Center(child: CircularProgressIndicator()),
              ),
              [] => const Padding(
                padding: EdgeInsets.fromLTRB(16, 8, 16, 24),
                child: Text('There are no active projects to log work on.'),
              ),
              _ => ListView(
                shrinkWrap: true,
                padding: const EdgeInsets.only(bottom: 16),
                children: [
                  for (final project in ordered)
                    ListTile(
                      leading: const Icon(Icons.folder_outlined),
                      title: Text(project.title),
                      enabled: !_saving,
                      onTap: () => _log(project),
                    ),
                ],
              ),
            },
          ),
        ],
      ),
    );
  }
}
