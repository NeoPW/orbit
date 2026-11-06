// Colour slots: a colour is stored as a slot key ('pc0'..'pc7') and shown as `var(--pcN)`,
// so switching the theme recolours everything without rewriting data.

export const SLOTS = ['pc0', 'pc1', 'pc2', 'pc3', 'pc4', 'pc5', 'pc6', 'pc7'] as const;

export type Slot = (typeof SLOTS)[number];

/** True for a slot key. */
export function isSlot(value: unknown): value is Slot {
  return typeof value === 'string' && (SLOTS as readonly string[]).includes(value);
}

/** The CSS colour of a slot: `var(--pc3)`. */
export function slotColor(key: Slot): string {
  return `var(--${key})`;
}

/** The least used slot among `used` (other values are ignored); the first in palette order on a tie. */
export function pickSlot(used: readonly (string | null | undefined)[]): Slot {
  const counts = new Map<Slot, number>(SLOTS.map((slot) => [slot, 0]));
  for (const value of used) if (isSlot(value)) counts.set(value, (counts.get(value) ?? 0) + 1);
  let best: Slot = SLOTS[0];
  for (const slot of SLOTS) if ((counts.get(slot) ?? 0) < (counts.get(best) ?? 0)) best = slot;
  return best;
}

/** FNV-1a (32 bit) of a string. */
function fnv1a(text: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash;
}

/** The slot key of a project: the stored one, else one derived from its id (the same on every device). */
export function projectSlot(project: { id: string; color: string | null }): Slot {
  return isSlot(project.color) ? project.color : (SLOTS[fnv1a(project.id) % SLOTS.length] as Slot);
}

/** The CSS colour of a project. */
export function projectColor(project: { id: string; color: string | null }): string {
  return slotColor(projectSlot(project));
}

/** The goal's own colour (slot as CSS, a legacy value as it is), else the slot for its position (0-based). */
export function goalColor(goal: { color: string | null }, indexInOrder: number): string {
  if (isSlot(goal.color)) return slotColor(goal.color);
  if (goal.color) return goal.color;
  const n = SLOTS.length;
  return slotColor(SLOTS[((indexInOrder % n) + n) % n] as Slot);
}

/** A stored colour (slot key or legacy value) as CSS, for a colour picker's current value. */
export function colorToCss(stored: string | null): string | null {
  return isSlot(stored) ? slotColor(stored) : stored;
}

/** A picked CSS colour back to what is stored: the slot key for a slot colour, other values as they are. */
export function cssToStored(css: string | null): string | null {
  return SLOTS.find((slot) => slotColor(slot) === css) ?? css;
}

/** Accessible name of a slot colour ("Colour 1".."Colour 8"); other values as they are. */
export function colorLabel(css: string): string {
  const slot = SLOTS.find((s) => slotColor(s) === css);
  return slot ? `Colour ${SLOTS.indexOf(slot) + 1}` : css;
}
