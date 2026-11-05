import type { ButtonHTMLAttributes, ReactNode } from 'react';
import styles from './Button.module.css';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  /** Shown before the label. */
  icon?: ReactNode;
}

export function Button({ variant = 'secondary', icon, className, type = 'button', children, ...rest }: ButtonProps) {
  return (
    <button type={type} className={[styles.button, styles[variant], className].filter(Boolean).join(' ')} {...rest}>
      {icon}
      {children}
    </button>
  );
}

export interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-label' | 'children'> {
  /** Accessible name, also shown as tooltip. */
  label: string;
  icon: ReactNode;
  /** Where the tooltip appears; `below` by default. */
  tooltip?: 'below' | 'right' | 'none';
}

export function IconButton({ label, icon, tooltip = 'below', className, type = 'button', ...rest }: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      data-tooltip={tooltip === 'none' ? undefined : label}
      data-tooltip-side={tooltip}
      className={[styles.iconButton, className].filter(Boolean).join(' ')}
      {...rest}
    >
      {icon}
    </button>
  );
}
