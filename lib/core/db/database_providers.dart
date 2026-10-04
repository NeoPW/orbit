import 'package:riverpod_annotation/riverpod_annotation.dart';

import 'app_database.dart';
import 'connection.dart';

part 'database_providers.g.dart';

/// Whether the database runs in memory because the browser offers no
/// persistent storage. The shell shows a warning banner while true.
@Riverpod(keepAlive: true)
class StorageWarning extends _$StorageWarning {
  @override
  bool build() => false;

  void show() => state = true;
}

/// The app database. Tests override this with an in-memory database.
@Riverpod(keepAlive: true)
AppDatabase appDatabase(Ref ref) {
  final db = AppDatabase(
    openConnection(
      onInMemoryFallback: () =>
          ref.read(storageWarningProvider.notifier).show(),
    ),
  );
  ref.onDispose(db.close);
  return db;
}
