import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:orbit/core/db/app_database.dart';
import 'package:orbit/core/db/database_providers.dart';

/// A container whose providers use [db].
ProviderContainer containerWith(AppDatabase db) {
  final container = ProviderContainer(
    overrides: [appDatabaseProvider.overrideWithValue(db)],
  );
  return container;
}
