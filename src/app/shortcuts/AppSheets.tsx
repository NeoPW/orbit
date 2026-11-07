import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { listAreas } from '../../features/areas/data/areas-repository.ts';
import { AreaSheet } from '../../features/areas/ui/AreaSheet.tsx';
import { useLiveQuery } from '../../core/db/live.ts';
import { GoalSheet } from '../../features/goals/ui/GoalSheet.tsx';
import { HabitSheet } from '../../features/habits/ui/HabitSheet.tsx';
import { ProjectSheet } from '../../features/projects/ui/ProjectSheet.tsx';
import { TaskSheet } from '../../features/tasks/ui/TaskSheet.tsx';
import { LogWorkSheet } from '../../features/work-log/ui/LogWorkSheet.tsx';

export type AppSheetKind = 'task' | 'log' | 'project' | 'goal' | 'habit' | 'area';

const AppSheetsContext = createContext<((kind: AppSheetKind) => void) | null>(null);

/** Opens a create sheet (or Log work) over whatever screen is shown, for shortcuts and the command palette. */
export function useOpenAppSheet(): (kind: AppSheetKind) => void {
  const open = useContext(AppSheetsContext);
  if (!open) throw new Error('useOpenAppSheet() needs an AppSheets provider');
  return open;
}

/** Holds the one sheet opened from a shortcut or the palette and renders it next to the screen. */
export function AppSheets({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState<AppSheetKind | null>(null);
  const openSheet = useCallback((kind: AppSheetKind) => setOpen(kind), []);
  const close = useMemo(() => () => setOpen(null), []);
  return (
    <AppSheetsContext.Provider value={openSheet}>
      {children}
      {open === 'task' && <TaskSheet onClose={close} />}
      {open === 'log' && <LogWorkSheet onClose={close} />}
      {open === 'project' && <ProjectSheet onClose={close} />}
      {open === 'goal' && <GoalSheet onClose={close} />}
      {open === 'habit' && <HabitSheet onClose={close} />}
      {open === 'area' && <NewAreaSheet onClose={close} />}
    </AppSheetsContext.Provider>
  );
}

/** A new area starts with the next palette colour, so it needs the number of areas. */
function NewAreaSheet({ onClose }: { onClose: () => void }) {
  const areas = useLiveQuery(listAreas);
  if (areas === undefined) return null;
  return <AreaSheet count={areas.length} onClose={onClose} />;
}
