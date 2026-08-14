import { VividStat } from '@jrk/design';

/* A mini bar column for a vivid tile. Decorative by contract — aria-hidden,
   because the number beside it is the accessible value. Shape only: no axis, no
   labels, no baseline. If a reader needs to read values off it, it is a chart.

   The bars are white at full strength, which is the only value clearing the 3:1
   non-text floor on all four tones. They are `<span>`s inside a flex row, so
   flex blockification is what gives them height at all — an inline box ignores
   both width and height and the whole column renders as nothing. That is the
   layout gotcha this library has already paid for twice. */
export const Default = () => (
  <div style={{ maxWidth: 320 }}>
    <VividStat
      tone="violet"
      label="Payout released"
      value="$3,840"
      unit=".00"
      caption="Jan 1 – Dec 31"
      bars={[42, 66, 34, 88, 58, 74, 46, 96]}
    />
  </div>
);

/* Bars are floored at 6% of the track so a zero period still reads as a period
   rather than as missing data — the column keeps its rhythm and the gap stays
   visible as a low bar, not a hole. */
export const WithZeroes = () => (
  <div style={{ maxWidth: 320 }}>
    <VividStat
      tone="rose"
      label="Renewals signed"
      value="128"
      caption="Weekly · last 8 weeks"
      bars={[18, 24, 0, 31, 27, 0, 35, 42]}
    />
  </div>
);
