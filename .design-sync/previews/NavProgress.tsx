import { useState } from 'react';
import { NavProgress, Button } from '@jrk/design';

/* Driven by hand here; in an app `useNavProgress(locationKey)` drives it. The bar
   is fixed to the top of the frame. */
export const Default = () => {
  const [busy, setBusy] = useState(true);
  return (
    <div style={{ minHeight: 120, paddingTop: 24 }}>
      <NavProgress busy={busy} />
      <Button onClick={() => setBusy((b) => !b)}>{busy ? 'Navigation landed' : 'Open Pest › Calendar'}</Button>
    </div>
  );
};
