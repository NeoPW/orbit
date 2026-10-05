import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/db/app_database.dart';
import '../../../core/numbers.dart';
import '../../../core/router/routes.dart';
import '../../key_results/data/key_result_repository.dart';
import '../../projects/data/project_repository.dart';
import '../../projects/ui/project_labels.dart';
import '../../tasks/data/task_repository.dart';
import '../../tasks/ui/task_dialog.dart';
import '../data/review_providers.dart';
import '../data/review_repository.dart';
import '../domain/week_summary.dart';
import 'week_format.dart';
import 'week_summary_view.dart';

/// The guided weekly review of the review week (weekly-review spec): look
/// back, projects, key results, score, plan, save. Score, reflection and
/// plan are kept as a draft when changing steps and when leaving.
class WeeklyReviewScreen extends ConsumerStatefulWidget {
  const WeeklyReviewScreen({super.key});

  @override
  ConsumerState<WeeklyReviewScreen> createState() => _WeeklyReviewState();
}

class _WeeklyReviewState extends ConsumerState<WeeklyReviewScreen> {
  static const _scoreStep = 3;
  static const _lastStep = 5;

  late final CalendarDate _week = ref.read(reviewWeekProvider);
  late final ReviewRepository _reviews = ref.read(reviewRepositoryProvider);
  final _reflection = TextEditingController();
  final _plan = TextEditingController();
  int? _score;
  int _step = 0;
  bool _loaded = false;
  bool _hasReview = false;
  bool _saved = false;
  String? _scoreError;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final review = await _reviews.getForWeek(_week);
    if (!mounted) return;
    setState(() {
      _hasReview = review != null;
      _score = review?.score;
      _reflection.text = review?.reflection ?? '';
      _plan.text = review?.planNextWeek ?? '';
      _loaded = true;
    });
  }

  @override
  void dispose() {
    _reflection.dispose();
    _plan.dispose();
    super.dispose();
  }

  /// Stores the draft, unless nothing was entered for a week without review.
  Future<void> _saveDraft() async {
    if (!_loaded || _saved) return;
    final empty =
        _score == null &&
        _reflection.text.trim().isEmpty &&
        _plan.text.trim().isEmpty;
    if (empty && !_hasReview) return;
    await _reviews.saveDraft(
      _week,
      score: _score,
      reflection: _reflection.text,
      plan: _plan.text,
    );
    _hasReview = true;
  }

  Future<void> _goTo(int step) async {
    await _saveDraft();
    if (mounted) setState(() => _step = step);
  }

  Future<void> _save() async {
    final score = _score;
    if (score == null) {
      setState(() {
        _scoreError = 'Choose a score to save the review';
        _step = _scoreStep;
      });
      return;
    }
    final summary = ref.read(weekSummaryProvider(_week)).value;
    if (summary == null) return;
    await _reviews.complete(
      _week,
      score: score,
      reflection: _reflection.text,
      plan: _plan.text,
      snapshots: {
        for (final kr in summary.keyResults) kr.keyResult.id: kr.progress,
      },
    );
    _saved = true;
    if (!mounted) return;
    if (context.canPop()) {
      context.pop();
    } else {
      context.go(Routes.review);
    }
  }

  @override
  Widget build(BuildContext context) {
    // Kept alive for the whole review: the KR snapshots are taken from it.
    ref.watch(weekSummaryProvider(_week));
    final wide = MediaQuery.sizeOf(context).width >= 600;
    return PopScope(
      onPopInvokedWithResult: (didPop, _) {
        if (didPop) _saveDraft();
      },
      child: Scaffold(
        appBar: AppBar(title: Text('Review ${formatWeek(_week)}')),
        body: !_loaded
            ? const Center(child: CircularProgressIndicator())
            : Align(
                alignment: Alignment.topCenter,
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 840),
                  child: Stepper(
                    type: wide ? StepperType.horizontal : StepperType.vertical,
                    currentStep: _step,
                    onStepTapped: _goTo,
                    onStepContinue: _step == _lastStep
                        ? _save
                        : () => _goTo(_step + 1),
                    onStepCancel: _step == 0 ? null : () => _goTo(_step - 1),
                    controlsBuilder: (context, details) => Padding(
                      padding: const EdgeInsets.only(top: 16),
                      child: Row(
                        children: [
                          FilledButton(
                            onPressed: details.onStepContinue,
                            child: Text(
                              details.stepIndex == _lastStep ? 'Save' : 'Next',
                            ),
                          ),
                          const SizedBox(width: 8),
                          if (details.onStepCancel != null)
                            TextButton(
                              onPressed: details.onStepCancel,
                              child: const Text('Back'),
                            ),
                        ],
                      ),
                    ),
                    steps: [
                      _step0LookBack(),
                      _stepFor(1, 'Projects', const _ProjectsStep()),
                      _stepFor(2, 'Key results', _KeyResultsStep(week: _week)),
                      _stepFor(_scoreStep, 'Score', _scoreContent()),
                      _stepFor(4, 'Plan', _planContent()),
                      _stepFor(_lastStep, 'Save', _saveContent()),
                    ],
                  ),
                ),
              ),
      ),
    );
  }

  Step _stepFor(int index, String title, Widget content) => Step(
    title: Text(title),
    content: content,
    isActive: _step == index,
    state: _step > index ? StepState.complete : StepState.indexed,
  );

  Step _step0LookBack() =>
      _stepFor(0, 'Look back', WeekSummaryView(weekStart: _week));

  Widget _scoreContent() => Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      const Text('How was the week?'),
      const SizedBox(height: 8),
      Wrap(
        spacing: 8,
        runSpacing: 8,
        children: [
          for (var value = 1; value <= 10; value++)
            ChoiceChip(
              label: Text('$value'),
              selected: _score == value,
              onSelected: (_) => setState(() {
                _score = value;
                _scoreError = null;
              }),
            ),
        ],
      ),
      if (_scoreError != null) ...[
        const SizedBox(height: 8),
        Text(
          _scoreError!,
          style: TextStyle(color: Theme.of(context).colorScheme.error),
        ),
      ],
      const SizedBox(height: 16),
      TextField(
        controller: _reflection,
        decoration: const InputDecoration(
          labelText: 'Reflection',
          border: OutlineInputBorder(),
        ),
        textCapitalization: TextCapitalization.sentences,
        minLines: 3,
        maxLines: 8,
      ),
    ],
  );

  Widget _planContent() => TextField(
    controller: _plan,
    decoration: const InputDecoration(
      labelText: 'Plan for next week',
      border: OutlineInputBorder(),
    ),
    textCapitalization: TextCapitalization.sentences,
    minLines: 3,
    maxLines: 8,
  );

  Widget _saveContent() => Align(
    alignment: Alignment.centerLeft,
    child: Text(
      _score == null
          ? 'Choose a score before saving.'
          : 'Save the review with score $_score.',
    ),
  );
}

