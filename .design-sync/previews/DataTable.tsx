import { DataTable, CellBar, Badge, Empty } from '@jrk/design';

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
