import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'messenger.g.dart';

/// How long a message stays (visual-design spec, "Messages at the top").
const messageDuration = Duration(seconds: 3);

/// A short confirmation with an optional action such as Undo or Open.
class Message {
  Message(this.text, {this.icon = Icons.check_circle_outline, this.action})
    : id = _nextId++;

  static int _nextId = 0;

  /// Distinguishes two messages with the same text.
  final int id;
  final String text;
  final IconData icon;
  final MessageAction? action;
}

class MessageAction {
  const MessageAction(this.label, this.onPressed);

  final String label;
  final VoidCallback onPressed;
}

/// The message shown at the top of the app, if any. A new message replaces
/// the current one; each disappears after [messageDuration].
@Riverpod(keepAlive: true)
class Messenger extends _$Messenger {
  Timer? _timer;

  @override
  Message? build() {
    ref.onDispose(() => _timer?.cancel());
    return null;
  }

  void show(Message message) {
    _timer?.cancel();
    state = message;
    _timer = Timer(messageDuration, () {
      if (state?.id == message.id) state = null;
    });
  }

  void dismiss() {
    _timer?.cancel();
    state = null;
  }
}

/// Shows [text] at the top of the app (see [Messenger]).
void showMessage(
  WidgetRef ref,
  String text, {
  IconData icon = Icons.check_circle_outline,
  MessageAction? action,
}) => ref
    .read(messengerProvider.notifier)
    .show(Message(text, icon: icon, action: action));
