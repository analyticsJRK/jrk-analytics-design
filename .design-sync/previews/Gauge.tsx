import { VividStat } from '@jrk/design';

/* A ring gauge for a vivid tile, 0–1.

   The percentage is PRINTED inside the ring, and that is not styling — it is
   what makes the gauge legal. The unfilled remainder is `gradient.markSoft`, a
   white wash at 1.6:1 on the tone, well under the 3:1 non-text floor. A gauge
   whose only channel is the arc's extent would fail on that; this one states its
   value in text, so nothing depends on reading the arc. Solid white is 3.11:1
   against the remainder, so the two are still separable as shapes.

   Use it for a bounded ratio — percent complete, percent collected, utilisation.
   A gauge is the wrong form for an unbounded quantity, and the wrong form for a
   trend; those are the sparkline and the mini bars. */
export const Default = () => (
  <div style={{ maxWidth: 320 }}>
    <VividStat
      tone="blue"
      label="Payout pending"
      value="$3,840"
      unit=".00"
      caption="Jan 1 – Dec 31"
      gauge={0.68}
      action={{ label: 'Payout pending options' }}
    />
  </div>
);

/* The ARC clamps to 0–1; the LABEL does not. An over-100% ratio fills the ring
   rather than wrapping past its own start, because a second lap is
   indistinguishable from the first and would read as a smaller number than it
   is — but the printed figure still says 118%, because that figure is the whole
   reason the low-contrast remainder arc is legal. Printing the clamped value was
   a bug: the ring said "100%" next to a headline saying 118%. */
export const Bounds = () => (
  <div className="jrk-stat-row jrk-stat-row--split">
    <VividStat tone="teal" label="Budget used" value="12" unit="%" caption="FY26 to date" gauge={0.12} />
    <VividStat tone="teal" label="Budget used" value="94" unit="%" caption="FY26 to date" gauge={0.94} />
    <VividStat tone="teal" label="Budget used" value="118" unit="%" caption="FY26 to date" gauge={1.18} />
  </div>
);
