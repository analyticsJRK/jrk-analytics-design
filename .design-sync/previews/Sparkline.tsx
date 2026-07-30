import { Sparkline, DataTable } from '@jrk/design';

type Trend = { property: string; occupancy: number; series: number[] };

const trends: Trend[] = [
  { property: 'Parkside Commons', occupancy: 96.4, series: [93.1, 93.6, 94.2, 94.0, 94.9, 95.4, 95.1, 95.8, 96.0, 96.2, 96.4] },
  { property: 'Vista Ridge', occupancy: 94.1, series: [95.8, 95.2, 94.9, 95.1, 94.4, 94.6, 94.0, 93.7, 93.9, 94.2, 94.1] },
  { property: 'Harbor Point', occupancy: 89.8, series: [93.4, 92.8, 92.1, 91.4, 91.6, 90.8, 90.2, 89.4, 89.1, 89.6, 89.8] },
  { property: 'Cedar Hollow', occupancy: 91.6, series: [90.2, 90.8, 91.1, 90.6, 91.4, 91.9, 91.2, 91.5, 91.8, 91.4, 91.6] },
];

/* Shape only, beside the number that carries the value — the SVG itself is
   aria-hidden by contract, so the figure next to it is what gets read. */
export const Default = () => (
  <div className="jrk-card" style={{ maxWidth: 340 }}>
    <div className="jrk-card__header">
      <div>
        <h3 className="jrk-card__title">Collections</h3>
        <p className="jrk-card__subtitle">Monthly · last 11 months</p>
      </div>
    </div>
    <div className="jrk-card__body">
      <div className="jrk-row-between">
        <span className="jrk-stat__value jrk-stat__value--sm">
          98.1<span className="jrk-stat__unit">%</span>
        </span>
        <Sparkline points={[91.0, 92.4, 93.1, 92.8, 94.6, 95.2, 96.1, 95.8, 97.2, 97.6, 98.1]} />
      </div>
    </div>
  </div>
);

/* A stack of sparks reads as a comparison: same width, same scale-per-row, so
   the eye picks out the one property that is sliding. */
export const TrendList = () => (
  <div className="jrk-card" style={{ maxWidth: 420 }}>
    <div className="jrk-card__header">
      <div>
        <h3 className="jrk-card__title">Occupancy trend</h3>
        <p className="jrk-card__subtitle">By property · last 11 months</p>
      </div>
    </div>
    <div className="jrk-card__body">
      <div className="jrk-stack" style={{ gap: 12 }}>
        {trends.map((t) => (
          <div className="jrk-row-between" key={t.property}>
            <span className="jrk-body-sm">{t.property}</span>
            <span className="jrk-row">
              <span className="jrk-body-sm jrk-tabular">{t.occupancy.toFixed(1)}%</span>
              <Sparkline points={t.series} />
            </span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

/* A trend column in a real table — the sparkline sits next to the value it
   summarizes, never instead of it. */
export const InTableColumn = () => (
  <DataTable
    caption="Occupancy by property — trailing 11 months"
    columns={[
      { key: 'property', header: 'Property', sortValue: (r: Trend) => r.property },
      {
        key: 'occupancy',
        header: 'Occupancy',
        numeric: true,
        sortValue: (r: Trend) => r.occupancy,
        cell: (r: Trend) => `${r.occupancy.toFixed(1)}%`,
      },
      {
        key: 'trend',
        header: 'Trend',
        align: 'center',
        cell: (r: Trend) => <Sparkline points={r.series} />,
        /* 96px of SVG plus the cell's own inline padding — a 120px column
           clips the spark against the table's rounded edge. */
        width: '160px',
      },
    ]}
    rows={trends}
    rowKey={(r) => r.property}
  />
);

/* Four shapes on the same 96x40 canvas. A flat series has no range to scale
   against, so it renders as a centered line rather than dividing by zero.
   Laid out with jrk-row, not jrk-grid: the chart layer's gridline rule
   (`.jrk-grid path`) repaints any SVG stroke inside a .jrk-grid container. */
export const Shapes = () => (
  <div className="jrk-row" style={{ flexWrap: 'wrap' }}>
    {[
      { label: 'Collections', points: [91.0, 92.4, 93.1, 92.8, 94.6, 95.2, 96.1, 95.8, 97.2, 97.6, 98.1] },
      { label: 'Occupancy', points: [93.4, 92.8, 92.1, 91.4, 91.6, 90.8, 90.2, 89.4, 89.1, 89.6, 89.8] },
      { label: 'Renewals', points: [61.4, 61.4, 61.4, 61.4, 61.4, 61.4, 61.4, 61.4, 61.4, 61.4, 61.4] },
      { label: 'Work orders', points: [118, 164, 131, 187, 142, 205, 133, 178, 149, 196, 142] },
    ].map((s) => (
      <div className="jrk-stack" key={s.label} style={{ gap: 6, width: 140 }}>
        <span className="jrk-overline">{s.label}</span>
        <Sparkline points={s.points} />
      </div>
    ))}
  </div>
);
