export interface ExerciseErrors {
  name?: string;
}

export interface WorkoutErrors {
  name?: string;
  exercises?: string;
}

/** Names compare ignoring case and surrounding spaces. */
export function normalizeName(name: string): string {
  return name.trim().toLowerCase();
}

/** `otherNames` are the names of the other (not deleted) exercises. */
export function validateExercise(name: string, otherNames: string[]): ExerciseErrors {
  if (name.trim() === '') return { name: 'Enter a name' };
  const wanted = normalizeName(name);
  if (otherNames.some((other) => normalizeName(other) === wanted)) return { name: 'An exercise with this name exists' };
  return {};
}

export function validateWorkout(name: string, exerciseIds: string[]): WorkoutErrors {
  return {
    ...(name.trim() === '' ? { name: 'Enter a name' } : {}),
    ...(exerciseIds.length === 0 ? { exercises: 'Add at least one exercise' } : {}),
  };
}

/** Moves the item at `index` one place up; the list is returned unchanged at the top. */
export function moveUp<T>(list: T[], index: number): T[] {
  if (index <= 0 || index >= list.length) return list;
  const copy = [...list];
  [copy[index - 1], copy[index]] = [copy[index]!, copy[index - 1]!];
  return copy;
}

export function moveDown<T>(list: T[], index: number): T[] {
  return index < 0 || index >= list.length - 1 ? list : moveUp(list, index + 1);
}

export function remove<T>(list: T[], index: number): T[] {
  return list.filter((_, i) => i !== index);
}

/** The exercises that are not yet in the workout's list. */
export function addableExercises<T extends { id: string }>(all: T[], exerciseIds: string[]): T[] {
  const used = new Set(exerciseIds);
  return all.filter((exercise) => !used.has(exercise.id));
}
