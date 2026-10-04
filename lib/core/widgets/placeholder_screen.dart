import 'package:flutter/material.dart';

import 'empty_state.dart';

/// A destination whose content comes in a later milestone.
class PlaceholderScreen extends StatelessWidget {
  const PlaceholderScreen({
    super.key,
    required this.title,
    required this.icon,
    required this.milestone,
  });

  final String title;
  final IconData icon;
  final int milestone;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(title)),
      body: EmptyState(
        icon: icon,
        message: '$title comes in a later milestone (milestone $milestone).',
      ),
    );
  }
}
