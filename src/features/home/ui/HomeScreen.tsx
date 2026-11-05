import { Inbox } from 'lucide-react';
import { EmptyState } from '../../../core/ui/components/EmptyState.tsx';
import { PageHeader } from '../../../core/ui/components/PageHeader.tsx';

// Filled by the Home feature change.
export function HomeScreen() {
  return (
    <>
      <PageHeader title="Home" />
      <EmptyState icon={Inbox} text="Nothing to do today" />
    </>
  );
}
