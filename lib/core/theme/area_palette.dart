/// The fixed colors an area can have, stored as `#RRGGBB`.
const areaPalette = <String>[
  '#1E88E5', // blue
  '#8E24AA', // purple
  '#43A047', // green
  '#FB8C00', // orange
  '#E53935', // red
  '#D81B60', // pink
  '#00897B', // teal
  '#00ACC1', // cyan
  '#5E35B1', // deep purple
  '#FDD835', // yellow
  '#6D4C41', // brown
  '#546E7A', // blue grey
];

/// Areas created on first launch, in order.
const defaultAreas = <({String name, String color})>[
  (name: 'Job', color: '#1E88E5'),
  (name: 'Personal', color: '#8E24AA'),
  (name: 'Sport', color: '#43A047'),
  (name: 'Uni', color: '#FB8C00'),
];
