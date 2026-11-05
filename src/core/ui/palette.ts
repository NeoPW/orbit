// Accent colors with at least 3:1 contrast against every surface in theme.css.

/** Choices for an area's color. */
export const AREA_COLORS = [
  '#60A5FA', // blue
  '#C084FC', // purple
  '#4ADE80', // green
  '#FB923C', // orange
  '#F472B6', // pink
  '#2DD4BF', // teal
  '#FACC15', // yellow
  '#F87171', // red
] as const;

/** Choices for a goal's color, also used in turn for goals without an own color ("Auto"). */
export const GOAL_COLORS = [
  '#FB7185', // rose
  '#FBBF24', // amber
  '#A3E635', // lime
  '#34D399', // emerald
  '#22D3EE', // cyan
  '#38BDF8', // sky
  '#A78BFA', // violet
  '#E879F9', // fuchsia
] as const;

/** The goal's own color, or the palette color for its position in the list (0-based) when it has none. */
export function goalColor(goal: { color: string | null }, indexInOrder: number): string {
  if (goal.color) return goal.color;
  const n = GOAL_COLORS.length;
  return GOAL_COLORS[((indexInOrder % n) + n) % n] as string;
}
