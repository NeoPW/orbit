import { Compass } from 'lucide-react';
import { navigate } from '../core/routing/useRoute.ts';
import { HOME, type Route } from '../core/routing/routes.ts';
import { Button } from '../core/ui/components/Button.tsx';
import { EmptyState } from '../core/ui/components/EmptyState.tsx';

export interface NotFoundProps {
  /** What was not found, for example "Task not found". */
  text?: string;
  /** Where the button leads. */
  destination?: Route;
  /** Label of the button, for example "Go to Plan". */
  label?: string;
}

/** Shown for a page or item that does not exist (or was deleted), with a way out. */
export function NotFound({ text = 'Page not found', destination = HOME, label = 'Go to Home' }: NotFoundProps) {
  return <EmptyState icon={Compass} text={text} action={<Button onClick={() => navigate(destination)}>{label}</Button>} />;
}
