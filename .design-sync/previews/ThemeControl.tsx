import { ThemeControl } from '@jrk/design';
import type { ThemePref } from '@jrk/design';
import { useState } from 'react';

/* The stored preference, three-valued. Not applied here, so the card does not
   flip the page it sits on. */
export const Default = () => {
  const [pref, setPref] = useState<ThemePref>('system');
  return <ThemeControl value={pref} onChange={setPref} />;
};

export const Medium = () => {
  const [pref, setPref] = useState<ThemePref>('dark');
  return <ThemeControl value={pref} onChange={setPref} size="md" />;
};
