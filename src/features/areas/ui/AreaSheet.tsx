import { useState } from 'react';
import { useServices } from '../../../app/services.ts';
import { ColorPicker } from '../../../core/ui/components/ColorPicker.tsx';
import { ConfirmDialog } from '../../../core/ui/components/ConfirmDialog.tsx';
import { Sheet } from '../../../core/ui/components/Sheet.tsx';
import { TextField } from '../../../core/ui/components/TextField.tsx';
import { AREA_COLORS } from '../../../core/ui/palette.ts';
import type { Area } from '../../../core/db/schema.ts';
import { AREA_ERRORS, createArea, deleteArea, updateArea } from '../data/areas-repository.ts';

export interface AreaSheetProps {
  /** The area to edit; a new area without it. */
  area?: Area;
  /** Number of existing areas: a new area starts with the next palette color. */
  count?: number;
  onClose: () => void;
}

const clock = () => new Date();

export function AreaSheet({ area, count = 0, onClose }: AreaSheetProps) {
  const { db } = useServices();
  const [name, setName] = useState(area?.name ?? '');
  const [color, setColor] = useState(area?.color ?? AREA_COLORS[count % AREA_COLORS.length]!);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  async function save() {
    const result = area ? await updateArea(db, clock, area.id, { name, color }) : await createArea(db, clock, { name, color });
    if (result.ok) onClose();
    else setError(AREA_ERRORS[result.error]);
  }

  return (
    <>
      <Sheet title={area ? 'Edit area' : 'New area'} onClose={onClose} onSave={() => void save()} onDelete={area ? () => setConfirming(true) : undefined}>
        <TextField
          label="Name"
          value={name}
          error={error}
          onChange={(event) => {
            setName(event.target.value);
            setError(null);
          }}
        />
        <ColorPicker label="Color" colors={AREA_COLORS} value={color} onChange={(next) => setColor(next ?? color)} />
      </Sheet>
      {confirming && area && (
        <ConfirmDialog
          title="Delete area"
          text={`Delete "${area.name}"? Its projects stay, without an area.`}
          confirmLabel="Delete"
          danger
          onCancel={() => setConfirming(false)}
          onConfirm={() => {
            void deleteArea(db, clock, area.id).then(onClose);
          }}
        />
      )}
    </>
  );
}
