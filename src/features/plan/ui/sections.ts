/** What a Plan section can ask the screen to create (the "New" menu and empty states). */
export type PlanCreate = 'goal' | 'project' | 'task' | 'habit';

export interface PlanSectionProps {
  onCreate: (kind: PlanCreate) => void;
}
