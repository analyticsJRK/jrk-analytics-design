import { useState } from 'react';
import type { CSSProperties } from 'react';
import { PanelHost, DockedPanel, Button, Card } from '@jrk/design';

/* Toggle the panel and the card gives up the rail's width instead of sliding under it. */
export const Default = () => {
  const [open, setOpen] = useState(true);
  return (
    <div style={{ minHeight: 280, ['--jrk-panel-top' as string]: '0px' } as CSSProperties}>
      <PanelHost open={open}>
        <Card title="Vista Ridge" subtitle="248 units · 94.1% occupied">
          <Button onClick={() => setOpen((v) => !v)}>{open ? 'Close guide' : 'Open guide'}</Button>
        </Card>
      </PanelHost>
      <DockedPanel
        open={open}
        label="Occupancy guide"
        tab="guide"
        onTabChange={() => {}}
        onClose={() => setOpen(false)}
        tabs={[{ id: 'guide', label: 'Guide', content: <p>Occupancy is occupied units over total units.</p> }]}
      />
    </div>
  );
};