/// Every active project with its next step, status and next-step actions.
class _ProjectsStep extends ConsumerWidget {
  const _ProjectsStep();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final projects = ref.watch(activeProjectsProvider).value ?? const [];
    final tasks = {
      for (final task in ref.watch(openTasksProvider).value ?? const <Task>[])
        task.id: task,
    };
    if (projects.isEmpty) return const Text('No active projects.');
    return Column(
      children: [
        for (final project in projects)
          _ProjectTile(
            project: project,
            nextStep: tasks[project.nextStepTaskId],
          ),
      ],
    );
  }
}

class _ProjectTile extends ConsumerWidget {
  const _ProjectTile({required this.project, required this.nextStep});

  final Project project;
  final Task? nextStep;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final nextStep = this.nextStep;
    return ListTile(
      contentPadding: EdgeInsets.zero,
      title: Text(project.title),
      subtitle: Text(
        nextStep == null ? 'No next step' : 'Next: ${nextStep.title}',
      ),
      trailing: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          IconButton(
            tooltip: nextStep == null ? 'Set next step' : 'Change next step',
            icon: const Icon(Icons.flag_outlined),
            onPressed: () => nextStep == null
                ? showTaskDialog(
                    context,
                    projectId: project.id,
                    asNextStep: true,
                  )
                : showTaskDialog(
                    context,
                    projectId: project.id,
                    task: nextStep,
                  ),
          ),
          PopupMenuButton<ProjectStatus>(
            tooltip: 'Status of ${project.title}',
            onSelected: (status) => ref
                .read(projectRepositoryProvider)
                .setStatus(project.id, status),
            itemBuilder: (context) => [
              for (final status in ProjectStatus.values)
                if (status != project.status)
                  PopupMenuItem(
                    value: status,
                    child: Text(projectStatusLabel(status)),
                  ),
            ],
          ),
        ],
      ),
    );
  }
}

/// The KRs of active objectives; numeric and boolean ones can be updated.
class _KeyResultsStep extends ConsumerWidget {
  const _KeyResultsStep({required this.week});

  final CalendarDate week;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final items = ref.watch(weekSummaryProvider(week)).value?.keyResults;
    if (items == null) return const LinearProgressIndicator();
    if (items.isEmpty) return const Text('No key results.');
    return Column(
      children: [
        for (final item in items)
          _KeyResultInput(key: ValueKey(item.keyResult.id), item: item),
      ],
    );
  }
}

class _KeyResultInput extends ConsumerStatefulWidget {
  const _KeyResultInput({super.key, required this.item});

  final KrProgressChange item;

  @override
  ConsumerState<_KeyResultInput> createState() => _KeyResultInputState();
}

class _KeyResultInputState extends ConsumerState<_KeyResultInput> {
  late final _value = TextEditingController(
    text: formatNumber(widget.item.keyResult.currentValue ?? 0),
  );

  @override
  void dispose() {
    _value.dispose();
    super.dispose();
  }

  void _changed(String text) {
    final value = double.tryParse(text.trim().replaceAll(',', '.'));
    if (value != null) {
      ref
          .read(keyResultRepositoryProvider)
          .setProgressValue(widget.item.keyResult.id, value);
    }
  }

  @override
  Widget build(BuildContext context) {
    final kr = widget.item.keyResult;
    final percent = '${(widget.item.progress * 100).round()} %';
    return ListTile(
      contentPadding: EdgeInsets.zero,
      title: Text(kr.title),
      subtitle: Text(percent),
      trailing: switch (kr.measureType) {
        MeasureType.numeric => SizedBox(
          width: 120,
          child: TextField(
            controller: _value,
            decoration: InputDecoration(
              labelText: 'Current',
              suffixText: kr.unit,
            ),
            keyboardType: const TextInputType.numberWithOptions(decimal: true),
            onChanged: _changed,
          ),
        ),
        MeasureType.boolean => Switch(
          value: kr.currentValue == 1,
          onChanged: (achieved) => ref
              .read(keyResultRepositoryProvider)
              .setProgressValue(kr.id, achieved ? 1 : 0),
        ),
        MeasureType.habit => null,
      },
    );
  }
}
