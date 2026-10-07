import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/db/app_database.dart';
import '../../../core/numbers.dart';
import '../../../core/router/routes.dart';
import '../../../core/widgets/max_width_body.dart';
import '../../../core/widgets/orbit_ring.dart';
import '../../../core/widgets/section_heading.dart';
import '../../key_results/data/key_result_repository.dart';
import '../../projects/data/project_repository.dart';
import '../../projects/ui/project_labels.dart';
import '../../tasks/data/task_repository.dart';
import '../../tasks/ui/task_form.dart';
import '../data/review_providers.dart';
import '../data/review_repository.dart';
import '../domain/week_summary.dart';
import 'week_format.dart';
import 'week_summary_view.dart';

/// The guided weekly review of the review week (weekly-review spec): look
/// back, projects, key results, score, plan, save, one full-screen page
/// each with a progress bar and Back / Next. Score, reflection and plan are
/// kept as a draft when changing pages and when leaving.
class WeeklyReviewScreen extends ConsumerStatefulWidget {
  const WeeklyReviewScreen({super.key});

  @override
  ConsumerState<WeeklyReviewScreen> createState() => _WeeklyReviewState();
}

/// The review's steps, in order.
const stepNames = [
  'Look back',
  'Projects',
  'Key results',
  'Score',
  'Plan',
  'Save',
];

class _WeeklyReviewState extends ConsumerState<WeeklyReviewScreen> {
  static const _scoreStep = 3;
  static const _lastStep = 5;

  late final CalendarDate _week = ref.read(reviewWeekProvider);
  late final ReviewRepository _reviews = ref.read(reviewRepositoryProvider);
  final _reflection = TextEditingController();
  final _plan = TextEditingController();
  final _pages = PageController();
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
    _pages.dispose();
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
    if (!mounted) return;
    setState(() => _step = step);
    if (!_pages.hasClients) return;
    if (MediaQuery.disableAnimationsOf(context)) {
      _pages.jumpToPage(step);
    } else {
      await _pages.animateToPage(
        step,
        duration: const Duration(milliseconds: 250),
        curve: Curves.easeOutCubic,
      );
    }
  }

  Future<void> _save() async {
    final score = _score;
    if (score == null) {
      setState(() => _scoreError = 'Choose a score to save the review');
      await _goTo(_scoreStep);
      return;
    }
    final keyResults = ref.read(currentKrProgressProvider(_week)).value;
    if (keyResults == null) return;
    await _reviews.complete(
      _week,
      score: score,
      reflection: _reflection.text,
      plan: _plan.text,
      snapshots: {for (final kr in keyResults) kr.keyResult.id: kr.progress},
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
    ref.watch(currentKrProgressProvider(_week));
    final theme = Theme.of(context);
    final pages = [
      WeekSummaryView(weekStart: _week),
      const _ProjectsStep(),
      _KeyResultsStep(week: _week),
      _scoreContent(),
      _planContent(),
      _saveContent(),
    ];
    return PopScope(
      onPopInvokedWithResult: (didPop, _) {
        if (didPop) _saveDraft();
      },
      child: Scaffold(
        appBar: AppBar(title: Text('Review ${formatWeek(_week)}')),
        body: !_loaded
            ? const Center(child: CircularProgressIndicator())
            : Column(
                children: [
                  MaxWidthBody(
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(16, 4, 16, 8),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Step ${_step + 1} of ${stepNames.length} · '
                            '${stepNames[_step]}',
                            style: theme.textTheme.labelLarge?.copyWith(
                              color: theme.colorScheme.primary,
                            ),
                          ),
                          const SizedBox(height: 8),
                          LinearProgressIndicator(
                            value: (_step + 1) / stepNames.length,
                            minHeight: 6,
                            borderRadius: BorderRadius.circular(3),
                          ),
                        ],
                      ),
                    ),
                  ),
                  Expanded(
                    child: PageView(
                      controller: _pages,
                      physics: const NeverScrollableScrollPhysics(),
                      children: [
                        for (final page in pages)
                          MaxWidthBody(
                            child: ListView(
                              padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
                              children: [page],
                            ),
                          ),
                      ],
                    ),
                  ),
                ],
              ),
        bottomNavigationBar: !_loaded
            ? null
            : SafeArea(
                child: Align(
                  heightFactor: 1,
                  child: ConstrainedBox(
                    constraints: const BoxConstraints(maxWidth: 840),
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
                      child: Row(
                        children: [
                          TextButton.icon(
                            onPressed: _step == 0
                                ? null
                                : () => _goTo(_step - 1),
                            icon: const Icon(Icons.arrow_back),
                            label: const Text('Back'),
                          ),
                          const Spacer(),
                          if (_step == _lastStep)
                            FilledButton.icon(
                              onPressed: _save,
                              icon: const Icon(Icons.check),
                              label: const Text('Save'),
                            )
                          else
                            FilledButton.icon(
                              onPressed: () => _goTo(_step + 1),
                              icon: const Icon(Icons.arrow_forward),
                              iconAlignment: IconAlignment.end,
                              label: const Text('Next'),
                            ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
      ),
    );
  }

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
    if (projects.isEmpty) {
      return const SectionEmptyText(
        'No active projects',
        icon: Icons.folder_outlined,
      );
    }
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
    final colors = Theme.of(context).colorScheme;
    return ListTile(
      contentPadding: EdgeInsets.zero,
      title: Text(project.title),
      subtitle: Row(
        children: [
          Icon(
            nextStep == null ? Icons.flag_outlined : Icons.flag,
            size: 14,
            color: nextStep == null ? colors.outline : colors.primary,
          ),
          const SizedBox(width: 4),
          Flexible(
            child: Text(
              nextStep == null ? 'No next step' : nextStep.title,
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
      trailing: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          IconButton(
            tooltip: nextStep == null ? 'Set next step' : 'Change next step',
            icon: const Icon(Icons.flag_outlined),
            onPressed: () => nextStep == null
                ? showTaskForm(context, projectId: project.id, asNextStep: true)
                : showTaskForm(context, projectId: project.id, task: nextStep),
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
    final items = ref.watch(currentKrProgressProvider(week)).value;
    if (items == null) return const LinearProgressIndicator();
    if (items.isEmpty) {
      return const SectionEmptyText(
        'No key results',
        icon: Icons.track_changes,
      );
    }
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
    final percent = '${(widget.item.progress * 100).round()}%';
    return ListTile(
      contentPadding: EdgeInsets.zero,
      leading: OrbitRing(
        progress: widget.item.progress,
        size: 44,
        label: percent,
      ),
      title: Text(kr.title),
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
