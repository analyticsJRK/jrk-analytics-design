import { ChartCard, LineChart, SeriesTable } from '@jrk/design';

const MONTHS = ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'];
const ABSORPTION = [
  { name: '2026', values: [44, 51, 18, -12, 9, null], slot: 1 },
  { name: '2025', values: [26, 35, 22, 3, -8, -15], slot: 2, style: 'dashed' as const },
];

/* Every chart has a table view — the relief channel for the light hues under
   3:1, the screen-reader answer, and the only place an exact value lives. A
   month that has not happened prints a dash, never a 0. */
export const Default = () => (
  <div style={{ maxWidth: 640 }}>
    <ChartCard
      title="Net absorption"
      subtitle="Units, monthly · Jun – Nov"
      table={<SeriesTable labels={MONTHS} series={ABSORPTION} labelHeader="Month" caption="Net absorption by month" />}
    >
      <LineChart labels={MONTHS} series={ABSORPTION} endLabels />
    </ChartCard>
  </div>
);
