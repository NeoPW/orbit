import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/router/routes.dart';
import '../../../core/widgets/two_pane.dart';
import '../data/plan_providers.dart';

/// Opens [item] from the Plan tab: in the detail pane on wide screens, as
/// its own page otherwise.
void openPlanItem(BuildContext context, WidgetRef ref, PlanItem item) {
  if (TwoPane.isWide(context)) {
    ref.read(planSelectionProvider.notifier).select(item);
    return;
  }
  context.push(switch (item) {
    PlanProject(:final id) => Routes.projectDetail(id),
    PlanTask(:final id) => Routes.task(id),
    PlanObjective(:final id) => Routes.objective(id),
    PlanKeyResult(:final id) => Routes.keyResult(id),
  });
}
