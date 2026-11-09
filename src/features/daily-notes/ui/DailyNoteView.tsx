import { Fragment, type ReactNode } from 'react';
import { Checkbox } from '../../../core/ui/components/Checkbox.tsx';
import { parseNote, type Block, type Span } from '../domain/markdown.ts';
import styles from './DailyNoteView.module.css';

function inline(spans: Span[]): ReactNode {
  return spans.map((span, i) => {
    switch (span.kind) {
      case 'bold':
        return <strong key={i}>{span.text}</strong>;
      case 'italic':
        return <em key={i}>{span.text}</em>;
      case 'code':
        return <code key={i}>{span.text}</code>;
      default:
        return <Fragment key={i}>{span.text}</Fragment>;
    }
  });
}

export interface DailyNoteViewProps {
  text: string;
  /** Ticks or unticks the checkbox on the given line of the note. */
  onToggle: (line: number) => void;
}

/** The note formatted. Everything is built as React elements, so the text is never read as HTML. */
export function DailyNoteView({ text, onToggle }: DailyNoteViewProps) {
  return (
    <div className={styles.view}>
      {parseNote(text).map((block: Block, i) => {
        switch (block.kind) {
          case 'heading': {
            const Tag = (['h3', 'h4', 'h5'] as const)[block.level - 1]!;
            return (
              <Tag key={i} className={styles.heading}>
                {inline(block.spans)}
              </Tag>
            );
          }
          case 'item':
            return (
              <div key={i} className={styles.item} style={{ paddingLeft: `${block.depth * 18}px` }}>
                {block.checked === null ? (
                  <>
                    <span className={styles.bullet} aria-hidden="true">
                      •
                    </span>
                    <span>{inline(block.spans)}</span>
                  </>
                ) : (
                  <Checkbox checked={block.checked} label={inline(block.spans)} onChange={() => onToggle(block.line)} />
                )}
              </div>
            );
          case 'paragraph':
            return (
              <p key={i} className={styles.paragraph}>
                {inline(block.spans)}
              </p>
            );
          default:
            return <div key={i} className={styles.blank} />;
        }
      })}
    </div>
  );
}
