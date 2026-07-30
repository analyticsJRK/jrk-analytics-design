import { CellBar, DataTable } from '@jrk/design';

type Row = {
  property: string;
  units: number;
  delinquency: number;
  noi: number;
  collected: number;
  target: number;
};

const rows: Row[] = [
  { property: 'Parkside Commons', units: 312, delinquency: 1.2, noi: 1284000, collected: 1310000, target: 1250000 },
  { property: 'Vista Ridge', units: 248, delinquency: 2.6, noi: 962400, collected: 948000, target: 990000 },
  { property: 'Harbor Point', units: 186, delinquency: 4.1, noi: 704900, collected: 662000, target: 760000 },
  { property: 'Cedar Hollow', units: 154, delinquency: 3.4, noi: 588200, collected: 571000, target: 600000 },
  { property: 'Riverbend Flats', units: 96, delinquency: 7.8, noi: 311500, collected: 268000, target: 340000 },
];

/* Thousands-comma'd — a bare "$1284k" beside a bar reads as noise. */
const money = (n: number) => `$${Math.round(n / 1000).toLocaleString('en-US')}k`;
const pct = (n: number) => `${n.toFixed(1)}%`;

const maxDelinquency = Math.max(...rows.map((r) => r.delinquency));
const maxNoi = Math.max(...rows.map((r) => r.noi));
const maxUnits = Math.max(...rows.map((r) => r.units));

/* In-cell magnitude: the bar is a second encoding of a number the reader can
   still read, so the column stays scannable AND exact. */
export const Default = () => (
  <DataTable
    caption="Delinquency by property — current period"
    columns={[
      { key: 'property', header: 'Property', sortValue: (r: Row) => r.property },
      {
        key: 'delinquency',
        header: 'Delinquency',
        numeric: true,
        width: '45%',
        sortValue: (r: Row) => r.delinquency,
        cell: (r: Row) => <CellBar value={r.delinquency} max={maxDelinquency} format={pct} />,
      },
    ]}
    rows={rows}
    rowKey={(r) => r.property}
  />
);

/* `format` keeps money readable at a glance — the bar carries the comparison,
   the formatted figure carries the value. */
export const MoneyFormat = () => (
  <DataTable
    caption="Net operating income — trailing twelve months"
    columns={[
      { key: 'property', header: 'Property', sortValue: (r: Row) => r.property },
      {
        key: 'noi',
        header: 'NOI',
        numeric: true,
        width: '45%',
        sortValue: (r: Row) => r.noi,
        cell: (r: Row) => <CellBar value={r.noi} max={maxNoi} format={money} />,
      },
    ]}
    rows={rows}
    rowKey={(r) => r.property}
  />
);

/* Two bar columns, each on its own max — units and NOI are different scales,
   so sharing one max would flatten whichever column is smaller. */
export const TwoColumns = () => (
  <DataTable
    caption="Portfolio scale and return"
    columns={[
      { key: 'property', header: 'Property', sortValue: (r: Row) => r.property },
      {
        key: 'units',
        header: 'Units',
        numeric: true,
        width: '30%',
        sortValue: (r: Row) => r.units,
        cell: (r: Row) => <CellBar value={r.units} max={maxUnits} />,
      },
      {
        key: 'noi',
        header: 'NOI',
        numeric: true,
        width: '30%',
        sortValue: (r: Row) => r.noi,
        cell: (r: Row) => <CellBar value={r.noi} max={maxNoi} format={money} />,
      },
    ]}
    rows={rows}
    rowKey={(r) => r.property}
  />
);

/* Scaled against a target rather than the largest row: the bar reads as
   progress to plan, and anything over plan clamps at a full track. */
export const AgainstTarget = () => (
  <DataTable
    caption="Collections vs. plan — July"
    density="compact"
    columns={[
      { key: 'property', header: 'Property', sortValue: (r: Row) => r.property },
      {
        key: 'target',
        header: 'Plan',
        numeric: true,
        sortValue: (r: Row) => r.target,
        cell: (r: Row) => money(r.target),
      },
      {
        key: 'collected',
        header: 'Collected vs. plan',
        numeric: true,
        width: '40%',
        sortValue: (r: Row) => r.collected / r.target,
        cell: (r: Row) => <CellBar value={r.collected} max={r.target} format={money} />,
      },
    ]}
    rows={rows}
    rowKey={(r) => r.property}
  />
);
