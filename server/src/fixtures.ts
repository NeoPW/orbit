import type { WireRow } from './push.ts';

/** Builds wire rows for tests (full column sets, as a device sends them). */
export function area(id: string, updatedAt: string, name = 'Job'): WireRow {
  return { id, created_at: '2026-11-05T09:00:00.000Z', updated_at: updatedAt, deleted_at: null, name, color: '#1E88E5', sort_order: 0 };
}

export function project(id: string, updatedAt: string, title = 'Project', extra: Partial<WireRow> = {}): WireRow {
  return {
    id,
    created_at: '2026-11-05T09:00:00.000Z',
    updated_at: updatedAt,
    deleted_at: null,
    title,
    description: '',
    area_id: null,
    goal_id: null,
    status: 'active',
    importance: 3,
    deadline: null,
    completed_at: null,
    ...extra,
  };
}

export function task(id: string, updatedAt: string, projectId: string | null = null, extra: Partial<WireRow> = {}): WireRow {
  return {
    id,
    created_at: '2026-11-05T09:00:00.000Z',
    updated_at: updatedAt,
    deleted_at: null,
    project_id: projectId,
    goal_id: null,
    title: 'Task',
    notes: '',
    due_date: null,
    importance: null,
    is_next_step: 0,
    status: 'open',
    completed_at: null,
    ...extra,
  };
}

export const T10_00 = '2026-11-05T10:00:00.000Z';
export const T10_05 = '2026-11-05T10:05:00.000Z';
