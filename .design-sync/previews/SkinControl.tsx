import { SkinControl } from '@jrk/design';
import type { SkinName } from '@jrk/design';
import { useState } from 'react';

/* Every layer the build knows, labelled from the token files. */
export const Default = () => {
  const [skin, setSkin] = useState<SkinName>('standard');
  return <SkinControl value={skin} onChange={setSkin} />;
};

/* A narrowed list, for a product that offers one skin beside the base. */
export const Narrowed = () => {
  const [skin, setSkin] = useState<SkinName>('vitrine');
  return <SkinControl value={skin} onChange={setSkin} skins={['standard', 'vitrine']} />;
};
