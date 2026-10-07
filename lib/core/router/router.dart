import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../features/areas/ui/areas_screen.dart';
import '../../features/habits/ui/habits_screen.dart';
import '../../features/home/ui/home_screen.dart';
import '../../features/key_results/ui/key_result_screen.dart';
import '../../features/objectives/ui/objective_screen.dart';
import '../../features/plan/ui/archive_screen.dart';
import '../../features/plan/ui/plan_screen.dart';
import '../../features/projects/ui/project_detail_screen.dart';
import '../../features/review/ui/review_history_screen.dart';
import '../../features/review/ui/review_screen.dart';
import '../../features/review/ui/week_screen.dart';
import '../../features/review/ui/weekly_review_screen.dart';
import '../../features/settings/ui/settings_screen.dart';
import '../../features/tasks/ui/task_screen.dart';
import 'app_shell.dart';
import 'routes.dart';

/// Where an outdated path leads (plan-overview spec, "Old form URL"): `/`
/// to Home, and the former form URLs to the matching page. Null keeps the
/// path.
String? redirectOldPath(String path) {
  if (path == '/') return Routes.home;
  final segments = Uri(path: path).pathSegments;
  if (segments.length < 3 || segments.first != 'plan') return null;
  final [_, kind, id, ...rest] = segments;
  final isNew = id == 'new' || rest.isNotEmpty;
  return switch (kind) {
    'objectives' => isNew ? Routes.plan : Routes.objective(id),
    'key-results' => Routes.keyResult(id),
    'projects' => isNew ? Routes.plan : Routes.projectDetail(id),
    'habits' => Routes.habits,
    _ => null,
  };
}

/// Creates the app router. Destinations are, in order: Plan, Home, Review.
/// The app starts on Home; `/` and unknown paths go to Home as well.
GoRouter createRouter({String initialLocation = Routes.home}) {
  // Screens are opened with push (so back returns to where the user came
  // from); this keeps the browser URL in sync so a reload reopens them.
  GoRouter.optionURLReflectsImperativeAPIs = true;
  final rootKey = GlobalKey<NavigatorState>();

  return GoRouter(
    navigatorKey: rootKey,
    initialLocation: initialLocation,
    redirect: (context, state) => redirectOldPath(state.uri.path),
    onException: (context, state, router) => router.go(Routes.home),
    routes: [
      // On the root navigator like the forms, so it can be pushed from any
      // tab and its URL survives a reload.
      // Root level like project detail, so the review reminder can open it
      // from any tab. Listed before the shell so it wins over /review.
      // Root level so every tab opens it and back returns to that tab.
      GoRoute(
        path: Routes.settings,
        builder: (context, state) => const SettingsScreen(),
      ),
      GoRoute(
        path: Routes.weeklyReview,
        builder: (context, state) => const WeeklyReviewScreen(),
      ),
      GoRoute(
        path: '/tasks/:id',
        builder: (context, state) =>
            TaskScreen(taskId: state.pathParameters['id']!),
      ),
      GoRoute(
        path: '/projects/:id',
        builder: (context, state) =>
            ProjectDetailScreen(projectId: state.pathParameters['id']!),
      ),
      GoRoute(
        parentNavigatorKey: rootKey,
        path: '/objectives/:id',
        builder: (context, state) =>
            ObjectiveScreen(objectiveId: state.pathParameters['id']!),
      ),
      GoRoute(
        parentNavigatorKey: rootKey,
        path: '/key-results/:id',
        builder: (context, state) =>
            KeyResultScreen(keyResultId: state.pathParameters['id']!),
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
                routes: [
                  GoRoute(
                    path: 'week/:weekStart',
                    builder: (context, state) => WeekScreen(
                      weekStart: state.pathParameters['weekStart']!,
                    ),
                  ),
                  GoRoute(
                    path: 'history',
                    builder: (context, state) => const ReviewHistoryScreen(),
                    routes: [
                      GoRoute(
                        path: ':id',
                        builder: (context, state) => PastReviewScreen(
                          reviewId: state.pathParameters['id']!,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    ],
  );
}
