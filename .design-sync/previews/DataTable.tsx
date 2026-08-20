import { DataTable, CellBar, Badge, Empty } from '@jrk/design';
import type { Column } from '@jrk/design';

type Row = {
  property: string;
  units: number;
  occupancy: number;
  delinquency: number;
  noi: number;
  status: 'good' | 'warning' | 'serious';
};

const rows: Row[] = [
  { property: 'Parkside Commons', units: 312, occupancy: 96.4, delinquency: 1.2, noi: 1284000, status: 'good' },
  { property: 'Vista Ridge', units: 248, occupancy: 94.1, delinquency: 2.6, noi: 962400, status: 'good' },
  { property: 'Harbor Point', units: 186, occupancy: 89.8, delinquency: 4.1, noi: 704900, status: 'warning' },
  { property: 'Cedar Hollow', units: 154, occupancy: 91.6, delinquency: 3.4, noi: 588200, status: 'warning' },
  { property: 'Riverbend Flats', units: 96, occupancy: 82.3, delinquency: 7.8, noi: 311500, status: 'serious' },
];

/* Thousands-comma'd — a bare "$1284k" reads as noise next to the bar. */
const money = (n: number) => `$${Math.round(n / 1000).toLocaleString('en-US')}k`;
const maxNoi = Math.max(...rows.map((r) => r.noi));

/* `numeric` on every money and count column — and on its header — so digits
   stack on tabular figures. `sortValue` is what makes a column sortable. */
const columns = [
  { key: 'property', header: 'Property', sortValue: (r: Row) => r.property },
  { key: 'units', header: 'Units', numeric: true, sortValue: (r: Row) => r.units },
  {
    key: 'occupancy',
    header: 'Occupancy',
    numeric: true,
    sortValue: (r: Row) => r.occupancy,
    cell: (r: Row) => `${r.occupancy.toFixed(1)}%`,
  },
  {
    key: 'delinquency',
    header: 'Delinquency',
    numeric: true,
    sortValue: (r: Row) => r.delinquency,
    cell: (r: Row) => `${r.delinquency.toFixed(1)}%`,
  },
  {
    key: 'status',
    header: 'Status',
    cell: (r: Row) => (
      <Badge tone={r.status}>
        {r.status === 'good' ? 'On track' : r.status === 'warning' ? 'Watch' : 'Escalated'}
      </Badge>
    ),
  },
];

export const Default = () => (
  <DataTable
    caption="Portfolio performance — current period"
    columns={columns}
    rows={rows}
    rowKey={(r) => r.property}
  />
);

/* In-cell magnitude: the bar is a second encoding of a number that stays
   readable beside it. */
export const WithCellBars = () => (
  <DataTable
    columns={[
      { key: 'property', header: 'Property', sortValue: (r: Row) => r.property },
      {
        key: 'noi',
        header: 'NOI',
        numeric: true,
        sortValue: (r: Row) => r.noi,
        cell: (r: Row) => <CellBar value={r.noi} max={maxNoi} format={money} />,
      },
    ]}
    rows={rows}
    rowKey={(r) => r.property}
  />
);

export const Density = () => (
  <div className="jrk-stack">
    <DataTable columns={columns.slice(0, 3)} rows={rows.slice(0, 3)} rowKey={(r) => r.property} density="compact" caption="Compact" />
    <DataTable columns={columns.slice(0, 3)} rows={rows.slice(0, 3)} rowKey={(r) => r.property} density="comfortable" caption="Comfortable" />
  </div>
);

export const Zebra = () => (
  <DataTable columns={columns} rows={rows} rowKey={(r) => r.property} zebra />
);

/* Skeleton rows keep the table's geometry so the layout does not jump. */
export const Loading = () => (
  <DataTable columns={columns.slice(0, 4)} rows={[]} rowKey={(r) => r.property} loading />
);

/* Every data surface needs an empty state — an empty table with no
   explanation reads as a bug. */
export const EmptyState = () => (
  <DataTable
    columns={columns.slice(0, 4)}
    rows={[]}
    rowKey={(r) => r.property}
    empty={<Empty title="No properties match" description="Clear the region filter to see the full portfolio." />}
  />
);

/* FROZEN PANES ARE NOT A PROP, and this is the shape that shows why they are the
   default. Eighteen columns over twenty rows scrolls on both axes: without the
   frozen header a figure has no month, and without the frozen lead column it has
   no property. Both are on for every `.jrk-table` — `stickyFirst` is a retained
   no-op, and `maxHeight` only retunes a port that is already capped at 70vh.

   `rowHeader` on the identity column is still the caller's job. It is what makes
   the frozen cell a real `<th scope="row">` rather than a bold cell that happens
   to be pinned — the freeze is a rendering fact, the row header is a semantic one,
   and the reader who most needs the second one cannot see the first. */
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;

type MonthlyRow = { property: string; months: number[] };

const monthly: MonthlyRow[] = [
  'Parkside Commons', 'Vista Ridge', 'Harbor Point', 'Cedar Hollow', 'Riverbend Flats',
  'Sutter Yards', 'Ridgeline Park', 'Cascade Terrace', 'Halstead Row', 'Pinecrest Village',
  'Ashford Green', 'Old Mill Quarter', 'Verona Heights', 'Larkspur Bend', 'Waverly Flats',
  'Tamarack Ridge', 'Northgate Mews', 'Ellsworth Place', 'Juniper Crossing', 'Glenrose Manor',
].map((property, r) => ({
  property,
  months: MONTHS.map((_, m) => 42000 + ((r * 7 + m * 13) % 11) * 4300 + m * 900),
}));

const sum = (ns: number[]) => ns.reduce((a, b) => a + b, 0);

const monthlyColumns: Column<MonthlyRow>[] = [
  { key: 'property', header: 'Property', rowHeader: true, sortValue: (r) => r.property },
  ...MONTHS.map((m, i) => ({
    key: m,
    header: m,
    numeric: true,
    sortValue: (r: MonthlyRow) => r.months[i],
    cell: (r: MonthlyRow) => money(r.months[i]),
  })),
  { key: 'total', header: 'Total', numeric: true, sortValue: (r) => sum(r.months), cell: (r) => money(sum(r.months)) },
  { key: 'ytd', header: 'YTD', numeric: true, cell: (r) => money(sum(r.months.slice(0, 7))) },
  { key: 'budget', header: 'Budget', numeric: true, cell: (r) => money(sum(r.months) * 0.97) },
  /* The sign is printed, so direction survives greyscale and both dichromacies —
     no tone class is doing the work here. */
  { key: 'variance', header: 'Variance', numeric: true, cell: (r) => `+${money(sum(r.months) * 0.03)}` },
  { key: 'occupancy', header: 'Occupancy', numeric: true, cell: () => '94.2%' },
];

export const FrozenPanes = () => (
  <DataTable
    caption="Revenue by property and month"
    captionHidden
    columns={monthlyColumns}
    rows={monthly}
    rowKey={(r) => r.property}
    density="compact"
    footer={<span>20 of 312 properties</span>}
  />
);
