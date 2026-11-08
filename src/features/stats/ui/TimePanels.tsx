import { FolderKanban } from 'lucide-react';
import { useMemo, type CSSProperties } from 'react';
import { navigate } from '../../../core/routing/useRoute.ts';
import { EmptyState } from '../../../core/ui/components/EmptyState.tsx';
import { ListRow } from '../../../core/ui/components/ListRow.tsx';
import { Section } from '../../../core/ui/components/Section.tsx';
import { TimeByPanel } from '../../review/ui/TimeSection.tsx';
import { formatDuration } from '../../work-log/domain/work-log.ts';
import type { StatsDetail } from '../data/detail-loader.ts';
import type { Period } from '../domain/period.ts';
import { periodTime, projectRows } from '../domain/period-time.ts';
import styles from './TimePanels.module.css';

const duration = (minutes: number) => (minutes > 0 ? formatDuration(Math.round(minutes)) : '0 min');

/** Time by area, goal or project over the period, and the projects with their total time. */
export function TimePanels({ detail, period, today }: { detail: StatsDetail; period: Period; today: string }) {
  const time = useMemo(() => periodTime(detail.entries, detail.links, period, today, detail.allStart), [detail, period, today]);
  const rows = useMemo(() => projectRows(time, detail.lifetime, detail.links), [time, detail]);
  return (
    <div className={styles.pair}>
      <TimeByPanel time={time} />
      <Section tile title="Projects" count={rows.length || undefined}>
        {rows.length === 0 ? (
          <EmptyState icon={FolderKanban} text="No project time in this period" />
        ) : (
          rows.map((row) => (
            <ListRow
              key={row.id}
              leading={<span className={styles.dot} style={{ '--item-color': row.color ?? 'var(--color-text-faint)' } as CSSProperties} />}
              title={row.title}
              meta={row.finishedAfterDays === null ? undefined : `Finished after ${row.finishedAfterDays} ${row.finishedAfterDays === 1 ? 'day' : 'days'}`}
              onOpen={() => navigate({ name: 'project', id: row.id })}
              trailing={
                <span className={styles.times}>
                  <strong>{duration(row.periodMinutes)}</strong>
                  <span>{duration(row.totalMinutes)} in total</span>
                </span>
              }
            />
          ))
        )}
      </Section>
    </div>
  );
}
