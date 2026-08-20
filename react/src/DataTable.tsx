import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { cx } from './utils';

export type SortDir = 'ascending' | 'descending';

export interface Column<Row> {
  key: string;
  header: ReactNode;
  /** Cell renderer. Omit to render `row[key]` as text. */
  cell?: (row: Row, index: number) => ReactNode;
  /** Right-aligns on tabular figures. Use for every money and count column. */
  numeric?: boolean;
  align?: 'start' | 'center';
  /** Render this column as `<th scope="row">` — the cell that NAMES the row.
   *
   *  Set it on the identity column of any table whose rows are things rather
   *  than readings: a property, a unit, a person, a month. It is what makes a
   *  screen reader announce "Cascades, 460 units" instead of reading out a row
   *  of bare numbers, and it is most of the difference between a table and a
   *  grid of figures.
   *
   *  A row header is a LABEL, so it also opts out of the centred default and
   *  starts — see the leading-column rule in table.css. */
  rowHeader?: boolean;
  /** Value used for sorting. Required to make the column sortable — a column
   *  with a custom `cell` has no sortable value otherwise. */
  sortValue?: (row: Row) => string | number;
  width?: string;
}

export interface DataTableProps<Row> {
  columns: Column<Row>[];
  rows: Row[];
  rowKey: (row: Row, index: number) => string;
  caption?: string;
  /** Keep the caption for assistive tech but take it off the screen.
   *
   *  A `<caption>` is the table's accessible NAME, so it should almost always be
   *  set — a screen-reader user landing on a page with three tables gets "table"
   *  three times without it. It is far less often wanted visibly: on a screen
   *  whose `<h1>` already says "Deal Pipeline", a caption above the header row
   *  repeats the page title in grey and spends a row of the scroll port saying
   *  nothing new.
   *
   *  This is the split the library's own gallery makes — its data-table demo
   *  writes `<caption class="jrk-sr-only">` — and the prop exists because a
   *  consumer of the React component had no way to reach that class. Without it
   *  the choice was a redundant visible caption or an unnamed table, and the
   *  second one is invisible in a screenshot, so it is the one that gets picked.
   *
   *  Prefer this over dropping `caption`. */
  captionHidden?: boolean;
  density?: 'compact' | 'default' | 'comfortable';
  /** Freezes the first column while the table scrolls sideways. */
  stickyFirst?: boolean;
  /** Caps the scroll port so the sticky header actually pins.
   *
   *  `thead th` is `position: sticky; top: 0` in every table this library
   *  draws, and on a table that does not scroll VERTICALLY that rule does
   *  nothing at all — sticky resolves against the nearest scrolling ancestor,
   *  which is the wrapper, and an uncapped wrapper never scrolls; the page body
   *  does. So a long table's header scrolls away while the CSS says it is
   *  pinned. Pass a height (`'70vh'`, `'min(70vh, 820px)'`) and the header
   *  stays put. Any CSS length. */
  maxHeight?: string;
  zebra?: boolean;
  loading?: boolean;
  /** Shown when `rows` is empty and not loading. Always supply one. */
  empty?: ReactNode;
  onRowClick?: (row: Row, index: number) => void;
  /** Per-row class, for state the table itself does not own — the row being
   *  edited, the row a filter matched. Returning nothing is fine. */
  rowClassName?: (row: Row, index: number) => string | undefined;
  selectedKeys?: ReadonlySet<string>;
  footer?: ReactNode;
  className?: string;
}

