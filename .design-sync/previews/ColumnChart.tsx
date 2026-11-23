import { ChartCard, ColumnChart, SeriesTable } from '@jrk/design';

const MONTHS = ['Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'];

/* One series is plain columns, slot 1. The month still filling is lighter,
   hatched and labelled "to date" on the axis — a partial month drawn like a
   closed one reads as a fall. */
const WORK_ORDERS = [{ name: 'Work orders', values: [41, 38, 52, 47, 60, 66, 71, 58, 49, 44, 39, 12] }];

export const Default = () => (
  <div style={{ maxWidth: 720 }}>
    <ChartCard
      title="Mold work orders"
      subtitle="Count, monthly · Dec 2025 – Nov 2026 (to date)"
      table={<SeriesTable labels={MONTHS} series={WORK_ORDERS} labelHeader="Month" />}
    >
      <ColumnChart labels={MONTHS} series={WORK_ORDERS} partial="last" />
    </ChartCard>
  </div>
);

/* Several series STACK — bottom of the stack first, in a fixed order, because
   the order is the slot assignment. Losses are negative and stack below a drawn
   zero line; only the outermost segment on each side takes the rounded end. */
const BILLS = [
  { name: 'Collected', values: [820, 790, 805, 830, 851, 842, 860, 875, 866, 880, 892, 410] },
  { name: 'Delinquent', values: [60, 72, 58, 64, 61, 70, 66, 59, 62, 71, 66, 120] },
  { name: 'Formula losses', values: [-40, -38, -42, -35, -30, -44, -41, -39, -36, -33, -31, -14] },
];

export const StackedWithLosses = () => (
  <div style={{ maxWidth: 720 }}>
    <ChartCard
      title="Where the bills went"
      subtitle="$ thousands, monthly · losses below zero"
      table={<SeriesTable labels={MONTHS} series={BILLS} format={(n) => `$${n}K`} total />}
    >
      <ColumnChart labels={MONTHS} series={BILLS} partial="last" format={(n) => `$${n.toLocaleString()}K`} height={260} />
    </ChartCard>
  </div>
);
