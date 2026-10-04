import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'package:uuid/uuid.dart';

part 'ids.g.dart';

/// Returns a new record ID. Injected so tests get predictable IDs.
typedef IdGenerator = String Function();

const _uuid = Uuid();

/// Generates a random UUID v4.
String uuidV4() => _uuid.v4();

@Riverpod(keepAlive: true)
IdGenerator idGenerator(Ref ref) => uuidV4;