export function DataTable<Row>({
  columns,
  rows,
  rowKey,
  caption,
  captionHidden,
  density = 'default',
  stickyFirst,
  maxHeight,
  zebra,
  loading,
  empty,
  onRowClick,
  rowClassName,
  selectedKeys,
  footer,
  className,
}: DataTableProps<Row>) {
  const [sort, setSort] = useState<{ key: string; dir: SortDir } | null>(null);

  const sorted = useMemo(() => {
    if (!sort) return rows;
    const col = columns.find((c) => c.key === sort.key);
    if (!col?.sortValue) return rows;
    const dir = sort.dir === 'ascending' ? 1 : -1;
    // Copy first — sorting the caller's array in place is a nasty surprise.
    return [...rows].sort((a, b) => {
      const av = col.sortValue!(a);
      const bv = col.sortValue!(b);
      if (av === bv) return 0;
      return (av < bv ? -1 : 1) * dir;
    });
  }, [rows, sort, columns]);

  const toggleSort = (key: string) =>
    setSort((s) =>
      s?.key === key
        ? { key, dir: s.dir === 'ascending' ? 'descending' : 'ascending' }
        : { key, dir: 'ascending' },
    );

  const showEmpty = !loading && sorted.length === 0;

  return (
    <div
      className={cx('jrk-table-wrap', maxHeight && 'jrk-table-wrap--capped', className)}
      style={maxHeight ? { maxHeight } : undefined}
    >
      <table
        className={cx(
          'jrk-table',
          density !== 'default' && `jrk-table--${density}`,
          stickyFirst && 'jrk-table--sticky-first',
          zebra && 'jrk-table--zebra',
        )}
        aria-busy={loading || undefined}
      >
        {caption && (
          <caption className={cx(captionHidden && 'jrk-sr-only')}>{caption}</caption>
        )}
        <thead>
          <tr>
            {columns.map((col) => {
              const isSorted = sort?.key === col.key;
              return (
                <th
                  key={col.key}
                  scope="col"
                  style={col.width ? { width: col.width } : undefined}
                  className={cx(
                    col.numeric && !col.rowHeader && 'jrk-num',
                    col.align === 'center' && 'jrk-col-center',
                    col.align === 'start' && 'jrk-col-start',
                  )}
                  aria-sort={isSorted ? sort!.dir : undefined}
                >
                  {col.sortValue ? (
                    <button type="button" className="jrk-table__sort" onClick={() => toggleSort(col.key)}>
                      {col.header}
                      <svg viewBox="0 0 12 12" aria-hidden="true" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M6 9.5V2.5M3 5.5L6 2.5l3 3" />
                      </svg>
                    </button>
                  ) : (
                    col.header
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {loading &&
            Array.from({ length: 5 }, (_, i) => (
              <tr key={`sk-${i}`} className="jrk-table__skeleton">
                {columns.map((c) => (
                  <td key={c.key}>
                    <span className="jrk-skeleton" style={{ width: c.numeric ? '40%' : '70%' }} />
                  </td>
                ))}
              </tr>
            ))}

          {showEmpty && (
            <tr>
              <td colSpan={columns.length}>{empty}</td>
            </tr>
          )}

          {!loading &&
            sorted.map((row, i) => {
              const key = rowKey(row, i);
              return (
                <tr
                  key={key}
                  className={cx(rowClassName?.(row, i))}
                  aria-selected={selectedKeys?.has(key) || undefined}
                  onClick={onRowClick ? () => onRowClick(row, i) : undefined}
                  style={onRowClick ? { cursor: 'pointer' } : undefined}
                >
                  {columns.map((col) => {
                    const content = col.cell
                      ? col.cell(row, i)
                      : String((row as Record<string, unknown>)[col.key] ?? '');
                    const cls = cx(
                      col.numeric && !col.rowHeader && 'jrk-num',
                      col.align === 'center' && 'jrk-col-center',
                      // `start` was in the type and in none of the output: the union
                      // offers two alignments and the renderer emitted a class for
                      // one, so a prose column that asked to start silently centred
                      // and the caller had no way to tell the prop from a no-op.
                      col.align === 'start' && 'jrk-col-start',
                    );
                    // `scope="row"` is the whole point of the flag — without it a
                    // <th> in the body is just a bold cell and announces nothing.
                    return col.rowHeader ? (
                      <th key={col.key} scope="row" className={cls}>
                        {content}
                      </th>
                    ) : (
                      <td key={col.key} className={cls}>
                        {content}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
        </tbody>
      </table>
      {footer && <div className="jrk-table-footer">{footer}</div>}
    </div>
  );
}

/** Magnitude inside a cell. The number stays visible beside the bar — the bar
 *  is a second encoding of a value the reader can still read. */
export function CellBar({ value, max, format }: { value: number; max: number; format?: (n: number) => string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <span className="jrk-cell-bar">
      <span className="jrk-cell-bar__track" aria-hidden="true">
        <span className="jrk-cell-bar__fill" style={{ width: `${pct}%` }} />
      </span>
      <span className="jrk-cell-bar__value">{format ? format(value) : value.toLocaleString()}</span>
    </span>
  );
}

/* ------------------------- signed values in a cell ------------------------- */

/** Signed value -> which diverging step, 1..4.
 *
 *  `max` is the largest ABSOLUTE value across the whole set being compared, and
 *  it is a required prop rather than something derived per cell on purpose: two
 *  cells in one table with different numbers must never get the same colour.
 *  Pass the same `max` to every cell in the table (and to <HeatLegend>).
 *  Returns null at exactly zero — the midpoint takes no fill. */
export function divergingStep(value: number, max: number): { arm: 'neg' | 'pos'; step: 1 | 2 | 3 | 4 } | null {
  if (!value || !max) return null;
  const ratio = Math.min(Math.abs(value) / Math.abs(max), 1);
  const step = Math.min(4, Math.max(1, Math.ceil(ratio * 4))) as 1 | 2 | 3 | 4;
  return { arm: value < 0 ? 'neg' : 'pos', step };
}

/** Signed magnitude as LENGTH from a centre axis. Use when the reader compares
 *  magnitudes down ONE column — length is the precise channel. For a whole grid
 *  of signed numbers use <CellHeat> instead; a grid of bars is unreadable. */
export function CellBarSigned({
  value,
  max,
  format,
}: {
  value: number;
  max: number;
  format?: (n: number) => string;
}) {
  const pct = max > 0 ? Math.min(100, (Math.abs(value) / max) * 100) : 0;
  const neg = value < 0;
  return (
    <span className="jrk-cell-bar jrk-cell-bar--signed">
      <span className="jrk-cell-bar__track" aria-hidden="true">
        <span
          className={cx('jrk-cell-bar__fill', neg ? 'jrk-cell-bar__fill--neg' : 'jrk-cell-bar__fill--pos')}
          style={{ width: `${pct / 2}%` }}
        />
      </span>
      <span className="jrk-cell-bar__value">{format ? format(value) : value.toLocaleString()}</span>
    </span>
  );
}

/** A table cell tinted by signed value. Use for a GRID the reader scans to find
 *  where a problem is; the exact figure is read after landing on a cell.
 *
 *  Spread the returned props onto a <td>. The value is ALWAYS rendered as text:
 *  the tint is the second channel, never the only one, and at step 1 the two
 *  arms are deliberately faint. */
export function cellHeatProps(value: number, max: number) {
  const d = divergingStep(value, max);
  return {
    className: cx('jrk-cell-heat', d ? `jrk-cell-heat--${d.arm}-${d.step}` : 'jrk-cell-heat--zero'),
  };
}

/** The magnitude legend. A tint means nothing without its range printed —
 *  the same obligation a chart legend carries for identity. `max` must be the
 *  one passed to the cells. */
export function HeatLegend({ max, format }: { max: number; format?: (n: number) => string }) {
  const fmt = format ?? ((n: number) => n.toLocaleString());
  const steps = [4, 3, 2, 1] as const;
  return (
    <div className="jrk-heat-legend">
      <span>{fmt(-max)}</span>
      <span className="jrk-heat-legend__swatches" aria-hidden="true">
        {steps.map((s) => (
          <span key={`n${s}`} className="jrk-heat-legend__swatch" style={{ background: `var(--jrk-chart-div-neg-${s})` }} />
        ))}
        {([1, 2, 3, 4] as const).map((s) => (
          <span key={`p${s}`} className="jrk-heat-legend__swatch" style={{ background: `var(--jrk-chart-div-pos-${s})` }} />
        ))}
      </span>
      <span>{fmt(max)}</span>
    </div>
  );
}
