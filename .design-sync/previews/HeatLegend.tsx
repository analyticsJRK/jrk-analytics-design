import { HeatLegend, cellHeatProps } from '@jrk/design';

/* The legend only makes sense against the grid it describes, so these cards
   render both. The point being demonstrated is not how the swatches look — it is
   that the same `max` reaches the cells and the legend, because that is the one
   way this component can lie. */

const fmt = (n: number) => `${n > 0 ? '+' : n < 0 ? '−' : ''}${Math.abs(n).toFixed(1)}`;

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];

const grid: Array<[string, number[]]> = [
  ['Bellevue Commons', [4.1, 9.6, 1.2, -0.8, 6.7, 3.9]],
  ['Harbor Point', [-3.4, -9.9, -6.1, -8.8, -4.2, -1.1]],
  ['Sutter Yards', [0.9, 0, -1.4, 3.1, 1.8, -2.9]],
  ['Ridgeline', [-1.0, 7.2, 10.0, 4.4, -5.6, 1.5]],
];

const Grid = ({ max }: { max: number }) => (
  <table className="jrk-table">
    <thead>
      <tr>
        <th scope="col" className="jrk-col-start">
          Property
        </th>
        {MONTHS.map((m) => (
          <th key={m} scope="col">
            {m}
          </th>
        ))}
      </tr>
    </thead>
    <tbody>
      {grid.map(([name, vals]) => (
        <tr key={name}>
          <td className="jrk-col-start">{name}</td>
          {vals.map((v, i) => (
            /* The value is ALWAYS printed. The tint is the second channel, and
               at step 1 both arms are deliberately faint — a reader should never
               have to resolve polarity out of a pale wash. */
            <td key={MONTHS[i]} {...cellHeatProps(v, max)}>
              {fmt(v)}
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  </table>
);

/* Legend and grid sharing one `max`. Red ↔ blue rather than red ↔ green: red
   beside green is the textbook protan collapse, and on a signed table the arm is
   the meaning, so polarity is the one signal that cannot be allowed to fail.
   Worst measured polarity separation is ΔE 13.0 at rank 1 in light. */
export const Default = () => (
  <div className="jrk-card">
    <div className="jrk-card__header">
      <h3 className="jrk-card__title">NOI variance by month</h3>
      <p className="jrk-card__subtitle">Percent against budget</p>
    </div>
    <Grid max={10} />
    <div className="jrk-card__footer">
      <HeatLegend max={10} format={fmt} />
    </div>
  </div>
);

/* Legend alone, for the range where the ramp is read rather than scanned. Eight
   swatches, four per arm, no chip in the middle — a zero cell takes no fill in
   the table, so there is no grey midpoint to advertise. */
export const Standalone = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--jrk-space-4)' }}>
    <HeatLegend max={10} format={fmt} />
    <HeatLegend max={250_000} format={(n) => `${n > 0 ? '+' : n < 0 ? '−' : ''}${Math.abs(n / 1000).toFixed(0)}k`} />
  </div>
);

/* The failure the legend exists to prevent. The grid is normalised to ±10 while
   the legend claims ±2, so every cell reads as roughly five times worse than it
   is. Nothing about the rendering looks broken, which is the whole argument for
   treating `max` as one value threaded through both. */
export const MismatchedMax = () => (
  <div className="jrk-card">
    <div className="jrk-card__header">
      <h3 className="jrk-card__title">Mismatched scale — do not do this</h3>
      <p className="jrk-card__subtitle">Cells scaled to ±10, legend claiming ±2</p>
    </div>
    <Grid max={10} />
    <div className="jrk-card__footer">
      <HeatLegend max={2} format={fmt} />
    </div>
  </div>
);
