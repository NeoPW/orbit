import 'package:flutter/material.dart';

/// A column whose children (each with a unique [Key]) fade and size in when
/// added and out when removed (visual-design spec, "Motion"). Without
/// animations (system setting) changes are immediate.
class AnimatedItems extends StatefulWidget {
  const AnimatedItems({
    super.key,
    required this.children,
    this.duration = const Duration(milliseconds: 250),
  });

  final List<Widget> children;
  final Duration duration;

  @override
  State<AnimatedItems> createState() => _AnimatedItemsState();
}

class _Entry {
  _Entry(this.child, this.controller);

  Widget child;
  final AnimationController controller;
  bool removing = false;

  Key get key => child.key!;
}

class _AnimatedItemsState extends State<AnimatedItems>
    with TickerProviderStateMixin {
  final _entries = <_Entry>[];

  Duration get _duration => MediaQuery.maybeDisableAnimationsOf(context) == true
      ? Duration.zero
      : widget.duration;

  _Entry _entry(Widget child, {required bool animateIn}) {
    assert(child.key != null, 'AnimatedItems children need keys');
    final controller = AnimationController(
      vsync: this,
      duration: widget.duration,
      value: animateIn ? 0 : 1,
    );
    return _Entry(child, controller);
  }

  @override
  void initState() {
    super.initState();
    for (final child in widget.children) {
      _entries.add(_entry(child, animateIn: false));
    }
  }

  @override
  void didUpdateWidget(AnimatedItems oldWidget) {
    super.didUpdateWidget(oldWidget);
    final duration = _duration;
    final byKey = {for (final e in _entries) e.key: e};
    final newKeys = {for (final c in widget.children) c.key};
    final next = <_Entry>[];
    for (final child in widget.children) {
      final existing = byKey[child.key];
      if (existing != null && !existing.removing) {
        existing.child = child;
        next.add(existing);
      } else {
        final entry = _entry(child, animateIn: true);
        entry.controller
          ..duration = duration
          ..forward();
        next.add(entry);
      }
    }
    // Removed children stay where they were while they animate out.
    for (final (index, entry) in _entries.indexed) {
      if (newKeys.contains(entry.key) && !entry.removing) continue;
      if (!entry.removing) {
        entry.removing = true;
        entry.controller
          ..duration = duration
          ..reverse().whenCompleteOrCancel(() {
            if (!mounted) return;
            setState(() => _entries.remove(entry));
            entry.controller.dispose();
          });
      }
      next.insert(index.clamp(0, next.length), entry);
    }
    _entries
      ..clear()
      ..addAll(next);
  }

  @override
  void dispose() {
    for (final entry in _entries) {
      entry.controller.dispose();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        for (final entry in _entries)
          KeyedSubtree(
            key: entry.key,
            child: SizeTransition(
              sizeFactor: CurvedAnimation(
                parent: entry.controller,
                curve: Curves.easeOutCubic,
              ),
              alignment: Alignment.topCenter,
              child: FadeTransition(
                opacity: entry.controller,
                child: entry.child,
              ),
            ),
          ),
      ],
    );
  }
}
