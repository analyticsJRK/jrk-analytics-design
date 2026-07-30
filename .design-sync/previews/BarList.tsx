import { BarList, ChartCard } from '@jrk/design';

/* Delinquent balance, $. Property names are nominal — swapping their order
   changes nothing — so every bar takes slot 1. Bar length already encodes the
   value; coloring each bar differently would spend the identity channel
   re-encoding what length shows. */
const DELINQUENT = [
  { label: 'Riverbend Flats', value: 612470 },
  { label: 'Harbor Point', value: 481200 },
  { label: 'Parkside Commons', value: 344900 },
  { label: 'Cedar Hollow', value: 289100 },
  { label: 'Vista Ridge', value: 176300 },
  { label: 'Old Mill Yard', value: 98450 },
];

const OPEN_WORK_ORDERS = [
  { label: 'Riverbend Flats', value: 148 },
  { label: 'Harbor Point', value: 121 },
  { label: 'Parkside Commons', value: 96 },
  { label: 'Cedar Hollow', value: 74 },
  { label: 'Vista Ridge', value: 52 },
];

const CLOSED_WORK_ORDERS = [
  { label: 'Riverbend Flats', value: 96 },
  { label: 'Harbor Point', value: 133 },
  { label: 'Parkside Commons', value: 88 },
  { label: 'Cedar Hollow', value: 61 },
  { label: 'Vista Ridge', value: 47 },
];

/* Long entity names — the label column is a width, not a truncation policy. */
const RENEWALS = [
  { label: 'Parkside Commons — North Tower', value: 74.2 },
  { label: 'Riverbend Flats — Phase II', value: 68.9 },
  { label: 'Harbor Point Residences', value: 61.4 },
  { label: 'Cedar Hollow Townhomes', value: 57.8 },
  { label: 'Vista Ridge Apartments', value: 49.3 },
];

const usdK = (n: number) => `$${Math.round(n / 1000).toLocaleString()}K`;
const usd = (n: number) => `$${Math.round(n).toLocaleString()}`;
const pct = (n: number) => `${n.toFixed(1)}%`;
const count = (n: number) => n.toLocaleString();

const DelinquentTable = () => (
  <div className="jrk-table-wrap">
    <table className="jrk-table jrk-table--compact">
      <caption className="jrk-sr-only">Delinquent balance by property, as of 29 Jul 2026</caption>
      <thead>
        <tr>
          <th scope="col">Property</th>
          <th scope="col" className="jrk-num">
            Balance
          </th>
        </tr>
      </thead>
      <tbody>
        {DELINQUENT.map((d) => (
          <tr key={d.label}>
            <td>{d.label}</td>
            <td className="jrk-num">{usd(d.value)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

/* The `.jrk-chart` wrapper is required, not decorative: `.jrk-bars__fill` paints
   `background: var(--series)`, and `.jrk-chart` is what declares the slot-1
   default. Without it the fills come up transparent. */
export const Default = () => (
  <div className="jrk-chart" style={{ maxWidth: 520 }}>
    <div className="jrk-stack" style={{ gap: 2 }}>
      <span className="jrk-overline">Delinquent balance by property</span>
      <span className="jrk-caption">Top 6, $ · as of 29 Jul 2026</span>
    </div>
    <BarList items={DELINQUENT} format={usdK} labelWidth="150px" />
  </div>
);

/* In its card, with the table view behind the toggle — the exact figures the
   rounded $K labels drop. */
export const InChartCard = () => (
  <div style={{ maxWidth: 560 }}>
    <ChartCard
      title="Delinquent balance"
      subtitle="Top 6 properties, $ · as of 29 Jul 2026"
      table={<DelinquentTable />}
    >
      <div className="jrk-chart">
        <BarList items={DELINQUENT} format={usdK} labelWidth="150px" />
      </div>
    </ChartCard>
  </div>
);

/* Two lists that must be read against each other get the SAME explicit `max`.
   Left to itself each list scales to its own peak, and the two 100%-width bars
   would imply 148 open equals 133 closed. */
export const ComparableMax = () => (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
      gap: 'var(--jrk-space-4)',
      maxWidth: 760,
    }}
  >
    <ChartCard title="Work orders opened" subtitle="Count · Jul 2026 · scaled 0–150">
      <div className="jrk-chart">
        <BarList items={OPEN_WORK_ORDERS} format={count} max={150} labelWidth="140px" />
      </div>
    </ChartCard>
    <ChartCard title="Work orders closed" subtitle="Count · Jul 2026 · scaled 0–150">
      <div className="jrk-chart">
        <BarList items={CLOSED_WORK_ORDERS} format={count} max={150} labelWidth="140px" />
      </div>
    </ChartCard>
  </div>
);

/* A label that will not fit is not clipped — widen `labelWidth` instead. The
   column ellipsizes at its edge, so 230px is what these asset names need. */
export const WideLabels = () => (
  <div style={{ maxWidth: 620 }}>
    <ChartCard title="Renewal rate by asset" subtitle="% of expiring leases renewed · trailing 12 months">
      <div className="jrk-chart">
        <BarList items={RENEWALS} format={pct} max={100} labelWidth="230px" />
      </div>
    </ChartCard>
  </div>
);
