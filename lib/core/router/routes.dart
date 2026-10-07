import '../time/calendar_date.dart';

/// URL paths of the app. Forms open in sheets and have no URL.
abstract final class Routes {
  static const home = '/home';
  static const plan = '/plan';
  static const review = '/review';
  static const weeklyReview = '/review/weekly';
  static const reviewHistory = '/review/history';
  static String pastReview(String id) => '/review/history/$id';

  /// The summary of the week starting [weekStart] (e.g. "Last week").
  static String reviewWeekPage(CalendarDate weekStart) =>
      '/review/week/${weekStart.toIso()}';

  static const archive = '/plan/archive';
  static const areas = '/plan/areas';
  static const habits = '/plan/habits';
  static const settings = '/settings';

  /// Objective page, reachable from Plan, the Archive and task pages.
  static String objective(String id) => '/objectives/$id';

  /// Key result page, reachable from Plan, reminders and other pages.
  static String keyResult(String id) => '/key-results/$id';

  /// Task page, reachable from every tab and from reminders.
  static String task(String id) => '/tasks/$id';

  /// Project detail, reachable from Home and Plan.
  static String projectDetail(String id) => '/projects/$id';
}
