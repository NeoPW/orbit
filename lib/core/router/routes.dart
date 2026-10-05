/// URL paths of the app. Forms use `new` for creating and the record ID
/// for editing.
abstract final class Routes {
  static const home = '/home';
  static const plan = '/plan';
  static const review = '/review';

  static const archive = '/plan/archive';
  static const areas = '/plan/areas';
  static const habits = '/plan/habits';
  static const settings = '/plan/settings';

  static const newObjective = '/plan/objectives/new';
  static String objective(String id) => '/plan/objectives/$id';
  static String newKeyResult(String objectiveId) =>
      '/plan/objectives/$objectiveId/key-results/new';
  static String keyResult(String id) => '/plan/key-results/$id';
  static const newProject = '/plan/projects/new';
  static String project(String id) => '/plan/projects/$id';
  static const newHabit = '/plan/habits/new';
  static String habit(String id) => '/plan/habits/$id';

  /// Project detail, reachable from Home and Plan.
  static String projectDetail(String id) => '/projects/$id';
}
