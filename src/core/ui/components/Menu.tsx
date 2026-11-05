import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { useOutsidePress, usePopoverPlacement } from './popover.ts';
import styles from './Menu.module.css';

export interface MenuItem {
  label: string;
  icon?: ReactNode;
  onSelect: () => void;
  danger?: boolean;
  /** Marks the current choice, for example the current status. */
  checked?: boolean;
  disabled?: boolean;
}

/** What `Menu` hands to its trigger: spread these on the button (or pass them to a Chip). */
export interface MenuTriggerProps {
  onClick: () => void;
  'aria-haspopup': 'menu';
  'aria-expanded': boolean;
}

export interface MenuProps {
  /** Renders the button that opens the menu. */
  trigger: (props: MenuTriggerProps) => ReactNode;
  items: MenuItem[];
  /** Accessible name of the menu. */
  label: string;
}

/**
 * A small menu next to its button. Arrow keys move, Enter chooses, Escape
 * closes and returns focus to the button, a click outside closes it.
 */
export function Menu({ trigger, items, label }: MenuProps) {
  const [open, setOpen] = useState(false);
  const anchor = useRef<HTMLSpanElement>(null);
  const popup = useRef<HTMLDivElement>(null);
  const id = useId();

  usePopoverPlacement(open, anchor, popup);
  useOutsidePress(open, [anchor, popup], () => setOpen(false));

  function buttons(): HTMLButtonElement[] {
    return Array.from(popup.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)') ?? []);
  }

  function close(returnFocus: boolean) {
    setOpen(false);
    if (returnFocus) anchor.current?.querySelector<HTMLElement>('button')?.focus();
  }

  // Opening moves focus into the menu.
  useEffect(() => {
    if (open) popup.current?.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus();
  }, [open]);

  function onKeyDown(event: KeyboardEvent) {
    const list = buttons();
    const at = list.indexOf(document.activeElement as HTMLButtonElement);
    if (event.key === 'Escape') {
      // Stop the Escape reaching a Sheet around the button.
      event.preventDefault();
      event.stopPropagation();
      close(true);
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      list[(at + 1) % list.length]?.focus();
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      list[(at - 1 + list.length) % list.length]?.focus();
    } else if (event.key === 'Home') {
      event.preventDefault();
      list[0]?.focus();
    } else if (event.key === 'End') {
      event.preventDefault();
      list[list.length - 1]?.focus();
    } else if (event.key === 'Tab') {
      setOpen(false);
    }
  }

  return (
    <span ref={anchor} className={styles.anchor}>
      {trigger({
        onClick: () => setOpen(!open),
        'aria-haspopup': 'menu',
        'aria-expanded': open,
      })}
      {open && (
        <div ref={popup} id={id} role="menu" aria-label={label} className={styles.menu} onKeyDown={onKeyDown}>
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              disabled={item.disabled}
              className={`${styles.item} ${item.danger ? styles.danger : ''}`}
              onClick={() => {
                close(true);
                item.onSelect();
              }}
            >
              {item.icon}
              <span className={styles.itemLabel}>{item.label}</span>
              {item.checked && <span className="visually-hidden">(current)</span>}
              {item.checked && <span aria-hidden="true">✓</span>}
            </button>
          ))}
        </div>
      )}
    </span>
  );
}
