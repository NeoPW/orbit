import { Telescope } from 'lucide-react';
import { EmptyState } from '../../../core/ui/components/EmptyState.tsx';
import { PageHeader } from '../../../core/ui/components/PageHeader.tsx';
import styles from './PlanScreen.module.css';
import { TestAreas } from './TestAreas.tsx';

// Filled by the Plan feature changes; the areas change replaces TestAreas.
export function PlanScreen() {
  return (
    <>
      <PageHeader title="Plan" />
      <div className={styles.sections}>
        <EmptyState icon={Telescope} text="No goals yet" />
        <TestAreas />
      </div>
    </>
  );
}
