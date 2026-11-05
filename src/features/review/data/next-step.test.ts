import { describe, expect, it } from 'vitest';
import { openTestDatabase } from '../../../core/db/testing.ts';
import { createProject } from '../../projects/data/projects-repository.ts';
import { listOpenNextSteps, listOpenTasksOfProject } from '../../tasks/data/tasks-repository.ts';
import { addNextStep } from './next-step.ts';

const clock = () => new Date('2026-10-11T18:00:00Z');

describe('addNextStep', () => {
  it('adds an open task of the project as next step', async () => {
    const { db } = await openTestDatabase();
    const projectId = await createProject(db, clock, { title: 'Garden', description: '', areaId: null, goalId: null, importance: 3, deadline: null, status: 'active' });
    await addNextStep(db, clock, projectId, 'Order seeds');
    expect((await listOpenTasksOfProject(db, projectId)).map((t) => t.title)).toEqual(['Order seeds']);
    expect((await listOpenNextSteps(db, projectId)).map((t) => t.title)).toEqual(['Order seeds']);
  });
});
