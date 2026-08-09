import { CellBarSigned } from '@jrk/design';

/* Signed magnitude as LENGTH from a centre axis. These render inside a real
   table because the component only tells the truth in one: the axis is what
   makes a signed bar readable, and an axis only means something when the rows
   above and below share it. A single bar shown alone would look correct and
   prove nothing. */

const fmtK = (n: number) => `${n > 0 ? '+' : n < 0 ? '−' : ''}${Math.abs(n / 1000).toFixed(0)}k`;

const MAX = 100_000;

const rows: Array<[string, number]> = [
  ['Bellevue Commons', 82_000],
  ['Harbor Point', -47_000],
  ['Sutter Yards', -100_000],
  ['Ridgeline', 16_000],
  ['Northgate', 0],
  ['Cedar Fork', 63_000],
];

/* One column, compared down its length — the job this form is for. Length is
   the precise channel, which is why this beats a tinted grid whenever the
   comparison runs vertically through a single measure. */
export const Default = () => (
  <table className="jrk-table" style={{ maxWidth: 460 }}>
    <thead>
      <tr>
        <th scope="col" className="jrk-col-start">
          Property
        </th>
        <th scope="col">Variance to budget</th>
      </tr>
    </thead>
    <tbody>
      {rows.map(([name, v]) => (
        <tr key={name}>
          <td className="jrk-col-start">{name}</td>
          <td>
            <CellBarSigned value={v} max={MAX} format={fmtK} />
          </td>
        </tr>
      ))}
    </tbody>
  </table>
);

/* Zero, and the near-zero band. Northgate draws no bar at all, which is correct
   — a bar of zero length is the honest rendering of no variance, and inventing a
   minimum stub would make nothing look like something. Cedar Fork at +63k sits
   well clear of it, so the empty row reads as data rather than as a bug. */
export const AroundZero = () => (
  <table className="jrk-table" style={{ maxWidth: 460 }}>
    <thead>
      <tr>
        <th scope="col" className="jrk-col-start">
          Property
        </th>
        <th scope="col">Variance</th>
      </tr>
    </thead>
    <tbody>
      {([['Northgate', 0], ['Alder Court', 1_200], ['Mill Row', -2_400], ['Cedar Fork', 63_000]] as Array<[string, number]>).map(
        ([name, v]) => (
          <tr key={name}>
            <td className="jrk-col-start">{name}</td>
            <td>
              <CellBarSigned value={v} max={MAX} format={fmtK} />
            </td>
          </tr>
        ),
      )}
    </tbody>
  </table>
);

/* Wrong on purpose, as a warning. Every row here passes its OWN value as `max`,
   which is the mistake the prop exists to prevent: each bar normalises against
   itself, so −47k and +82k both render full-width and the column says every
   property missed budget by the same amount. It looks entirely plausible, which
   is what makes it dangerous — pass one `max` for the whole set. */
export const WrongMaxPerRow = () => (
  <table className="jrk-table" style={{ maxWidth: 460 }}>
    <thead>
      <tr>
        <th scope="col" className="jrk-col-start">
          Property
        </th>
        <th scope="col">Variance (per-row max — do not do this)</th>
      </tr>
    </thead>
    <tbody>
      {rows.slice(0, 4).map(([name, v]) => (
        <tr key={name}>
          <td className="jrk-col-start">{name}</td>
          <td>
            <CellBarSigned value={v} max={Math.abs(v)} format={fmtK} />
          </td>
        </tr>
      ))}
    </tbody>
  </table>
);
