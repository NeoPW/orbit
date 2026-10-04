import 'package:drift/drift.dart';
import 'package:drift_flutter/drift_flutter.dart';

/// Opens the app database: native SQLite on Android, sqlite3 WASM in a web
/// worker on the web (assets in `web/`, see README).
///
/// [onInMemoryFallback] is called on the web when the browser offers no
/// persistent storage and data will be lost when the page closes.
QueryExecutor openConnection({required void Function() onInMemoryFallback}) {
  return driftDatabase(
    name: 'orbit',
    web: DriftWebOptions(
      sqlite3Wasm: Uri.parse('sqlite3.wasm'),
      driftWorker: Uri.parse('drift_worker.js'),
      onResult: (result) {
        if (result.chosenImplementation == WasmStorageImplementation.inMemory) {
          onInMemoryFallback();
        }
      },
    ),
  );
}
