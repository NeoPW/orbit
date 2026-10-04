import 'package:flutter/material.dart';

import '../../../core/widgets/placeholder_screen.dart';

class ReviewScreen extends StatelessWidget {
  const ReviewScreen({super.key});

  @override
  Widget build(BuildContext context) => const PlaceholderScreen(
    title: 'Review',
    icon: Icons.insights_outlined,
    milestone: 4,
  );
}
