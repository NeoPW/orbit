import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'package:uuid/uuid.dart';

part 'ids.g.dart';

/// Returns a new record ID. Injected so tests get predictable IDs.
typedef IdGenerator = String Function();

const _uuid = Uuid();

/// Generates a random UUID v4.
String uuidV4() => _uuid.v4();

/// Namespace of Orbit's name-based IDs. Never change it: synced records
/// depend on it.
const orbitIdNamespace = '5b8f4c2e-9a71-4d0e-8f3a-6c2d1e7b9a40';

/// A UUID v5 derived from [key], e.g. `habit_check:<habitId>:<date>`. The
/// same key gives the same ID on every device, so records with a natural
/// key are not duplicated by sync.
String naturalKeyId(String key) => _uuid.v5(orbitIdNamespace, key);

@Riverpod(keepAlive: true)
IdGenerator idGenerator(Ref ref) => uuidV4;
