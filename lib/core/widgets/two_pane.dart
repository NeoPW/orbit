import 'package:flutter/material.dart';

/// List and detail side by side from [breakpoint] on (visual-design spec,
/// "Two panes on wide screens"); below it only the list is shown.
class TwoPane extends StatelessWidget {
  const TwoPane({
    super.key,
    required this.list,
    required this.detail,
    this.placeholder,
    this.listWidth = defaultListWidth,
  });

  static const breakpoint = 1000.0;
  static const defaultListWidth = 560.0;

  /// Whether a window of this context shows two panes.
  static bool isWide(BuildContext context) =>
      MediaQuery.sizeOf(context).width >= breakpoint;

  final Widget list;

  /// The selected item, or null.
  final Widget? detail;

  /// Shown on the right while nothing is selected.
  final Widget? placeholder;
  final double listWidth;

  @override
  Widget build(BuildContext context) {
    if (!isWide(context)) return list;
    return Row(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        SizedBox(width: listWidth, child: list),
        const VerticalDivider(width: 1),
        Expanded(child: detail ?? placeholder ?? const SizedBox()),
      ],
    );
  }
}
