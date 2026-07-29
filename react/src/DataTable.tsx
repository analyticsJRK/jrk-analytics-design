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
  density?: 'compact' | 'default' | 'comfortable';
  /** Freezes the first column while the table scrolls sideways. */
  stickyFirst?: boolean;
  zebra?: boolean;
  loading?: boolean;
  /** Shown when `rows` is empty and not loading. Always supply one. */
  empty?: ReactNode;
  onRowClick?: (row: Row, index: number) => void;
  selectedKeys?: ReadonlySet<string>;
  footer?: ReactNode;
  className?: string;
}

export function DataTable<Row>({
  columns,
  rows,
  rowKey,
  caption,
  density = 'default',
  stickyFirst,
  zebra,
  loading,
  empty,
  onRowClick,
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
    <div className={cx('jrk-table-wrap', className)}>
      <table
        className={cx(
          'jrk-table',
          density !== 'default' && `jrk-table--${density}`,
          stickyFirst && 'jrk-table--sticky-first',
          zebra && 'jrk-table--zebra',
        )}
        aria-busy={loading || undefined}
      >
        {caption && <caption>{caption}</caption>}
        <thead>
          <tr>
            {columns.map((col) => {
              const isSorted = sort?.key === col.key;
              return (
                <th
                  key={col.key}
                  scope="col"
                  style={col.width ? { width: col.width } : undefined}
                  className={cx(col.numeric && 'jrk-num', col.align === 'center' && 'jrk-col-center')}
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
                  aria-selected={selectedKeys?.has(key) || undefined}
                  onClick={onRowClick ? () => onRowClick(row, i) : undefined}
                  style={onRowClick ? { cursor: 'pointer' } : undefined}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cx(col.numeric && 'jrk-num', col.align === 'center' && 'jrk-col-center')}
                    >
                      {col.cell ? col.cell(row, i) : String((row as Record<string, unknown>)[col.key] ?? '')}
                    </td>
                  ))}
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
