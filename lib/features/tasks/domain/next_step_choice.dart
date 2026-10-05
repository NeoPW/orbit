/// What becomes a project's next step after the current one is done
/// (tasks spec, "Next-step prompt").
sealed class NextStepChoice {
  const NextStepChoice();
}

/// A new open task with [title] becomes the next step.
class NewNextStep extends NextStepChoice {
  const NewNextStep(this.title);

  final String title;

  @override
  bool operator ==(Object other) =>
      other is NewNextStep && other.title == title;

  @override
  int get hashCode => title.hashCode;
}

/// The existing open task [taskId] becomes the next step.
class ExistingNextStep extends NextStepChoice {
  const ExistingNextStep(this.taskId);

  final String taskId;

  @override
  bool operator ==(Object other) =>
      other is ExistingNextStep && other.taskId == taskId;

  @override
  int get hashCode => taskId.hashCode;
}

/// The project has no next step afterwards.
class NoNextStep extends NextStepChoice {
  const NoNextStep();

  @override
  bool operator ==(Object other) => other is NoNextStep;

  @override
  int get hashCode => 0;
}
