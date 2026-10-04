import '../../../core/db/app_database.dart';

String projectStatusLabel(ProjectStatus status) => switch (status) {
  ProjectStatus.active => 'Active',
  ProjectStatus.backlog => 'Backlog',
  ProjectStatus.paused => 'Paused',
  ProjectStatus.completed => 'Completed',
};
