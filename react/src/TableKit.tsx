import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, KeyboardEvent, MouseEvent, ReactNode } from 'react';
import { cx } from './utils';
import { Icon } from './Icon';
import { Menu, MenuItem } from './Menu';
import { ColumnFilter } from './ColumnFilter';
import { usd } from './money';
import {
  decodeFilter, encodeFilter, inferKind, listItems, parseDate, parseNumber, passes, readCell, tagOptions,
  valueOptions,
} from './filterCore';
import type { CellValue, FilterKind, FilterState } from './filterCore';

/* The full data table: every behaviour a working list needs, from rows of data and a column list.
 * Upstreamed from the portal (components/TableKit.tsx), where some eighteen modules render their
 * lists through it.
 *
 *   Row numbers  a `#` column numbered over the rows on screen, renumbered after a sort or filter,
 *                frozen at the edge, with the row's NAME column frozen beside it.
 *   Sorting      click a heading: ascending, descending, cleared. Money, percentages and dates sort
 *                as VALUES; blanks go last in both directions.
 *   Filtering    a search across every column, and a funnel on each heading opening the filter that
 *                fits the column (<ColumnFilter>): a checklist with counts, min/max, a date range,
 *                or "contains".
 *   Count        "Showing 12 of 35"; Clear filters resets the search and every funnel.
 *   Totals       a column marked `total: 'sum'` gets a footer that FOLLOWS the filter.
 *   Export       CSV, built in; Excel through `onExport`, handed exactly what is on screen — the same
 *                filters, sort, columns and row numbers, figures as rounded numbers, dates as dates.
 *   Empty        "No rows match these filters" with a Clear button, never confused with no data.
 *   Groups       optional collapsible column groups; a collapsed group keeps one summary column.
 *   Rows open    optional child rows in the table's own columns and a full-width detail, both of
 *                which slide (table.css "rows that open").
 *
 * THE VIEW (sort, search, filters, collapsed groups) IS PLAIN DATA, so it can live anywhere. Left
 * alone, the table holds it. Given `view` + `onViewChange` it is controlled — that is how a consumer
 * keeps it in the address bar so a filtered table can be sent to someone. Filters are stored
 * ENCODED (`encodeFilter`), one string per column, precisely so that is a straight copy.
 *
 * NOTHING HERE DECIDES A FIGURE. Rows arrive as the API sent them; a column formats, sorts and
 * filters what it is given. */

/* ================================================================================================
   Column types and their formatting
   ================================================================================================ */

export type TableKitColType = 'text' | 'cat' | 'num' | 'int' | 'money' | 'pct' | 'in' | 'date';

/** The column types that hold a figure: they sort numerically, filter by min/max and total. */
export const TABLEKIT_NUMERIC: readonly TableKitColType[] = ['num', 'int', 'money', 'pct', 'in'];

const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const numeric = (t: TableKitColType | undefined) => TABLEKIT_NUMERIC.includes(t ?? 'text');

/** A value as a column of this type prints it. Money is whole dollars in the accounting form —
 *  a negative reads ($1,000), never -$1,000 (money.ts); a `pct` is a fraction (0.114 -> 11.4%). */
export function formatTableValue(type: TableKitColType | undefined, v: unknown, locale = 'en-US'): string {
  if (v === null || v === undefined || v === '') return '';
  if (typeof v === 'boolean') return v ? 'Yes' : 'No';
  switch (type) {
    case 'money': return isNum(v) ? usd(Math.round(v), 0, locale) : String(v);
    case 'pct': return isNum(v) ? `${(v * 100).toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%` : String(v);
    case 'in': return isNum(v) ? `${v.toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} in` : String(v);
    case 'int': return isNum(v) ? Math.round(v).toLocaleString(locale) : String(v);
    case 'num': return isNum(v) ? v.toLocaleString(locale, { maximumFractionDigits: 2 }) : String(v);
    case 'date': {
      // Read as a calendar date, not an instant: `new Date('2026-10-28')` is UTC midnight, which
      // is the 27th in every US time zone.
      const d = new Date(`${String(v).slice(0, 10)}T00:00:00`);
      return Number.isNaN(d.getTime()) ? String(v)
        : d.toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' });
    }
    default: return String(v);
  }
}

/* ---- export rules -------------------------------------------------------------------------------
 * A figure goes into a file as a NUMBER, rounded so float noise (34762.84926682957) never reaches a
 * spreadsheet. A workbook keeps a % as the fraction under a % format; a CSV has no formats, so its %
 * is in percent (11.4) and the unit moves into the header ("Snowfall (in)"). A date goes out as
 * YYYY-MM-DD, which Excel and a CSV reader both take as a date. */

export type TableKitExportKind = 'xlsx' | 'csv';

const round = (x: number, d: number) => Math.round(x * 10 ** d) / 10 ** d;

export function exportNumber(type: TableKitColType | undefined, v: unknown, kind: TableKitExportKind): number | null {
  if (!isNum(v)) return null;
  if (type === 'pct') return kind === 'csv' ? round(v * 100, 2) : round(v, 4);
  if (type === 'int') return Math.round(v);
  return round(v, 2);
}

