import { SuggestionField, type Suggestion } from '../../../core/ui/components/SuggestionField.tsx';
import { matchProjects, matchTasks, parseQuickStart } from '../domain/quick-start.ts';

export interface QuickTaskOption {
  id: string;
  /** A habit is suggested with a "Habit" mark. */
  kind: 'task' | 'habit';
  title: string;
  projectTitle: string | null;
  projectColor: string | null;
}

export interface QuickProjectOption {
  id: string;
  title: string;
  color: string;
}

export interface QuickStartFieldProps {
  value: string;
  /** Typing clears a picked task. */
  onChange: (value: string) => void;
  tasks: QuickTaskOption[];
  projects: QuickProjectOption[];
  /** A suggested task was chosen. */
  onPickTask: (task: QuickTaskOption) => void;
  /** A suggested project was chosen (typed without `#`). */
  onPickProject: (project: QuickProjectOption) => void;
  /** Enter with no suggestion highlighted. */
  onSubmit: () => void;
  error?: string | null;
}

/**
 * A text field for "what are you working on": suggests open tasks, habits and then projects while typing,
 * and the active projects after a `#`.
 */
export function QuickStartField({ value, onChange, tasks, projects, onPickTask, onPickProject, onSubmit, error }: QuickStartFieldProps) {
  const parsed = parseQuickStart(value);
  const suggestions: Suggestion[] = parsed.hasHash
    ? (parsed.projectQuery === null ? projects.slice(0, 8) : matchProjects(parsed.projectQuery, projects)).map((p) => ({
        key: p.id,
        label: p.title,
        hint: null,
        color: p.color,
        choose: () => onChange(`${parsed.title ? `${parsed.title} ` : ''}# ${p.title}`),
      }))
    : [
        ...matchTasks(value, tasks).map((t) => ({
          key: t.id,
          label: t.title,
          hint: t.kind === 'habit' ? ['Habit', t.projectTitle].filter(Boolean).join(' · ') : t.projectTitle,
          color: t.projectColor,
          choose: () => onPickTask(t),
        })),
        ...matchProjects(value, projects, 4).map((p) => ({
          key: `project-${p.id}`,
          label: p.title,
          hint: 'Project',
          color: p.color,
          choose: () => onPickProject(p),
        })),
      ];
  return (
    <SuggestionField label="What are you working on?" value={value} onChange={onChange} suggestions={suggestions} onSubmit={onSubmit} error={error} />
  );
}
