import { AppearanceMenu, DEFAULT_APPEARANCE } from '@jrk/design';
import type { AppearanceState } from '@jrk/design';
import { useState } from 'react';

/* THE PRIMARY CARD, open. A menu is a disclosure, so a static capture of a closed
   one is a picture of a button; the panel is the component. Controlled and NOT
   applied, so this card shows the controls without restyling the page around it. */
export const Open = () => {
  const [state, setState] = useState<AppearanceState>(DEFAULT_APPEARANCE);
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', minHeight: 300 }}>
      <AppearanceMenu value={state} onChange={setState} defaultOpen />
    </div>
  );
};

/* No Skin row: `skins={['standard']}` leaves theme and the base accent. */
export const ThemeAndAccentOnly = () => {
  const [state, setState] = useState<AppearanceState>(DEFAULT_APPEARANCE);
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', minHeight: 220 }}>
      <AppearanceMenu value={state} onChange={setState} skins={['standard']} defaultOpen />
    </div>
  );
};