const UNIT: Partial<Record<TableKitColType, string>> = { money: '$', pct: '%', in: 'in' };
/** A header that already names its unit ("Expected $/in", "% Over", "Trigger (in)") keeps it. */
const NAMES_UNIT: Partial<Record<TableKitColType, RegExp>> = { money: /\$/, pct: /%/, in: /\(in\)|inch/i };

export function exportHeader(label: string, type: TableKitColType | undefined, kind: TableKitExportKind): string {
  const unit = kind === 'csv' && type ? UNIT[type] : undefined;
  return unit && label && !NAMES_UNIT[type!]?.test(label) ? `${label} (${unit})` : label;
}

export function exportDate(v: unknown): string | null {
  const m = /^(\d{4}-\d{2}-\d{2})/.exec(typeof v === 'string' ? v : '');
  return m ? m[1] : null;
}

/** Never part of a cell's value: the muted second line, screen-reader copy, a funnel's slot. */
const DROP_CLASSES = ['jrk-table__sub', 'jrk-sr-only', 'jrk-th__slot', 'jrk-th__funnel'];
/** A chip, badge, tag or pill: secondary beside a value, the value when it is all there is. */
const CHIP = /(^|[-_])(chip|badge|tag|pill)(s)?($|[-_])/;
/** A status glyph a cell leads with ("▲ Missed", "▸ 101", "■ Open"). */
const LEAD_GLYPH = /^[←-⇿■-◿☀-➿]️?\s*/;

const isChip = (el: Element) => String(typeof el.className === 'string' ? el.className : '')
  .split(/\s+/).some((c) => CHIP.test(c));

/** A rendered cell's text as the reader sees it: a field's value rather than every option in it, a
 *  ticked box as Yes/No, no icons, buttons or muted second line, a badge left out when it sits
 *  beside a value and kept (joined ", ") when it IS the value, the blank dash as empty. This is
 *  what a column with a custom `render` and no `plain` exports — "Per Push", never the code behind
 *  the chip. */
export function shownText(node: Node): string {
  const read = (secondary: boolean): string => {
    const walk = (n: Node): string => {
      if (n.nodeType === 3) return n.textContent ?? '';
      if (n.nodeType !== 1) return '';
      const el = n as Element;
      if (el.namespaceURI === 'http://www.w3.org/2000/svg') return '';
      if (DROP_CLASSES.some((c) => el.classList.contains(c))) return '';
      if (el.getAttribute?.('aria-hidden') === 'true') return '';
      const tag = el.tagName;
      if (tag === 'SELECT') return (el as HTMLSelectElement).selectedOptions?.[0]?.text ?? '';
      if (tag === 'INPUT') {
        const input = el as HTMLInputElement;
        if (input.type === 'checkbox' || input.type === 'radio') return input.checked ? 'Yes' : 'No';
        return input.value ?? '';
      }
      if (tag === 'TEXTAREA') return (el as HTMLTextAreaElement).value ?? '';
      const button = tag === 'BUTTON' || el.getAttribute?.('role') === 'button' || el.classList.contains('jrk-btn');
      if (!secondary && (button || isChip(el))) return '';
      let out = '';
      let lastChip = false;
      el.childNodes.forEach((c) => {
        const t = walk(c);
        if (!t) return;
        if (!t.trim()) {
          if (out && !/\s$/.test(out)) out += ' ';
          return;
        }
        const chip = c.nodeType === 1 && isChip(c as Element);
        if (out && chip && lastChip) out += ', ';
        else if (out && c.nodeType === 1 && !/\s$/.test(out) && !/^\s/.test(t)) out += ' ';
        out += t;
        lastChip = chip;
      });
      return out;
    };
    const t = walk(node).replace(/\s+/g, ' ').trim();
    return t === '✓' || t === '✔' ? 'Yes' : t.replace(LEAD_GLYPH, '');
  };
  const t = read(false) || read(true);
  return t === '—' ? '' : t;
}

/* ---- CSV ----------------------------------------------------------------------------------------
 * RFC 4180 quoting, CRLF, and a BOM so Excel reads UTF-8 rather than the local codepage. EXCEL GUESSES
 * A CSV CELL'S TYPE, so text it would change is written as a string formula (="0101"): a leading
 * zero, a code shaped like a date or fraction ("3-12" -> 12-Mar), more than 15 digits, scientific-
 * looking text, and anything starting = + - @ that is not a plain number (run as a formula). */

const MANGLED = /^0\d|^\d{1,4}[-/]\d{1,4}([-/]\d{1,4})?$|^\d{16,}$|^\d+(\.\d+)?[eE][+-]?\d+$/;
const FORMULA = /^[=+\-@\t\r]/;
const PLAIN_NUMBER = /^[+-]?\d+(\.\d+)?$/;

function excelSafe(text: string): string {
  if (PLAIN_NUMBER.test(text) && !/^[+-]?0\d/.test(text) && text.replace(/\D/g, '').length <= 15) return text;
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  if (!MANGLED.test(text) && !FORMULA.test(text)) return text;
  return text.length <= 250 ? `="${text.replace(/"/g, '""')}"` : ` ${text}`;
}

function csvCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  const text = typeof value === 'string' ? excelSafe(value) : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** Headers and rows as a CSV file's text, BOM and CRLF included. */
export function toCsv(headers: string[], rows: TableKitExportCell[][]): string {
  return `﻿${[headers.map(csvCell).join(','), ...rows.map((r) => r.map(csvCell).join(','))].join('\r\n')}\r\n`;
}

function download(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
  // Next tick, not now: Safari has not started reading the URL when click() returns.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

/* ================================================================================================
   Types
   ================================================================================================ */

export type TableKitExportCell = string | number | null;

export interface TableKitColumn<T> {
  key: string;
  /** The heading. An empty label is an actions column: no sort, no filter, no export header. */
  label: string;
  type?: TableKitColType;
  /** The raw value. Defaults to `row[key]`. */
  get?: (row: T) => unknown;
  /** What the cell shows. Defaults to the type's formatter. A render returning nothing draws the
   *  blank dash, unless the column is `noExport` (an actions column with nothing to offer). */
  render?: (value: any, row: T) => ReactNode;
  /** The text used for search, the checklist and export. Defaults to the formatted value. */
  plain?: (value: any, row: T) => string;
  /** A muted second line under the cell. Not searched, filtered or exported. */
  sub?: (row: T) => ReactNode;
  /** A footer total over the rows on screen. A column with no figure in it totals to a blank. */
  total?: 'sum';
  filter?: false;
  /** The filter this column gets. Defaults from its type: a checklist for `cat`, min/max for a
   *  figure, a range for a date, and for text whatever `inferKind` reads from the values. */
  filterKind?: FilterKind;
  sort?: false;
  /** Kept out of the export (an actions column, a chip with no meaning in a spreadsheet). */
  noExport?: boolean;
  /** What the file gets when it differs from what the column sorts by: a cell showing "7 / 8" that
   *  sorts by its share exports the share, as a %, under a header that says so. */
  exportAs?: { label?: string; type?: TableKitColType; get?: (row: T) => unknown };
  className?: string;
  /** A class for one cell, from its value — the cheapest quote in a row. */
  cellClass?: (value: any, row: T) => string | undefined;
  style?: (value: any, row: T) => CSSProperties | undefined;
  /** One line per cell. Default: true for figures and dates. */
  nowrap?: boolean;
  /** The heading's tooltip — what the column means, where the label cannot say. */
  title?: string;
  /** The `groups` entry this column sits under. A group's columns must be side by side. */
  group?: string;
}

/** A collapsible block of columns. The name column is never in one: it is frozen, and a frozen
 *  group caption would slide over the captions beside it. */
export interface TableKitGroup {
  key: string;
  label: string;
  /** The column kept on screen when the group is collapsed. Defaults to its first column. */
  summary?: string;
  /** Collapsed on first render. */
  closed?: boolean;
}

export interface TableKitSort {
  key: string;
  dir: 1 | -1;
}

/** Everything a reader can change, as data. `undefined` in any field means "the default": the
 *  table's `initialSort`, no search, no filters, each group's own `closed`. `sort: null` is an
 *  explicit "no sort" — the third click — and is not the same as an absent one. */
export interface TableKitView {
  sort?: TableKitSort | null;
  q?: string;
  /** Column key -> `encodeFilter` string. */
  filters?: Record<string, string>;
  closed?: string[];
}

/** What changed, so a consumer can debounce typing and write the rest at once. */
export type TableKitViewCause = 'sort' | 'search' | 'filter' | 'group' | 'clear';

export interface TableKitExport {
  filename: string;
  /** The table's own name where it has one, for a sheet title. */
  title: string;
  headers: string[];
  /** Exactly what is on screen: the filters, the sort, the row numbers. */
  rows: TableKitExportCell[][];
  /** Per column: 'int' | 'num' | 'money' | 'pct' | 'in' | 'date' | ''. The row number is 'int'. */
  formats: string[];
}

export interface TableKitProps<T> {
  /** Unique on the page. Prefixes the root's id (`tablekit-<id>`). */
  id?: string;
  title?: ReactNode;
  subtitle?: ReactNode;
  /** Plain-text name for the export's file and sheet. Defaults to the title, then `id`. */
  exportName?: string;
  rows: T[];
  columns: TableKitColumn<T>[];
  groups?: TableKitGroup[];
  initialSort?: TableKitSort;
  /** Stable row identity. Required for `selectedKey`, `openKeys`, `detail` and `childRows`. */
  rowKey?: (row: T, i: number) => string;
  /** A row that opens something. Enter on a focused row does the same. A click aimed at a button,
   *  link or field inside the row does that control's job and not this. */
  onRow?: (row: T) => void;
  rowClassName?: (row: T) => string | undefined;
  /** The row whose detail is open beside the table; gets `aria-selected`. */
  selectedKey?: string | null;
  /** A row's detail, drawn full width under it while its key is in `openKeys`. Returning null draws
   *  no detail row. */
  detail?: (row: T) => ReactNode;
  openKeys?: ReadonlySet<string>;
  /** Rows drawn under an open row in the table's OWN columns: `cells` maps a column key to what that
   *  column shows for the child. Drawn before `detail`. */
  childRows?: (row: T) => { key: string; cells: Record<string, ReactNode> }[];
  /** Given, each row that can open starts with a chevron in the `#` cell that calls this. */
  onToggle?: (row: T) => void;
  /** Whether a row can open. False: no chevron, and its children and detail never draw. */
  canOpen?: (row: T) => boolean;
  /** Toolbar controls after the export menu. */
  actions?: ReactNode;
  /** Shown when there are no rows at all — as opposed to none matching. */
  empty?: ReactNode;
  /** The scroll port's height, any CSS length. Written to `--jrk-table-height`, so it still prints
   *  in full. Use `useFitHeight` to end it at the window instead. */
  height?: string;
  /** Controlled view. Without it the table holds its own, starting from `defaultView`. */
  view?: TableKitView;
  defaultView?: TableKitView;
  onViewChange?: (next: TableKitView, cause: TableKitViewCause) => void;
  /** Told the rows on screen, filtered and sorted, whenever they change. For a "select all shown". */
  onView?: (rows: T[]) => void;
  /** Excel. The export menu offers a workbook only when this is given; CSV is always built in. A
   *  promise puts "Exporting…" in the toolbar until it settles, and its error message after. */
  onExport?: (kind: 'xlsx', data: TableKitExport) => void | Promise<void>;
  /** False hides the export menu. */
  exportable?: boolean;
  /** Numbers, dates and counts. Money stays dollars in every locale. */
  locale?: string;
  className?: string;
}

/* ================================================================================================
   The component
   ================================================================================================ */

const INTERACTIVE = 'a, button, input, select, textarea, label, summary, [role="button"]';
const NO_KEYS: ReadonlySet<string> = new Set();
const EMPTY_VIEW: TableKitView = {};
const NO_FILTERS: Record<string, string> = {};

/** How long a closing row slides: `--jrk-duration-base`, read off the table so the JS and the CSS
 *  cannot disagree, and 0 under reduced motion, where base.css zeroes the token. */
function slideMs(el: Element | null): number {
  if (!el) return 200;
  const raw = getComputedStyle(el).getPropertyValue('--jrk-duration-base').trim();
  const m = /^([\d.]+)(ms|s)$/.exec(raw);
  return m ? Number(m[1]) * (m[2] === 's' ? 1000 : 1) : 200;
}

function Slide({ children }: { children: ReactNode }) {
  return (
    <div className="jrk-table__slide">
      <div className="jrk-table__slide-in">{children}</div>
    </div>
  );
}

export function TableKit<T>(props: TableKitProps<T>) {
  const { id, columns, rows, locale = 'en-US', exportable = true } = props;

  // --- view: controlled or held here ------------------------------------------------------------
  const [held, setHeld] = useState<TableKitView>(props.defaultView ?? EMPTY_VIEW);
  const st = props.view ?? held;
  const update = (patch: TableKitView, cause: TableKitViewCause) => {
    const next = { ...st, ...patch };
    if (!props.view) setHeld(next);
    props.onViewChange?.(next, cause);
  };

  const sort: TableKitSort | null = st.sort === undefined ? props.initialSort ?? null : st.sort;
  const q = st.q ?? '';
  const filters = st.filters ?? NO_FILTERS;

  // --- closing rows slide up before they go -----------------------------------------------------
  // The keys that just left `openKeys` keep their rows a moment longer, marked `data-closing`.
  // Worked out DURING render, so the rows never vanish for a frame before the slide starts.
  const [seenOpen, setSeenOpen] = useState(props.openKeys);
  const [closing, setClosing] = useState<ReadonlySet<string>>(NO_KEYS);
  if (props.openKeys !== seenOpen) {
    const gone = seenOpen ? [...seenOpen].filter((k) => !props.openKeys?.has(k)) : [];
    setSeenOpen(props.openKeys);
    if (gone.length) setClosing(new Set([...closing, ...gone]));
  }
  const tableEl = useRef<HTMLTableElement>(null);
  useEffect(() => {
    if (!closing.size) return;
    const t = window.setTimeout(() => setClosing(NO_KEYS), slideMs(tableEl.current));
    return () => window.clearTimeout(t);
  }, [closing]);

  // --- column groups: a collapsed group keeps its summary column; the name column never hides --
  const groups = props.groups ?? [];
  const groupOf = new Map(groups.map((g) => [g.key, g]));
  const closed = new Set(st.closed ?? groups.filter((g) => g.closed).map((g) => g.key));
  const summaryOf = (g: string) => groupOf.get(g)?.summary ?? columns.find((c) => c.group === g)?.key;
  const visible = columns.filter((c, j) => j === 0 || !c.group || !groupOf.has(c.group) || !closed.has(c.group)
    || c.key === summaryOf(c.group));
  const spans: { key: string; group?: TableKitGroup; n: number }[] = [];
  for (const c of visible.slice(1)) {
    const g = c.group ? groupOf.get(c.group) : undefined;
    const last = spans[spans.length - 1];
    if (last && last.group === g) last.n += 1;
    else spans.push({ key: g ? g.key : `_${c.key}`, group: g, n: 1 });
  }
  const toggleGroup = (k: string) => {
    const next = new Set(closed);
    if (next.has(k)) next.delete(k);
    else next.add(k);
    update({ closed: [...next] }, 'group');
  };

  // --- reading cells ----------------------------------------------------------------------------
  const raw = useCallback((c: TableKitColumn<T>, r: T) => (c.get ? c.get(r) : (r as Record<string, unknown>)[c.key]), []);
  const text = useCallback((c: TableKitColumn<T>, r: T): string => {
    const v = raw(c, r);
    if (c.plain) return c.plain(v, r) ?? '';
    return formatTableValue(c.type, v, locale);
  }, [raw, locale]);

  /* The filter each column gets, and a cell read the way a filter tests it: its shown text, its
     figure (the raw number where there is one) and its date. */
  const kindOf = useMemo(() => {
    const m = new Map<string, FilterKind>();
    for (const c of columns) {
      m.set(c.key, c.filterKind ?? (c.type === 'cat' ? 'values'
        : numeric(c.type) ? 'number'
          : c.type === 'date' ? 'date'
            : inferKind(rows.map((r) => readCell(text(c, r))))));
    }
    return m;
  }, [columns, rows, text]);
  const cellOf = useCallback((c: TableKitColumn<T>, r: T): CellValue => {
    const v = raw(c, r);
    const shown = readCell(text(c, r));
    return {
      text: shown.text,
      num: isNum(v) ? v : shown.num ?? parseNumber(String(v ?? '')),
      date: c.type === 'date' && v ? parseDate(String(v)) ?? String(v).slice(0, 10) : shown.date,
    };
  }, [raw, text]);
  /** Every value a column's checklist offers (each list item once, for a list column). */
  const universe = useCallback((c: TableKitColumn<T>) => {
    const vals = rows.map((r) => cellOf(c, r).text);
    return [...new Set(kindOf.get(c.key) === 'tags' ? vals.flatMap(listItems) : vals)];
  }, [rows, cellOf, kindOf]);
  const filterOf = useCallback((c: TableKitColumn<T>): FilterState | undefined => {
    const s = filters[c.key];
    if (!s) return undefined;
    return decodeFilter(s, kindOf.get(c.key) ?? 'text', /^[xy]:/.test(s) ? universe(c) : undefined);
  }, [filters, kindOf, universe]);
  const setFilter = (c: TableKitColumn<T>, next: FilterState | undefined) => {
    const f = { ...filters };
    if (next) f[c.key] = encodeFilter(next, universe(c));
    else delete f[c.key];
    update({ filters: f }, 'filter');
  };

  /** Passes the search and every filter but `skip`'s — a checklist counts against the others. */
  const passing = useCallback((skip?: string) => {
    const needle = q.trim().toLowerCase();
    const on = columns.flatMap((c) => {
      const f = c.key === skip ? undefined : filterOf(c);
      return f ? [[c, f] as const] : [];
    });
    return (r: T) => (!needle || columns.some((c) => text(c, r).toLowerCase().includes(needle)))
      && on.every(([c, f]) => passes(f, cellOf(c, r)));
  }, [q, columns, filterOf, text, cellOf]);

  const view = useMemo(() => {
    const out = rows.filter(passing());
    const c = sort ? columns.find((x) => x.key === sort.key) : undefined;
    if (sort && c) {
      out.sort((a, b) => {
        const x = raw(c, a);
        const y = raw(c, b);
        const xe = x === null || x === undefined || x === '';
        const ye = y === null || y === undefined || y === '';
        // Blanks last in BOTH directions: a reversed sort that leads with forty empty cells hides
        // the figures the reader reversed it to see.
        if (xe && ye) return 0;
        if (xe) return 1;
        if (ye) return -1;
        if (numeric(c.type) && isNum(x) && isNum(y)) return (x - y) * sort.dir;
        if (c.type === 'date') return String(x).localeCompare(String(y)) * sort.dir;
        return text(c, a).localeCompare(text(c, b), locale, { numeric: true }) * sort.dir;
      });
    }
    return out;
  }, [rows, columns, passing, sort, raw, text, locale]);

  /* Reported only when the rows on screen actually change. `view` is rebuilt whenever a caller
     passes new `columns`, which most do every render; reporting each rebuild loops through the
     caller's own setState. */
  const { onView } = props;
  const reported = useRef<T[] | null>(null);
  useEffect(() => {
    const last = reported.current;
    if (last && last.length === view.length && last.every((r, i) => r === view[i])) return;
    reported.current = view;
    onView?.(view);
  }, [view, onView]);

  const anyFilter = !!q || Object.values(filters).some(Boolean);
  const clearAll = () => update({ q: '', filters: {} }, 'clear');
  const hasTotal = visible.some((c) => c.total === 'sum');
  const [busy, setBusy] = useState<string | null>(null);
  const body = useRef<HTMLTableSectionElement>(null);

  const titleText = typeof props.title === 'string' ? props.title : undefined;
  const fileName = props.exportName ?? titleText ?? id ?? 'table';

  // --- export: exactly what is on screen ---------------------------------------------------------
  const collect = (kind: TableKitExportKind): TableKitExport => {
    // `exportAs` replaces a column's label, type and value in the file, and the screen's text with it.
    const cols: TableKitColumn<T>[] = visible.filter((c) => !c.noExport).map((c) => (c.exportAs ? {
      ...c, label: c.exportAs.label ?? c.label, type: c.exportAs.type ?? c.type, get: c.exportAs.get ?? c.get,
      plain: undefined, render: undefined,
    } : c));
    const headers = ['#', ...cols.map((c) => exportHeader(c.label, c.type, kind))];
    // The rendered rows in screen order. Child and detail rows belong to the row above them.
    const trs = [...(body.current?.rows ?? [])].filter((tr) => tr.dataset.kind === 'row');
    const shown = (i: number, c: TableKitColumn<T>) => {
      const td = trs[i]?.querySelector(`:scope > td[data-col="${CSS.escape(c.key)}"]`);
      return td ? shownText(td) : null;
    };
    const cell = (c: TableKitColumn<T>, r: T, i: number): TableKitExportCell => {
      const v = raw(c, r);
      if (numeric(c.type)) {
        const n = exportNumber(c.type, v, kind);
        if (n !== null) return n;
        // A figure column showing words instead ("needs both quotes") exports the words.
        return v === null || v === undefined || v === '' ? null : (shown(i, c) || null);
      }
      if (c.type === 'date') {
        const d = exportDate(v);
        if (d) return d;
      }
      // From the data where the screen shortens it: a yes/no as Yes/No (the screen may draw a
      // tick), a list in full (the screen may show "101, …, 106 +12 more").
      if (!c.plain && typeof v === 'boolean') return v ? 'Yes' : 'No';
      if (!c.plain && Array.isArray(v) && v.length && v.every((x) => ['string', 'number'].includes(typeof x))) {
        return v.join(', ');
      }
      const t = c.plain ? text(c, r) : c.render ? (shown(i, c) ?? text(c, r)) : text(c, r);
      return t === '' ? null : t;
    };
    return {
      filename: fileName,
      title: (titleText ?? fileName).slice(0, 30),
      headers,
      rows: view.map((r, i) => [i + 1, ...cols.map((c) => cell(c, r, i))]),
      formats: ['int', ...cols.map((c) => (c.type && c.type !== 'text' && c.type !== 'cat' ? c.type : ''))],
    };
  };

  const exportCsv = () => {
    const data = collect('csv');
    download(`${data.filename}.csv`, new Blob([toCsv(data.headers, data.rows)], { type: 'text/csv;charset=utf-8' }));
  };
  const exportXlsx = async () => {
    if (!props.onExport) return;
    setBusy('Exporting…');
    try {
      await props.onExport('xlsx', collect('xlsx'));
      setBusy(null);
    } catch (e) {
      setBusy(e instanceof Error ? e.message : 'Export failed.');
    }
  };

  // --- rendering --------------------------------------------------------------------------------
  const cellNode = (c: TableKitColumn<T>, r: T) => {
    const v = raw(c, r);
    if (c.render) {
      const out = c.render(v, r);
      if ((out === null || out === undefined || out === false || out === '') && !c.noExport) {
        return <span className="jrk-table__blank">—</span>;
      }
      return out;
    }
    const t = formatTableValue(c.type, v, locale);
    return t === '' ? <span className="jrk-table__blank">—</span> : t;
  };

  const sortBy = (k: string) => {
    if (!sort || sort.key !== k) update({ sort: { key: k, dir: 1 } }, 'sort');
    else if (sort.dir === 1) update({ sort: { key: k, dir: -1 } }, 'sort');
    else update({ sort: null }, 'sort');
  };

  /* A row opens on a click or Enter that is the ROW's own — not one aimed at a control inside it,
     which used to open the row as well as doing its own job. */
  const fromInside = (e: MouseEvent | KeyboardEvent) => {
    const hit = (e.target as HTMLElement).closest(INTERACTIVE);
    return !!hit && hit !== e.currentTarget && (e.currentTarget as HTMLElement).contains(hit);
  };

  const cellClass = (c: TableKitColumn<T>, j: number, extra?: string) => {
    const num = numeric(c.type);
    const nowrap = c.nowrap ?? (num || c.type === 'date');
    return cx(
      num && 'jrk-num',
      nowrap && 'jrk-table__nowrap',
      j === 0 && 'jrk-table__lead',
      c.className,
      extra,
    ) || undefined;
  };

  const expands = Boolean((props.detail || props.childRows) && props.rowKey);
  const twist = Boolean(props.onToggle && expands);
  const searchName = titleText ?? 'this table';
  const n = (x: number) => x.toLocaleString(locale);
  const wrapStyle = props.height ? ({ '--jrk-table-height': props.height } as CSSProperties) : undefined;

  return (
    <div className={cx('jrk-tablekit', props.className)} id={id ? `tablekit-${id}` : undefined}>
      <div className="jrk-tablekit__bar">
        {props.title ? (
          <div className="jrk-tablekit__title">
            {props.title}
            {props.subtitle ? <small className="jrk-tablekit__subtitle">{props.subtitle}</small> : null}
          </div>
        ) : null}
        <span className="jrk-tablekit__count" aria-live="polite">
          {view.length === rows.length
            ? `${n(rows.length)} row${rows.length === 1 ? '' : 's'}`
            : `Showing ${n(view.length)} of ${n(rows.length)}`}
        </span>
        <input
          className="jrk-input jrk-input--sm jrk-tablekit__search"
          type="search"
          placeholder="Search"
          value={q}
          aria-label={`Search ${searchName}`}
          onChange={(e) => update({ q: e.target.value }, 'search')}
        />
        {anyFilter ? (
          <button type="button" className="jrk-btn jrk-btn--sm jrk-btn--primary" onClick={clearAll}>
            Clear filters
          </button>
        ) : null}
        {exportable ? (
          <Menu label="Export" variant="ghost" size="sm" leadingIcon={<Icon name="download" />}>
            {props.onExport ? (
              <MenuItem onSelect={exportXlsx}>
                Excel workbook <small className="jrk-tablekit__ext">.xlsx</small>
              </MenuItem>
            ) : null}
            <MenuItem onSelect={exportCsv}>
              CSV <small className="jrk-tablekit__ext">.csv</small>
            </MenuItem>
          </Menu>
        ) : null}
        {busy ? <span className="jrk-tablekit__busy" role="status">{busy}</span> : null}
        {props.actions ? <span className="jrk-tablekit__actions">{props.actions}</span> : null}
      </div>
      <div className="jrk-table-wrap jrk-tablekit__scroll" style={wrapStyle}>
        <table
          ref={tableEl}
          className={cx(
            'jrk-table',
            'jrk-table--numbered',
            twist && 'jrk-table--expandable',
            groups.length > 0 && 'jrk-table--grouped',
          )}
        >
          {titleText ? <caption className="jrk-sr-only">{titleText}</caption> : null}
          <thead>
            {groups.length ? (
              <tr className="jrk-table__grouprow">
                {/* The frozen corner over # and the name column: no caption, no control. */}
                <th className="jrk-table__corner" colSpan={2} aria-hidden="true" />
                {spans.map((s) => {
                  if (!s.group) return <th key={s.key} colSpan={s.n} aria-hidden="true" />;
                  const g = s.group;
                  const open = !closed.has(g.key);
                  const all = columns.filter((c) => c.group === g.key).length;
                  return (
                    <th key={s.key} colSpan={s.n} scope="colgroup">
                      <button
                        type="button"
                        className="jrk-table__group-toggle"
                        aria-expanded={open}
                        title={open ? `Collapse ${g.label}` : `Show all ${all} ${g.label} columns`}
                        onClick={() => toggleGroup(g.key)}
                      >
                        <span className="jrk-table__group-twist" aria-hidden="true">{open ? '−' : '+'}</span>
                        <span>{g.label}</span>
                        {!open && all > 1 ? <span className="jrk-table__group-count">+{all - 1}</span> : null}
                      </button>
                    </th>
                  );
                })}
              </tr>
            ) : null}
            <tr className="jrk-table__colrow">
              <th scope="col" className="jrk-table__rn" title="Row number">#</th>
              {visible.map((c, j) => {
                const sorted = sort?.key === c.key;
                const label = c.label || <span className="jrk-sr-only">Actions</span>;
                // An actions column (kept out of the export) has nothing to filter.
                const filterable = c.filter !== false && !!c.label && !c.noExport;
                return (
                  <th
                    key={c.key}
                    scope="col"
                    className={cx(
                      numeric(c.type) && 'jrk-num',
                      j === 0 && 'jrk-table__lead',
                      filterable && 'jrk-th--filter',
                    ) || undefined}
                    title={c.title}
                    aria-sort={sorted ? (sort!.dir > 0 ? 'ascending' : 'descending') : undefined}
                  >
                    {c.sort === false || !c.label ? label : (
                      <button type="button" className="jrk-table__sort" onClick={() => sortBy(c.key)}>
                        {label}
                        <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" aria-hidden="true">
                          <path d="M6 9.5V2.5M3 5.5 6 2.5l3 3" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                    )}
                    {filterable ? (
                      <ColumnFilter
                        label={c.label}
                        kind={kindOf.get(c.key) ?? 'text'}
                        value={filterOf(c)}
                        locale={locale}
                        onChange={(next) => setFilter(c, next)}
                        options={() => {
                          const others = passing(c.key);
                          const all = rows.map((r) => cellOf(c, r).text);
                          const counted = rows.filter(others).map((r) => cellOf(c, r).text);
                          return kindOf.get(c.key) === 'tags' ? tagOptions(all, counted) : valueOptions(all, counted);
                        }}
                        dateBounds={() => {
                          const ds = rows.map((r) => cellOf(c, r).date).filter(Boolean).sort() as string[];
                          return [ds[0] ?? '', ds[ds.length - 1] ?? ''];
                        }}
                      />
                    ) : null}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody ref={body}>
            {view.length ? view.map((r, i) => {
              const k = props.rowKey ? props.rowKey(r, i) : String(i);
              const opens = expands && (props.canOpen ? props.canOpen(r) : true);
              const open = Boolean(opens && props.openKeys?.has(k));
              // Just closed: its rows stay a moment longer to slide up.
              const shut = Boolean(opens && !open && closing.has(k));
              const drawn = open || shut;
              const detailNode = drawn && props.detail ? props.detail(r) : null;
              return (
                <Fragment key={k}>
                  <tr
                    data-kind="row"
                    aria-selected={props.selectedKey != null && props.rowKey ? k === props.selectedKey : undefined}
                    aria-expanded={opens ? open : undefined}
                    className={cx(props.onRow && 'jrk-table__row--click', props.rowClassName?.(r)) || undefined}
                    tabIndex={props.onRow ? 0 : undefined}
                    onClick={props.onRow ? (e) => { if (!fromInside(e)) props.onRow!(r); } : undefined}
                    onKeyDown={props.onRow ? (e) => {
                      if (e.key === 'Enter' && e.target === e.currentTarget) props.onRow!(r);
                    } : undefined}
                  >
                    <td className="jrk-table__rn">
                      {twist && opens ? (
                        <button
                          type="button"
                          className="jrk-table__twist"
                          aria-expanded={open}
                          aria-label={`${open ? 'Close' : 'Open'} row ${i + 1}`}
                          onClick={() => props.onToggle!(r)}
                        >
                          <Icon name="chevronRight" />
                        </button>
                      ) : twist ? <span className="jrk-table__twist jrk-table__twist--none" aria-hidden="true" /> : null}
                      {n(i + 1)}
                    </td>
                    {visible.map((c, j) => (
                      <td
                        key={c.key}
                        data-col={c.key}
                        className={cellClass(c, j, cx(
                          j === 0 && (c.type === 'text' || !c.type) && 'jrk-table__lead--text',
                          c.cellClass?.(raw(c, r), r),
                        ))}
                        style={c.style?.(raw(c, r), r)}
                      >
                        {cellNode(c, r)}
                        {c.sub ? <span className="jrk-table__sub">{c.sub(r)}</span> : null}
                      </td>
                    ))}
                  </tr>
                  {drawn && props.childRows ? props.childRows(r).map((child) => (
                    <tr
                      key={child.key}
                      className="jrk-table__child"
                      data-closing={shut || undefined}
                      aria-hidden={shut || undefined}
                    >
                      <td className="jrk-table__rn" />
                      {visible.map((c, j) => (
                        <td key={c.key} data-col={c.key} className={cellClass(c, j)}>
                          <Slide>{child.cells[c.key] ?? null}</Slide>
                        </td>
                      ))}
                    </tr>
                  )) : null}
                  {detailNode !== null && detailNode !== undefined && detailNode !== false ? (
                    <tr className="jrk-table__detail" data-closing={shut || undefined} aria-hidden={shut || undefined}>
                      <td className="jrk-table__rn" />
                      <td colSpan={visible.length}><Slide>{detailNode}</Slide></td>
                    </tr>
                  ) : null}
                </Fragment>
              );
            }) : (
              <tr className="jrk-tablekit__empty-row">
                <td className="jrk-table__rn" />
                <td colSpan={visible.length}>
                  <div className="jrk-tablekit__empty">
                    {rows.length ? (
                      <>
                        No rows match these filters.{' '}
                        <button type="button" className="jrk-btn jrk-btn--sm jrk-btn--ghost" onClick={clearAll}>
                          Clear filters
                        </button>
                      </>
                    ) : (props.empty ?? 'Nothing here yet.')}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
          {hasTotal && view.length ? (
            <tfoot>
              <tr>
                <td className="jrk-table__rn" />
                {visible.map((c, j) => {
                  if (c.total === 'sum') {
                    // A column with no figure in it totals to a blank, never $0.
                    const nums = view.map((r) => raw(c, r)).filter(isNum);
                    const s = nums.reduce((a, v) => a + v, 0);
                    return (
                      <td key={c.key} className={cx('jrk-num', 'jrk-table__nowrap', j === 0 && 'jrk-table__lead')}>
                        {nums.length ? formatTableValue(c.type ?? 'num', s, locale) : <span className="jrk-table__blank">—</span>}
                      </td>
                    );
                  }
                  return (
                    <td key={c.key} className={j === 0 ? 'jrk-table__lead' : undefined}>
                      {j === 0 ? `Total (${n(view.length)})` : ''}
                    </td>
                  );
                })}
              </tr>
            </tfoot>
          ) : null}
        </table>
      </div>
    </div>
  );
}
