import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../features/areas/ui/areas_screen.dart';
import '../../features/habits/ui/habit_form_screen.dart';
import '../../features/habits/ui/habits_screen.dart';
import '../../features/home/ui/home_screen.dart';
import '../../features/key_results/ui/key_result_form_screen.dart';
import '../../features/objectives/ui/objective_form_screen.dart';
import '../../features/plan/ui/archive_screen.dart';
import '../../features/plan/ui/plan_screen.dart';
import '../../features/projects/ui/project_detail_screen.dart';
import '../../features/projects/ui/project_form_screen.dart';
import '../../features/review/ui/review_screen.dart';
import 'app_shell.dart';
import 'routes.dart';

/// Creates the app router. Destinations are, in order: Plan, Home, Review.
/// The app starts on Home; `/` and unknown paths go to Home as well.
GoRouter createRouter({String initialLocation = Routes.home}) {
  // Screens are opened with push (so back returns to where the user came
  // from); this keeps the browser URL in sync so a reload reopens them.
  GoRouter.optionURLReflectsImperativeAPIs = true;
  final rootKey = GlobalKey<NavigatorState>();

  /// Forms cover the navigation bar and rail.
  GoRoute form(String path, Widget Function(GoRouterState) build) => GoRoute(
    path: path,
    parentNavigatorKey: rootKey,
    builder: (context, state) => build(state),
  );

  return GoRouter(
    navigatorKey: rootKey,
    initialLocation: initialLocation,
    redirect: (context, state) => state.uri.path == '/' ? Routes.home : null,
    onException: (context, state, router) => router.go(Routes.home),
    routes: [
      // On the root navigator like the forms, so it can be pushed from any
      // tab and its URL survives a reload.
      GoRoute(
        path: '/projects/:id',
        builder: (context, state) =>
            ProjectDetailScreen(projectId: state.pathParameters['id']!),
      ),
      StatefulShellRoute.indexedStack(
        builder: (context, state, shell) => AppShell(shell: shell),
        branches: [
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: Routes.plan,
                builder: (context, state) => const PlanScreen(),
                routes: [
                  GoRoute(
                    path: 'archive',
                    builder: (context, state) => const ArchiveScreen(),
                  ),
                  GoRoute(
                    path: 'areas',
                    builder: (context, state) => const AreasScreen(),
                  ),
                  GoRoute(
                    path: 'habits',
                    builder: (context, state) => const HabitsScreen(),
                    routes: [
                      form('new', (_) => const HabitFormScreen()),
                      form(
                        ':id',
                        (s) => HabitFormScreen(habitId: s.pathParameters['id']),
                      ),
                    ],
                  ),
                  form('objectives/new', (_) => const ObjectiveFormScreen()),
                  form(
                    'objectives/:id',
                    (s) => ObjectiveFormScreen(
                      objectiveId: s.pathParameters['id'],
                    ),
                  ),
                  form(
                    'objectives/:id/key-results/new',
                    (s) => KeyResultFormScreen(
                      objectiveId: s.pathParameters['id'],
                    ),
                  ),
                  form(
                    'key-results/:id',
                    (s) => KeyResultFormScreen(
                      keyResultId: s.pathParameters['id'],
                    ),
                  ),
                  form('projects/new', (_) => const ProjectFormScreen()),
                  form(
                    'projects/:id',
                    (s) => ProjectFormScreen(projectId: s.pathParameters['id']),
                  ),
                ],
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: Routes.home,
                builder: (context, state) => const HomeScreen(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: Routes.review,
                builder: (context, state) => const ReviewScreen(),
              ),
            ],
          ),
        ],
      ),
    ],
  );
}
