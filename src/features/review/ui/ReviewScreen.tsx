import { NotebookPen } from 'lucide-react';
import { EmptyState } from '../../../core/ui/components/EmptyState.tsx';
import { PageHeader } from '../../../core/ui/components/PageHeader.tsx';

// Filled by the Review feature change.
export function ReviewScreen() {
  return (
    <>
      <PageHeader title="Review" />
      <EmptyState icon={NotebookPen} text="No weekly reviews yet" />
    </>
  );
}
