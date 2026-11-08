import { useEffect, useId, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';
import { useOutsidePress, usePopoverPlacement } from '../../../core/ui/components/popover.ts';
import selectStyles from '../../../core/ui/components/Select.module.css';
import fieldStyles from '../../../core/ui/components/TextField.module.css';
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

interface Suggestion {
  key: string;
  label: string;
  hint: string | null;
  color: string | null;
  choose: () => void;
}

/**
 * A text field for "what are you working on": suggests open tasks, habits and then projects while typing,
 * and the active projects after a `#`. The popup is placed like the `Select` popup.
 */
export function QuickStartField({ value, onChange, tasks, projects, onPickTask, onPickProject, onSubmit, error }: QuickStartFieldProps) {
  const id = useId();
  const listId = `${id}-list`;
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const anchor = useRef<HTMLDivElement>(null);
  const popup = useRef<HTMLDivElement>(null);

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
  const shown = open && suggestions.length > 0;

  usePopoverPlacement(shown, anchor, popup);
  useOutsidePress(shown, [anchor, popup], () => setOpen(false));

  // The popup is at least as wide as the field.
  useEffect(() => {
    if (shown && popup.current && anchor.current) popup.current.style.minWidth = `${anchor.current.offsetWidth}px`;
  }, [shown]);

  function pick(index: number) {
    suggestions[index]?.choose();
    setOpen(false);
    setActive(-1);
  }

  function onKeyDown(event: KeyboardEvent) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      if (suggestions.length === 0) return;
      event.preventDefault();
      setOpen(true);
      const n = suggestions.length;
      setActive(event.key === 'ArrowDown' ? (active + 1) % n : (active - 1 + n) % n);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (shown && active >= 0) pick(active);
      else onSubmit();
    } else if (event.key === 'Tab' && !event.shiftKey && shown) {
      // Complete with the highlighted (else the first) suggestion; focus stays in the field.
      event.preventDefault();
      pick(active >= 0 ? active : 0);
    } else if (event.key === 'Escape' && shown) {
      // Stop the Escape reaching a Sheet around the field.
      event.preventDefault();
      event.stopPropagation();
      setOpen(false);
    }
  }

  return (
    <div className={fieldStyles.field}>
      <label htmlFor={id} className={fieldStyles.label}>
        What are you working on?
      </label>
      <div ref={anchor} className={selectStyles.anchor}>
        <input
          id={id}
          type="text"
          role="combobox"
          autoComplete="off"
          className={fieldStyles.control}
          value={value}
          aria-autocomplete="list"
          aria-expanded={shown}
          aria-controls={shown ? listId : undefined}
          aria-activedescendant={shown && active >= 0 ? `${listId}-${active}` : undefined}
          aria-invalid={error ? true : undefined}
          onChange={(event) => {
            onChange(event.target.value);
            setOpen(true);
            setActive(-1);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
        />
        {shown && (
          <div ref={popup} id={listId} role="listbox" aria-label="Suggestions" className={selectStyles.popup}>
            {suggestions.map((s, index) => (
              <div
                key={s.key}
                id={`${listId}-${index}`}
                role="option"
                aria-selected={index === active}
                data-active={index === active}
                className={selectStyles.option}
                // Keep focus in the input.
                onMouseDown={(event) => event.preventDefault()}
                onMouseMove={() => setActive(index)}
                onClick={() => pick(index)}
              >
                {s.color && <span className={selectStyles.dot} style={{ '--dot': s.color } as CSSProperties} aria-hidden="true" />}
                <span className={selectStyles.optionLabel}>{s.label}</span>
                {s.hint && <span className={selectStyles.hint}>{s.hint}</span>}
              </div>
            ))}
          </div>
        )}
      </div>
      {error && <p className={fieldStyles.error}>{error}</p>}
    </div>
  );
}
