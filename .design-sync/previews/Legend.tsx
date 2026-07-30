import { Legend } from '@jrk/design';

const REGIONS = ['Parkside Commons', 'Vista Ridge', 'Harbor Point'];

const UNIT_MIX = ['Studio · 15%', '1 bed · 41%', '2 bed · 33%', '3 bed · 11%'];

/* Eight slots, fixed order. The ORDER is the colorblind-safety mechanism —
   neighbors are what touch in a stack or a line chart — so slots are assigned by
   identity and never re-packed when a filter drops a series. */
const ALL_EIGHT = [
  'Parkside Commons',
  'Vista Ridge',
  'Harbor Point',
  'Cedar Hollow',
  'Riverbend Flats',
  'Lakeshore East',
  'Old Mill Yard',
  'Other (4 assets)',
];

/* Two or more series, so the legend exists. Block swatches are the default —
   they match a filled mark: a bar, a stack segment, an area. */
export const Default = () => (
  <div className="jrk-stack" style={{ gap: 8, maxWidth: 480 }}>
    <span className="jrk-overline">Collected rent by property</span>
    <Legend series={REGIONS} />
  </div>
);

/* The swatch matches the mark it stands for: a line key for a line chart, a dot
   for a scatter, a block for a fill. */
export const Shapes = () => (
  <div className="jrk-stack" style={{ gap: 16, maxWidth: 480 }}>
    <div className="jrk-stack" style={{ gap: 8 }}>
      <span className="jrk-overline">shape=&quot;block&quot; · stacked bar, area</span>
      <Legend series={REGIONS} shape="block" />
    </div>
    <div className="jrk-stack" style={{ gap: 8 }}>
      <span className="jrk-overline">shape=&quot;line&quot; · line chart</span>
      <Legend series={REGIONS} shape="line" />
    </div>
    <div className="jrk-stack" style={{ gap: 8 }}>
      <span className="jrk-overline">shape=&quot;dot&quot; · scatter, marker series</span>
      <Legend series={REGIONS} shape="dot" />
    </div>
  </div>
);

/* Passing `onToggle` turns the entries into buttons with `aria-pressed`, so the
   legend becomes the filter. Harbor Point is in `hidden` here and reads dimmed —
   and its slot-3 aqua stays slot-3 aqua: color follows the entity, so hiding a
   series must never repaint the survivors. */
export const Toggleable = () => (
  <div className="jrk-stack" style={{ gap: 8, maxWidth: 480 }}>
    <span className="jrk-overline">Collected rent · Harbor Point filtered out</span>
    <Legend
      series={REGIONS}
      shape="line"
      hidden={new Set(['Harbor Point'])}
      onToggle={() => {}}
    />
  </div>
);

/* A legend with the number printed beside each name is one of the three things
   that legalizes a pastel tint fill — identity is carried by the text, not by
   the pale swatch alone. */
export const WithValues = () => (
  <div className="jrk-stack" style={{ gap: 8, maxWidth: 480 }}>
    <span className="jrk-overline">Unit mix · share of 2,140 units</span>
    <Legend series={UNIT_MIX} />
  </div>
);

/* MAX_SERIES = 8, and there is no slot 9. A ninth entity folds into "Other" —
   which is exactly what the last entry here is. */
export const EightSlots = () => (
  <div className="jrk-stack" style={{ gap: 8, maxWidth: 480 }}>
    <span className="jrk-overline">All 8 palette slots, in fixed order</span>
    <Legend series={ALL_EIGHT} />
  </div>
);
