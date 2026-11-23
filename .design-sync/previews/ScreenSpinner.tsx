import { useState } from 'react';
import { ScreenSpinner, Button, Card } from '@jrk/design';

/* A write: labelled, so the reader knows not to press Approve again. Pointer
   events pass through — the button underneath still answers. */
export const Saving = () => {
  const [on, setOn] = useState(true);
  return (
    <div style={{ minHeight: 280, maxWidth: 460 }}>
      <Card title="Harbor Point" subtitle="186 units · 89.8% occupied">
        <Button onClick={() => setOn((v) => !v)}>{on ? 'Stop the wait' : 'Approve and lock'}</Button>
      </Card>
      {on && <ScreenSpinner label="Approving and locking…" />}
    </div>
  );
};

/* A navigation: no words, the page it waits for arrives. */
export const Navigating = () => (
  <div style={{ minHeight: 240 }}>
    <p className="jrk-caption">Opening Pest Control…</p>
    <ScreenSpinner />
  </div>
);
