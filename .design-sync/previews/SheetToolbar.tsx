import { SheetToolbar, SheetFoot, Select } from '@jrk/design';

const LETTERS = 'ABCDEFGHIJKLMNOPQRS'.split('');
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const ROWS: Array<[string, number[]]> = [
  ['2024', [388_410, 391_022, 393_870, 395_104, 396_220, 398_871, 401_114, 400_208, 402_660, 404_018, 403_311, 405_902]],
  ['2025', [401_220, 398_004, 402_118, 404_771, 406_032, 408_419, 410_266, 409_877, 412_301, 413_950, 414_207, 416_884]],
  ['2026', [415_330, 417_208, 418_944, 420_016, 421_502, 423_877, 425_140, 424_608, 426_993, 0, 0, 0]],
];
const usd = (n: number) => (n ? `$${n.toLocaleString('en-US')}` : '');

/* The toolbar measures itself, so the letter bar and the frozen rows pin under it
   even when the picker wraps. The foot strip is static and closes the sheet. */
export const Default = () => (
  <div className="jrk-sheet" role="grid" aria-label="Collections — Harbor Point" style={{ maxHeight: 320 }}>
    <SheetToolbar>
      <strong>Collections</strong>
      <Select defaultValue="HBP" aria-label="Property">
        <option value="HBP">HBP · Harbor Point</option>
        <option value="VRG">VRG · Vista Ridge</option>
      </Select>
    </SheetToolbar>
    <div className="jrk-sheet__colbar" aria-hidden="true">
      <div className="jrk-sheet__col" />
      {LETTERS.map((l) => (
        <div className="jrk-sheet__col" key={l}>{l}</div>
      ))}
    </div>
    <div className="jrk-sheet__row" role="row">
      <div className="jrk-sheet__gutter" aria-hidden="true">1</div>
      <div className="jrk-sheet__cell jrk-sheet__cell--label" role="columnheader">Year</div>
      {MONTHS.map((m) => (
        <div className="jrk-sheet__cell jrk-sheet__cell--num" role="columnheader" key={m}>{m}</div>
      ))}
    </div>
    {ROWS.map(([year, values], r) => (
      <div className="jrk-sheet__row" role="row" key={year}>
        <div className="jrk-sheet__gutter" aria-hidden="true">{r + 2}</div>
        <div className="jrk-sheet__cell jrk-sheet__cell--label" role="rowheader">{year}</div>
        {values.map((v, i) => (
          <div className="jrk-sheet__cell jrk-sheet__cell--num" role="gridcell" key={i}>{usd(v)}</div>
        ))}
      </div>
    ))}
    <SheetFoot>
      <span className="jrk-caption">Accrual basis · as of September 30, 2026</span>
    </SheetFoot>
  </div>
);
