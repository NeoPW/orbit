import { describe, expect, it } from 'vitest';
import { addableExercises, moveDown, moveUp, remove, validateExercise, validateWorkout } from './workouts.ts';

describe('exercise validation', () => {
  it('requires a name', () => {
    expect(validateExercise('  ', [])).toEqual({ name: 'Enter a name' });
  });

  it('rejects a duplicate name ignoring case and spaces', () => {
    expect(validateExercise(' bench press ', ['Bench press'])).toEqual({ name: 'An exercise with this name exists' });
    expect(validateExercise('Squat', ['Bench press'])).toEqual({});
  });
});

describe('workout validation', () => {
  it('requires at least one exercise', () => {
    expect(validateWorkout('Push day', [])).toEqual({ exercises: 'Add at least one exercise' });
    expect(validateWorkout('Push day', ['a'])).toEqual({});
  });
});

describe('exercise list', () => {
  it('moves an exercise up', () => {
    expect(moveUp(['bench', 'ohp', 'dips'], 2)).toEqual(['bench', 'dips', 'ohp']);
    expect(moveUp(['bench', 'ohp'], 0)).toEqual(['bench', 'ohp']);
  });

  it('moves down and removes', () => {
    expect(moveDown(['a', 'b', 'c'], 0)).toEqual(['b', 'a', 'c']);
    expect(moveDown(['a', 'b'], 1)).toEqual(['a', 'b']);
    expect(remove(['a', 'b', 'c'], 1)).toEqual(['a', 'c']);
  });

  it('does not offer an exercise twice', () => {
    const all = [{ id: 'a' }, { id: 'b' }];
    expect(addableExercises(all, ['a'])).toEqual([{ id: 'b' }]);
  });
});
