import { VividStat } from '@jrk/design';

/* The saturated gradient KPI tile — a dashboard MASTHEAD, not a general tile.
   It is the loudest thing this library draws, so use it the way the sheet banner
   is used: one band, at the top, leading a page. A grid of these below the fold
   is four mastheads and no page.

   The default tone is the brand blue. A single vivid tile does not need a hue
   decision, and it should not make one. */
export const Default = () => (
  <div style={{ maxWidth: 320 }}>
    <VividStat
      label="Commission earned"
      value="$3,840"
      unit=".00"
      caption="Jan 1 – Dec 31"
      spark={[12, 15, 13, 19, 17, 24, 22, 29, 27, 34, 38]}
    />
  </div>
);

/* The four tones, in row order.

   HUE HERE IS DECORATION AND NOT IDENTITY, and that is measured rather than
   asserted: half these pairs collapse under simulated colour-blindness — violet
   and blue are dE 1.9 apart under protanopia, i.e. the same colour, against the
   chart palette's floor of 10. That is unavoidable at the depth white text
   requires, because the white-safe slice of sRGB is too narrow to also carry
   eight-way separation. So pick a tone by the tile's POSITION in the row, never
   by what the metric means. The label is the identity channel, which is why it is
   a required prop.

   The tones are also lightness-matched on purpose (white measures 4.85–5.22:1
   across all four), so no tile reads as heavier than its neighbours. `validate`
   gates the spread. */
export const Tones = () => (
  <div className="jrk-stat-row jrk-stat-row--split">
    <VividStat tone="rose" label="Commission earned" value="$3,840" unit=".00" caption="Jan 1 – Dec 31"
      spark={[12, 15, 13, 19, 17, 24, 22, 29, 27, 34, 38]}
      action={{ label: 'Commission earned options' }} />
    <VividStat tone="violet" label="Payout released" value="$3,840" unit=".00" caption="Jan 1 – Dec 31"
      bars={[42, 66, 34, 88, 58, 74, 46, 96]}
      action={{ label: 'Payout released options' }} />
    <VividStat tone="blue" label="Payout pending" value="$3,840" unit=".00" caption="Jan 1 – Dec 31"
      gauge={0.68}
      action={{ label: 'Payout pending options' }} />
    <VividStat tone="teal" label="Total sales" value="$320" unit=".00" caption="Jan 1 – Dec 31"
      spark={[22, 14, 26, 18, 31, 21, 35, 28, 41, 33, 44]}
      action={{ label: 'Total sales options' }} />
  </div>
);

/* A delta works here and loses its colour on the way in. The green/red delta
   steps were selected against the card and are unreadable on a saturated ground,
   so the vivid rule paints them white — but nothing is lost, because a delta in
   this library already carries its direction in the arrow glyph and in sr-only
   text. The redundant channel goes; the primary one does not. */
export const WithDelta = () => (
  <div style={{ maxWidth: 320 }}>
    <VividStat
      tone="teal"
      label="Collections"
      value="98.1"
      unit="%"
      delta={{ value: 1.9, vs: 'vs 90d avg' }}
      bars={[61, 72, 58, 80, 69, 88, 74, 94]}
    />
  </div>
);

/* Hierarchy on a vivid tile comes from SIZE and WEIGHT, never from a dimmer ink.
   The lightest tone holds white at 4.85:1, so the whole budget is 0.35 above the
   floor — white at 85% alpha measures 3.92:1 and fails. There is deliberately no
   `gradient.inkMuted` to reach for. If a line needs to recede, make it smaller.

   Note also what this tile does NOT take: a `<Button>` of any volume. `--cta` is
   filled with the accent anchor, which IS the blue tone's own light stop, so on
   that tile it is a rectangle of the tile's own colour; `--primary` is a pale
   wash that reads as a hole on a saturated ground. The corner `action` is the one
   control, and its focus ring is white because the brand ring would be invisible
   on blue. */
export const NoSecondaryInk = () => (
  <div style={{ maxWidth: 320 }}>
    <VividStat
      tone="violet"
      label="Open lease audits"
      value="37"
      caption="12 awaiting property manager"
      action={{ label: 'Open lease audits options', icon: 'gear' }}
    />
  </div>
);
