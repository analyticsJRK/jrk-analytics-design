import { HueSwatches, VARIANT_AXES } from '@jrk/design';
import { useState } from 'react';

/* The unskinned layer's accent axis. The fills are sampled off the root, so in
   this card they are the six base accents in the card's own theme. */
export const Default = () => {
  const axis = VARIANT_AXES.standard!;
  const [hue, setHue] = useState(axis.default);
  return <HueSwatches axis={axis} value={hue} onChange={setHue} />;
};

/* A chosen hue that carries no restriction shows no note. */
export const Chosen = () => {
  const axis = VARIANT_AXES.standard!;
  const [hue, setHue] = useState('violet');
  return <HueSwatches axis={axis} value={hue} onChange={setHue} />;
};
