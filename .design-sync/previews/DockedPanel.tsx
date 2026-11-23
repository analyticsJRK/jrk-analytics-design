import { useState } from 'react';
import type { CSSProperties } from 'react';
import { DockedPanel, PanelHost, Button, Card, Textarea } from '@jrk/design';

/* `--jrk-panel-top: 0` because the frame has no topbar to sit under. The note box
   keeps what is typed in it across a tab switch — the panes stay mounted. */
export const Default = () => {
  const [open, setOpen] = useState(true);
  const [tab, setTab] = useState('guide');
  return (
    <div style={{ minHeight: 420, ['--jrk-panel-top' as string]: '0px' } as CSSProperties}>
      <PanelHost open={open}>
        <Card title="Harbor Point" subtitle="Snow plan 2026–27">
          <Button onClick={() => setOpen((v) => !v)}>{open ? 'Close panel' : 'Open panel'}</Button>
        </Card>
      </PanelHost>
      <DockedPanel
        open={open}
        label="Snow Tracker panel"
        tab={tab}
        onTabChange={setTab}
        onClose={() => setOpen(false)}
        footer="Snow Tracker · snow2"
        tabs={[
          {
            id: 'guide',
            label: 'Guide',
            content: (
              <p>
                <strong>% over contract</strong> is actual cost per inch over contracted cost per
                inch, less one. The portfolio figure is inch-weighted.
              </p>
            ),
          },
          {
            id: 'notes',
            label: 'Notes',
            count: 4,
            content: <Textarea rows={4} placeholder="Note on Harbor Point…" aria-label="Note" />,
          },
        ]}
      />
    </div>
  );
};
