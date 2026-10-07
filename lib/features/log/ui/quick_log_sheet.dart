import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/messages/messenger.dart';
import '../../projects/data/project_repository.dart';
import '../../tasks/data/task_repository.dart';
import '../../timer/data/timer_repository.dart';
import '../data/log_repository.dart';
import '../domain/duration.dart';
import '../domain/quick_log_order.dart';
import 'duration_field.dart';

/// Quick log: optional duration and note, then tapping an active project
/// or a task saves the entry (work-log spec). Two taps from Home for a
/// plain entry. In "Start timer" mode, tapping starts a timer instead.
Future<void> showQuickLog(BuildContext context) => showModalBottomSheet<void>(
  context: context,
  isScrollControlled: true,
  useSafeArea: true,
  showDragHandle: true,
  constraints: const BoxConstraints(maxWidth: 640),
  builder: (_) => const _QuickLogSheet(),
);

class _QuickLogSheet extends ConsumerStatefulWidget {
  const _QuickLogSheet();

  @override
  ConsumerState<_QuickLogSheet> createState() => _QuickLogSheetState();
}

class _QuickLogSheetState extends ConsumerState<_QuickLogSheet> {
  final _duration = TextEditingController();
  final _note = TextEditingController();
  String? _durationError;
  bool _saving = false;

  /// "Start timer" instead of "Log" (work-log spec, "Quick log").
  bool _timerMode = false;

  @override
  void dispose() {
    _duration.dispose();
    _note.dispose();
    super.dispose();
  }

  /// Logs on a project, or on a task (with the task's KR).
  Future<void> _log({
    required String title,
    String? projectId,
    String? keyResultId,
    String? taskId,
  }) async {
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
          projectId: projectId,
          keyResultId: keyResultId,
          taskId: taskId,
          durationMinutes: parseDuration(_duration.text),
          note: _note.text,
        );
    if (!mounted) return;
    Navigator.of(context).pop();
    showMessage(ref, 'Logged work on $title', icon: Icons.more_time);
  }

  /// Starts a timer for [target] (work-timer spec, "Start a timer").
  Future<void> _startTimer(String title, TimerTarget target) async {
    if (_saving) return;
    setState(() => _saving = true);
    await ref.read(timerRepositoryProvider).start(target);
    if (!mounted) return;
    Navigator.of(context).pop();
    showMessage(ref, 'Timer started for $title', icon: Icons.timer_outlined);
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final projects = ref.watch(activeProjectsProvider).value;
    final tasks = ref.watch(tasksOutsideProjectsProvider).value;
    final lastProjects = ref.watch(lastLoggedAtProvider).value;
    final lastTasks = ref.watch(lastLoggedAtTasksProvider).value;
    final ordered =
        projects == null ||
            tasks == null ||
            lastProjects == null ||
            lastTasks == null
        ? null
        : orderQuickLogTargets(
            projects: projects,
            tasks: tasks,
            lastLoggedProjects: lastProjects,
            lastLoggedTasks: lastTasks,
          );
    Widget group(String text) => Padding(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
      child: Text(text, style: theme.textTheme.labelMedium),
    );

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
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
            child: SegmentedButton<bool>(
              segments: const [
                ButtonSegment(
                  value: false,
                  icon: Icon(Icons.edit_note),
                  label: Text('Log'),
                ),
                ButtonSegment(
                  value: true,
                  icon: Icon(Icons.timer_outlined),
                  label: Text('Start timer'),
                ),
              ],
              selected: {_timerMode},
              onSelectionChanged: (selection) =>
                  setState(() => _timerMode = selection.single),
            ),
          ),
          if (!_timerMode)
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
            child: Text(
              _timerMode ? 'Choose what to time' : 'Choose what you worked on',
              style: theme.textTheme.labelLarge,
            ),
          ),
          Flexible(
            child: switch (ordered) {
              null => const Padding(
                padding: EdgeInsets.all(24),
                child: Center(child: CircularProgressIndicator()),
              ),
              (projects: [], tasks: []) => const Padding(
                padding: EdgeInsets.fromLTRB(16, 8, 16, 24),
                child: Text('There is nothing to log work on yet.'),
              ),
              (:final projects, :final tasks) => ListView(
                shrinkWrap: true,
                padding: const EdgeInsets.only(bottom: 16),
                children: [
                  if (projects.isNotEmpty) group('Projects'),
                  for (final project in projects)
                    ListTile(
                      leading: const Icon(Icons.folder_outlined),
                      title: Text(project.title),
                      enabled: !_saving,
                      onTap: () => _timerMode
                          ? _startTimer(
                              project.title,
                              TimerForProject(project.id),
                            )
                          : _log(title: project.title, projectId: project.id),
                    ),
                  if (tasks.isNotEmpty) group('Tasks'),
                  for (final task in tasks)
                    ListTile(
                      leading: const Icon(Icons.task_alt),
                      title: Text(task.title),
                      enabled: !_saving,
                      onTap: () => _timerMode
                          ? _startTimer(task.title, TimerForTask(task.id))
                          : _log(
                              title: task.title,
                              keyResultId: task.keyResultId,
                              taskId: task.id,
                            ),
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
