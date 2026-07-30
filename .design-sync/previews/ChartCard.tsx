import { ChartCard, LineChart, BarList } from '@jrk/design';

/* Trailing twelve months of collected rent, $ thousands, by property. The
   subtitle on every card below names that window and that unit — a chart whose
   title does not say what period it covers is not finished. */
const MONTHS = ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'];

const COLLECTIONS = [
  { name: 'Parkside Commons', values: [1420, 1465, 1390, 1510, 1580, 1620, 1595, 1660, 1710, 1690, 1745, 1802] },
  { name: 'Vista Ridge', values: [980, 1010, 995, 1040, 1075, 1030, 1088, 1120, 1095, 1160, 1185, 1210] },
  { name: 'Harbor Point', values: [640, 620, 705, 688, 730, 762, 744, 790, 815, 802, 848, 872] },
];

const DELINQUENT = [
  { label: 'Riverbend Flats', value: 612470 },
  { label: 'Harbor Point', value: 481200 },
  { label: 'Parkside Commons', value: 344900 },
  { label: 'Cedar Hollow', value: 289100 },
  { label: 'Vista Ridge', value: 176300 },
  { label: 'Old Mill Yard', value: 98450 },
];

const usdK = (n: number) => `$${n.toLocaleString()}K`;
const usd = (n: number) => `$${Math.round(n).toLocaleString()}`;

/* The table view is the relief channel for the light-mode hues below 3:1, the
   answer for screen readers, and how anyone reads an exact figure. */
const CollectionsTable = () => (
  <div className="jrk-table-wrap">
    <table className="jrk-table jrk-table--compact">
      <caption className="jrk-sr-only">Collected rent by property, monthly, $ thousands</caption>
      <thead>
        <tr>
          <th scope="col">Month</th>
          {COLLECTIONS.map((s) => (
            <th scope="col" className="jrk-num" key={s.name}>
              {s.name}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {MONTHS.map((m, i) => (
          <tr key={m}>
            <td>{m}</td>
            {COLLECTIONS.map((s) => (
              <td className="jrk-num" key={s.name}>
                {usdK(s.values[i])}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

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

/* Title + period-and-unit subtitle + plot. Nothing else is required. */
export const Default = () => (
  <div style={{ maxWidth: 720 }}>
    <ChartCard title="Collected rent by property" subtitle="Monthly, $ thousands · Aug 2025 – Jul 2026">
      <LineChart series={COLLECTIONS} labels={MONTHS} format={usdK} height={230} />
    </ChartCard>
  </div>
);

/* Every chart has a table view. Passing `table` is what puts the toggle in the
   header — the button reads "Show table" until it is pressed. */
export const WithTableView = () => (
  <div style={{ maxWidth: 720 }}>
    <ChartCard
      title="Collected rent by property"
      subtitle="Monthly, $ thousands · Aug 2025 – Jul 2026"
      table={<CollectionsTable />}
    >
      <LineChart series={COLLECTIONS} labels={MONTHS} format={usdK} height={230} />
    </ChartCard>
  </div>
);

/* `actions` sits to the left of the table toggle, so a period switcher and the
   toggle share one row without either being pushed out of the header. */
export const WithActions = () => (
  <div style={{ maxWidth: 720 }}>
    <ChartCard
      title="Collected rent by property"
      subtitle="Monthly, $ thousands · Aug 2025 – Jul 2026"
      actions={
        <div className="jrk-btn-group" role="group" aria-label="Period">
          <button type="button" className="jrk-btn jrk-btn--secondary jrk-btn--sm" aria-pressed="false">
            30d
          </button>
          <button type="button" className="jrk-btn jrk-btn--secondary jrk-btn--sm" aria-pressed="true">
            QTD
          </button>
          <button type="button" className="jrk-btn jrk-btn--secondary jrk-btn--sm" aria-pressed="false">
            YTD
          </button>
        </div>
      }
      table={<CollectionsTable />}
    >
      <LineChart series={COLLECTIONS} labels={MONTHS} format={usdK} height={230} />
    </ChartCard>
  </div>
);

/* The card is form-agnostic — ranked bars take the same header contract. The
   BarList sits inside a `.jrk-chart` so the fills inherit `--series` (slot 1). */
export const RankedBars = () => (
  <div style={{ maxWidth: 560 }}>
    <ChartCard
      title="Delinquent balance"
      subtitle="Top 6 properties, $ · as of 29 Jul 2026"
      table={<DelinquentTable />}
    >
      <div className="jrk-chart">
        <BarList items={DELINQUENT} format={(n) => `$${Math.round(n / 1000).toLocaleString()}K`} labelWidth="150px" />
      </div>
    </ChartCard>
  </div>
);
