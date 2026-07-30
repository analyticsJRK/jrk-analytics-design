import { ChartCard, LineChart } from '@jrk/design';

const MONTHS = ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'];

/* $ thousands of collected rent, by property. Three series, slots 1-3 in order. */
const COLLECTIONS = [
  { name: 'Parkside Commons', values: [1420, 1465, 1390, 1510, 1580, 1620, 1595, 1660, 1710, 1690, 1745, 1802] },
  { name: 'Vista Ridge', values: [980, 1010, 995, 1040, 1075, 1030, 1088, 1120, 1095, 1160, 1185, 1210] },
  { name: 'Harbor Point', values: [640, 620, 705, 688, 730, 762, 744, 790, 815, 802, 848, 872] },
];

/* Peaks at 936 so the axis tops out at a clean 1,000 — the wash then fills the
   plot instead of hugging the baseline under three empty gridlines. */
const PORTFOLIO = [
  { name: 'Work orders closed', values: [742, 768, 715, 806, 838, 792, 861, 894, 848, 912, 936, 921] },
];

const TURNOVER = [
  { name: 'Move-ins', values: [186, 174, 152, 131, 118, 126, 149, 178, 204, 246, 268, 251] },
  { name: 'Move-outs', values: [142, 158, 166, 149, 137, 121, 134, 161, 188, 212, 229, 218] },
];

/* Eight named properties — the palette's full width. There is deliberately no
   ninth slot: a ninth series folds into "Other" or facets into small multiples,
   and `seriesColor(8)` throws rather than cycling. */
const ALL_EIGHT = [
  { name: 'Parkside Commons', values: [1420, 1465, 1390, 1510, 1580, 1620, 1595, 1660, 1710, 1690, 1745, 1802] },
  { name: 'Vista Ridge', values: [1280, 1310, 1265, 1340, 1375, 1330, 1388, 1420, 1395, 1460, 1485, 1510] },
  { name: 'Harbor Point', values: [1140, 1120, 1205, 1188, 1230, 1262, 1244, 1290, 1315, 1302, 1348, 1372] },
  { name: 'Cedar Hollow', values: [980, 1010, 995, 1040, 1075, 1030, 1088, 1120, 1095, 1160, 1185, 1210] },
  { name: 'Riverbend Flats', values: [840, 862, 828, 894, 916, 902, 948, 972, 940, 1004, 1028, 1056] },
  { name: 'Lakeshore East', values: [706, 688, 730, 712, 748, 776, 758, 794, 820, 806, 842, 868] },
  { name: 'Old Mill Yard', values: [548, 566, 532, 590, 612, 598, 636, 658, 630, 674, 698, 720] },
  { name: 'Other (4 assets)', values: [382, 396, 370, 412, 428, 418, 446, 464, 442, 478, 496, 512] },
];

const usdK = (n: number) => `$${n.toLocaleString()}K`;
const count = (n: number) => n.toLocaleString();

/* Three series, so the legend renders — line-shaped keys, matching the marks.
   Axes are hairline and solid; the y ticks round to clean thousands. */
export const Default = () => (
  <div style={{ maxWidth: 720 }}>
    <ChartCard title="Collected rent by property" subtitle="Monthly, $ thousands · Aug 2025 – Jul 2026">
      <LineChart series={COLLECTIONS} labels={MONTHS} format={usdK} height={240} />
    </ChartCard>
  </div>
);

/* `area` is single-series only — a stacked wash stops being readable past one.
   And with one series there is no legend at all: the title already names what
   is plotted, so a one-swatch box would only restate it. */
export const SingleSeriesArea = () => (
  <div style={{ maxWidth: 720 }}>
    <ChartCard title="Work orders closed" subtitle="Monthly count · Aug 2025 – Jul 2026">
      <LineChart series={PORTFOLIO} labels={MONTHS} format={count} area height={240} />
    </ChartCard>
  </div>
);

/* `height` is the one size knob — 150px is the dense-dashboard end of it. The
   viewBox is still measured from the container, so the axis text stays 12px. */
export const Compact = () => (
  <div style={{ maxWidth: 460 }}>
    <ChartCard title="Unit turnover" subtitle="Monthly count · Aug 2025 – Jul 2026">
      <LineChart series={TURNOVER} labels={MONTHS} format={count} height={150} />
    </ChartCard>
  </div>
);

/* MAX_SERIES = 8. The eighth entity here is already folded into "Other", which
   is what the cap is for. Nine would throw a RangeError, by design. */
export const MaxSeries = () => (
  <div style={{ maxWidth: 720 }}>
    <ChartCard
      title="Collected rent — all regions"
      subtitle="Monthly, $ thousands · 8 of 8 palette slots · Aug 2025 – Jul 2026"
    >
      <LineChart series={ALL_EIGHT} labels={MONTHS} format={usdK} height={260} />
    </ChartCard>
  </div>
);
