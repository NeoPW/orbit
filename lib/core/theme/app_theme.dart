import 'package:flutter/material.dart';

const _seed = Color(0xFF3F51B5);

final lightTheme = ThemeData(
  colorScheme: ColorScheme.fromSeed(seedColor: _seed),
);

final darkTheme = ThemeData(
  colorScheme: ColorScheme.fromSeed(
    seedColor: _seed,
    brightness: Brightness.dark,
  ),
);
