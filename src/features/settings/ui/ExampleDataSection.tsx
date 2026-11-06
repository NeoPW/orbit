import { Database } from 'lucide-react';
import { useState } from 'react';
import { useServices } from '../../../app/services.ts';
import { useToday } from '../../../core/dates/today.ts';
import { Button } from '../../../core/ui/components/Button.tsx';
import { Section } from '../../../core/ui/components/Section.tsx';
import { useMessages } from '../../../core/ui/messages/MessageProvider.tsx';
import { hasExampleData, loadExampleData } from '../data/example-data.ts';

/** Development builds only: fills the database with example goals, projects, tasks and habits to try the app. */
export function ExampleDataSection() {
  const { db } = useServices();
  const today = useToday();
  const messages = useMessages();
  const [busy, setBusy] = useState(false);

  async function load() {
    setBusy(true);
    try {
      if (await hasExampleData(db)) {
        messages.show({ text: 'The example data is already loaded', kind: 'info' });
        return;
      }
      await loadExampleData(db, () => new Date(), today);
      messages.show({ text: 'Example data loaded' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Section tile title="Example data">
      <p>Adds example goals, projects, tasks and habits (development builds only).</p>
      <div>
        <Button icon={<Database />} onClick={() => void load()} disabled={busy}>
          Load example data
        </Button>
      </div>
    </Section>
  );
}
