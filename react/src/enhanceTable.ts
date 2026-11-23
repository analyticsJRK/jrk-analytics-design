import type { ColumnFilterProps } from './ColumnFilter';
import {
  inferKind, isActive, isBlankText, parseDate, parseNumber, passes, readCell, tagOptions, valueOptions,
} from './filterCore';
import type { CellValue, FilterKind, FilterState } from './filterCore';

/* Sort and column filters over a table that is ALREADY RENDERED — markup this library did not draw,
 * a server-rendered report, a table whose columns are not known to any code. Upstreamed, trimmed,
 * from the portal (components/table/domTable.tsx + TableEnhancer.tsx), which runs it over every
 * data table on every page so a table needs no column map to sort and filter.
 *
 *   const t = enhanceTable(tableEl, { renderFilter, unmountFilter });
 *   …
 *   t.destroy();
 *
 * WHAT IT DOES TO THE DOM, all of it undone by `destroy()`:
 *   - a usable heading becomes a sort control (`.jrk-th--sortable`, `tabindex`, `aria-sort`);
 *   - a filterable heading gets `.jrk-th--filter` and an appended `span.jrk-th__slot`, which
 *     `renderFilter` fills with a <ColumnFilter>;
 *   - rows failing the search or a filter get `hidden` (table.css keeps them hidden); none is
 *     removed, so React keeps its own nodes;
 *   - sorting re-appends rows in order; "no sort" restores the order they came in.
 * A row matching `pinned` (a total) is never moved or hidden, and `tfoot` is left alone.
 *
 * NO REACT, DELIBERATELY — and so no funnel of its own. The library does not depend on react-dom,
 * and the funnel is a React control. `renderFilter(slot, props)` is called with the props for each
 * column's <ColumnFilter> whenever they change; a React app renders into the slot with its own
 * `createRoot` or `createPortal`. Without it the table still sorts, and `setFilter` / `setQuery`
 * drive the filters from the caller's own controls.
 *
 * IN A REACT APP, CALL IT AFTER HYDRATION — from a `useEffect`, on a table React has finished with.
 * A class or a slot added to server-rendered markup before React hydrates it is a hydration
 * mismatch, and React throws the subtree away. (The portal detected hydration by sniffing React's
 * private fiber keys; a library cannot depend on those, so the caller says when.) Rows CAN change
 * afterwards: a MutationObserver re-applies the reader's sort and filters to whatever arrived, and
 * is disconnected while this file moves rows so it never answers itself. */

export interface EnhancedColumn {
  /** The leaf column's index, counting colspans. */
  index: number;
  cell: HTMLTableCellElement;
  label: string;
  kind: FilterKind;
  /** Where the funnel renders; null for a column with nothing to filter. */
  slot: HTMLElement | null;
}

export interface EnhanceTableState {
  /** Rows on screen against rows in the table, while a search or a filter is on. */
  matched: { shown: number; total: number } | null;
  filtering: boolean;
  sort: { column: number; dir: 1 | -1 } | null;
}

export interface EnhanceTableOptions {
  /** `auto` (the default) sorts unless the heading row already holds its own sort controls — a
   *  `.jrk-table__sort` button or an `aria-sort` it did not write — in which case the table keeps
   *  its sort and gets filters only. */
  sort?: boolean | 'auto';
  filters?: boolean;
  /** A search over every row's text; every word must appear somewhere on the row. */
  query?: string;
  defaultSort?: { column: number; dir?: 1 | -1 };
  /** Parts of a cell that are not its value: icons, screen-reader copy, the funnel's slot. */
  decor?: string;
  /** A muted second label inside a cell, read as "Name · label" rather than run into the name. */
  subLabel?: string;
  /** Rows never moved or hidden. */
  pinned?: string;
  /** A heading holding its own filter control, which gets no second one. */
  ownFilter?: string;
  /** Render a <ColumnFilter> with these props into `slot`. Called again whenever they change. */
  renderFilter?: (slot: HTMLElement, props: ColumnFilterProps) => void;
  /** Tear down what `renderFilter` put in `slot`. */
  unmountFilter?: (slot: HTMLElement) => void;
  /** Told the outcome after every pass — for a "Showing 7 of 43" beside the caller's own box. */
  onState?: (s: EnhanceTableState) => void;
  locale?: string;
}

export interface EnhancedTable {
  readonly columns: readonly EnhancedColumn[];
  setQuery(q: string): void;
  setFilter(column: number, next: FilterState | undefined): void;
  clearFilters(): void;
  setSort(next: { column: number; dir: 1 | -1 } | null): void;
  /** Re-read the headings and rows, e.g. after the caller replaced the table's columns. */
  refresh(): void;
  /** Undo everything: classes, slots, hidden rows, the original order. */
  destroy(): void;
}

/* ---- reading cells ----------------------------------------------------------------------------- */

const DECOR = 'svg, [aria-hidden="true"], .jrk-sr-only, [data-noexport], .jrk-th__slot, .jrk-filter';
const SUB_LABEL = '.jrk-table__sub';
const PINNED = '[data-nosort]';
const OWN_FILTER = '[aria-haspopup]:not(.jrk-th__slot *)';
const EMPTY_ATTR = 'data-jrk-empty';
const ORDER_ATTR = 'data-jrk-i';
const ACTION = 'button, .jrk-btn, [role="button"], input[type="checkbox"], input[type="radio"]';
const CONTROL = 'button, input, select, textarea, a, label, .jrk-filter';

/** Text a reader would copy out of a cell: no icon, no decorative pill, no funnel; a form control
 *  read as its value (a <select>'s text is every option it offers). */
function cellText(el: Element, decor: string, sub: string): string {
  if (!el.querySelector(`${decor}, input, select, textarea, ${sub}`)) {
    return (el.textContent ?? '').replace(/\s+/g, ' ').trim();
  }
  const clone = el.cloneNode(true) as HTMLElement;
  // "77 Park Avenue" over a muted "7PA" is two elements with no space between them, and read as
  // one run of text it is "77 Park Avenue7PA" in every checklist.
  clone.querySelectorAll(sub).forEach((n) => {
    const t = (n.textContent ?? '').trim();
    if (t) n.replaceWith(document.createTextNode(` · ${t} `));
  });
  // Read off the LIVE cell by position — a clone does not carry what was typed — before anything
  // is removed, or the positions would no longer line up.
  const live = el.querySelectorAll('input, select, textarea');
  clone.querySelectorAll('input, select, textarea').forEach((node, i) => {
    const src = live[i];
    let v = '';
    if (src instanceof HTMLSelectElement) v = src.selectedOptions[0]?.text ?? '';
    else if (src instanceof HTMLInputElement) {
      v = src.type === 'checkbox' || src.type === 'radio' ? (src.checked ? 'Yes' : 'No')
        : src.type === 'file' || src.type === 'hidden' ? '' : src.value;
    } else if (src instanceof HTMLTextAreaElement) v = src.value;
    node.replaceWith(document.createTextNode(v));
  });
  clone.querySelectorAll(decor).forEach((n) => n.remove());
  return (clone.textContent ?? '').replace(/\s+/g, ' ').trim();
}

/** The header cells that address ONE column, and the column each addresses, from the span grid —
 *  so a two-row header sorts on the leaf that was clicked. A spanning cell is not a control. */
function leafColumns(table: HTMLTableElement): Map<HTMLTableCellElement, number> {
  const rows = Array.from(table.tHead?.rows ?? []);
  const out = new Map<HTMLTableCellElement, number>();
  const grid: (HTMLTableCellElement | undefined)[][] = rows.map(() => []);
  rows.forEach((row, r) => {
    let c = 0;
    Array.from(row.cells).forEach((cell) => {
      while (grid[r][c] !== undefined) c += 1;
      for (let dr = 0; dr < (cell.rowSpan || 1); dr += 1) {
        for (let dc = 0; dc < (cell.colSpan || 1); dc += 1) {
          if (grid[r + dr]) grid[r + dr][c + dc] = cell;
        }
      }
      if ((cell.colSpan || 1) === 1 && !cell.hasAttribute('data-noexport')) out.set(cell, c);
      c += cell.colSpan || 1;
    });
  });
  return out;
}

/** The cell of `row` under leaf column `col`, honouring colspans; none where a span covers it. */
function cellAt(row: HTMLTableRowElement, col: number): HTMLTableCellElement | undefined {
  let c = 0;
  for (const cell of Array.from(row.cells)) {
    const span = cell.colSpan || 1;
    if (col < c + span) return span === 1 ? cell : undefined;
    c += span;
  }
  return undefined;
}

function compare(a: number | string | null, b: number | string | null, locale: string): number {
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return String(a).localeCompare(String(b), locale, { numeric: true });
}

/* ---- the controller ------------------------------------------------------------------------------ */

export function enhanceTable(table: HTMLTableElement, options: EnhanceTableOptions = {}): EnhancedTable {
  const decor = options.decor ?? DECOR;
  const sub = options.subLabel ?? SUB_LABEL;
  const pinnedSel = options.pinned ?? PINNED;
  const ownFilterSel = options.ownFilter ?? OWN_FILTER;
  const filtersOn = options.filters ?? true;
  const locale = options.locale ?? 'en-US';
  const head = table.tHead;

  const ownSort = !!head?.querySelector('.jrk-table__sort, [aria-sort]:not(.jrk-th--sortable)');
  const sortOn = options.sort === undefined || options.sort === 'auto' ? !ownSort : options.sort;

  let order = options.defaultSort ? { column: options.defaultSort.column, dir: options.defaultSort.dir ?? 1 } : null;
  let filters: Record<number, FilterState> = {};
  let query = options.query ?? '';
  let columns: EnhancedColumn[] = [];
  let emptyRow: HTMLTableRowElement | null = null;
  let frame = 0;
  let alive = true;
  /** Headings this file made focusable, so `destroy()` takes back only those. */
  const focusable = new Set<HTMLTableCellElement>();

  const text = (el: Element) => cellText(el, decor, sub);
  const pinned = (r: HTMLTableRowElement) => r.matches(pinnedSel) || r.hasAttribute(EMPTY_ATTR);
  const bodyRows = () => Array.from(table.tBodies).flatMap((b) => Array.from(b.rows)).filter((r) => !pinned(r));

  /** A cell as text, number and date. `data-sort` carries the raw figure where the screen prints a
   *  dressed one, so it is tried for the number first. Several badges are a list, not one phrase. */
  const valueOf = (cell: Element | undefined): CellValue => {
    if (!cell) return { text: '', num: null, date: null };
    const chips = cell.querySelectorAll('.jrk-badge, .jrk-tag');
    const v = readCell(chips.length > 1
      ? Array.from(chips).map((c) => (c.textContent ?? '').trim()).filter(Boolean).join(', ')
      : text(cell));
    const ds = (cell as HTMLElement).dataset ?? {};
    return { ...v, num: parseNumber(ds.sort ?? '') ?? v.num, date: parseDate(ds.sort ?? '') ?? v.date };
  };
  const sortKey = (cell: Element | undefined): number | string | null => {
    if (!cell) return null;
    const override = (cell as HTMLElement).dataset?.sort;
    const v = readCell(override && override.trim() ? override : text(cell));
    if (!v.text) return null;
    if (v.num !== null) return v.num;
    return v.date ?? v.text.toLowerCase();
  };
  /** A cell's data without its buttons and row pickers: an actions column is not data. */
  const dataText = (cell: Element) => {
    if (!cell.querySelector(ACTION)) return text(cell);
    const clone = cell.cloneNode(true) as Element;
    clone.querySelectorAll(ACTION).forEach((n) => n.remove());
    return text(clone);
  };
  const headText = (cell: Element) => {
    if (!cell.querySelector('input[type="checkbox"], input[type="radio"]')) return text(cell);
    const clone = cell.cloneNode(true) as Element;
    clone.querySelectorAll('input[type="checkbox"], input[type="radio"]').forEach((n) => n.remove());
    return text(clone);
  };

  /* ---- our own DOM writes never wake the observer ---- */
  const observer = new MutationObserver((records) => {
    const ours = (n: Node) => {
      const el = n instanceof Element ? n : n.parentElement;
      return !!el && (el.hasAttribute(EMPTY_ATTR) || !!el.closest(`.jrk-th__slot, [${EMPTY_ATTR}]`));
    };
    if (records.every((r) => ours(r.target)
      || (r.addedNodes.length + r.removedNodes.length > 0
        && [...Array.from(r.addedNodes), ...Array.from(r.removedNodes)].every(ours)))) return;
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => { if (alive) refresh(); });
  });
  const watch = () => {
    Array.from(table.tBodies).forEach((b) => observer.observe(b, { childList: true, subtree: true, characterData: true }));
  };
  const quietly = (fn: () => void) => {
    observer.disconnect();
    try { fn(); } finally { if (alive) watch(); }
  };

  /* ---- columns: each leaf heading, its slot, and the filter that fits its values ---- */
  const readColumns = () => {
    const rows = bodyRows();
    const next: EnhancedColumn[] = [];
    leafColumns(table).forEach((index, cell) => {
      const label = headText(cell);
      const own = !!cell.querySelector(ownFilterSel);
      const usable = label !== '' && rows.some((r) => {
        const c = cellAt(r, index);
        return !!c && !isBlankText(dataText(c));
      });
      if (sortOn) {
        cell.classList.toggle('jrk-th--sortable', usable);
        if (usable && !cell.hasAttribute('tabindex')) {
          cell.tabIndex = 0;
          focusable.add(cell);
        }
      }
      const want = filtersOn && usable && !own;
      let slot = cell.querySelector<HTMLElement>(':scope > .jrk-th__slot');
      if (want && !slot) {
        slot = document.createElement('span');
        slot.className = 'jrk-th__slot';
        cell.append(slot);
      }
      if (!want && slot) {
        options.unmountFilter?.(slot);
        slot.remove();
        slot = null;
      }
      cell.classList.toggle('jrk-th--filter', want);
      if (usable) {
        const kind = want ? inferKind(rows.map((r) => valueOf(cellAt(r, index)))) : 'text';
        next.push({ index, cell, label, slot: want ? slot : null, kind });
      }
    });
    columns = next;
  };

  /* ---- THE ONE PLACE ROWS MOVE OR HIDE: search, filters and sort applied together ---- */
  const apply = () => {
    const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const active = Object.entries(filters).filter(([, f]) => isActive(f)).map(([k, f]) => [Number(k), f] as const);
    let shown = 0;
    let total = 0;
    let firstBody: HTMLTableSectionElement | null = null;
    Array.from(table.tBodies).forEach((body) => {
      const rows = Array.from(body.rows).filter((r) => !r.hasAttribute(EMPTY_ATTR));
      rows.forEach((row, i) => { if (!row.hasAttribute(ORDER_ATTR)) row.setAttribute(ORDER_ATTR, String(i)); });
      const movable = rows.filter((r) => !pinned(r));
      if (movable.length && !firstBody) firstBody = body;
      movable.forEach((row) => {
        total += 1;
        const hit = words.every((w) => text(row).toLowerCase().includes(w))
          && active.every(([col, f]) => passes(f, valueOf(cellAt(row, col))));
        if (row.hidden === hit) row.hidden = !hit;
        if (hit) shown += 1;
      });
      if (!sortOn) return;
      const sorted = [...movable];
      if (order) {
        const o = order;
        const keys = new Map(sorted.map((r) => [r, sortKey(cellAt(r, o.column))]));
        sorted.sort((a, b) => {
          const av = keys.get(a) ?? null;
          const bv = keys.get(b) ?? null;
          // Blanks stay last in both directions.
          if (av === null || bv === null) return compare(av, bv, locale);
          return compare(av, bv, locale) * o.dir;
        });
      } else {
        sorted.sort((a, b) => Number(a.getAttribute(ORDER_ATTR)) - Number(b.getAttribute(ORDER_ATTR)));
      }
      // Only touch the DOM when the order actually differs.
      const current = Array.from(body.rows).filter((r) => !pinned(r));
      if (sorted.some((r, i) => r !== current[i])) sorted.forEach((row) => body.appendChild(row));
    });
    // The headings' own state, so the glyph and `aria-sort` cannot disagree with the order.
    if (sortOn) {
      columns.forEach((c) => {
        const on = order != null && order.column === c.index;
        c.cell.setAttribute('aria-sort', on ? (order!.dir === 1 ? 'ascending' : 'descending') : 'none');
        c.cell.classList.toggle('jrk-th--asc', on && order!.dir === 1);
        c.cell.classList.toggle('jrk-th--desc', on && order!.dir === -1);
      });
    }
    const filtering = active.length > 0;
    placeEmpty(total > 0 && shown === 0 && (filtering || words.length > 0) ? firstBody : null, filtering);
    options.onState?.({
      matched: words.length || filtering ? { shown, total } : null,
      filtering,
      sort: order,
    });
  };

  /** "No rows match", in place of an empty body that would read as a failed load. */
  const placeEmpty = (body: HTMLTableSectionElement | null, filtering: boolean) => {
    emptyRow?.remove();
    emptyRow = null;
    if (!body) return;
    const leafCount = Math.max(1, ...Array.from(leafColumns(table).values()).map((i) => i + 1));
    const tr = document.createElement('tr');
    tr.setAttribute(EMPTY_ATTR, '');
    tr.setAttribute('data-nosort', '');
    const td = document.createElement('td');
    td.colSpan = leafCount;
    td.className = 'jrk-tablekit__empty';
    td.append(`No rows match ${filtering ? 'these filters' : 'this search'}. `);
    if (filtering) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'jrk-btn jrk-btn--primary jrk-btn--sm';
      btn.textContent = 'Clear filters';
      btn.addEventListener('click', () => api.clearFilters());
      td.append(btn);
    }
    tr.append(td);
    body.append(tr);
    emptyRow = tr;
  };

  const rowsNow = () => bodyRows();
  const renderFunnels = () => {
    if (!options.renderFilter) return;
    columns.forEach((c) => {
      if (!c.slot) return;
      options.renderFilter!(c.slot, {
        label: c.label,
        kind: c.kind,
        value: filters[c.index],
        locale,
        onChange: (next) => api.setFilter(c.index, next),
        options: () => {
          const all = rowsNow();
          const others = all.filter((r) => Object.entries(filters).every(([k, f]) =>
            Number(k) === c.index || !isActive(f) || passes(f, valueOf(cellAt(r, Number(k))))));
          const t = (r: HTMLTableRowElement) => valueOf(cellAt(r, c.index)).text;
          return c.kind === 'tags' ? tagOptions(all.map(t), others.map(t)) : valueOptions(all.map(t), others.map(t));
        },
        dateBounds: () => {
          const ds = rowsNow().map((r) => valueOf(cellAt(r, c.index)).date).filter(Boolean).sort() as string[];
          return [ds[0] ?? '', ds[ds.length - 1] ?? ''];
        },
      });
    });
  };

  function refresh() {
    quietly(() => {
      readColumns();
      apply();
    });
    renderFunnels();
  }

  /* ---- sorting: a click or Enter/Space on a heading; a control inside it does its own job ---- */
  const activate = (e: Event) => {
    const target = e.target as HTMLElement | null;
    if (target?.closest(CONTROL)) return;
    const cell = target?.closest('th, td');
    const col = columns.find((c) => c.cell === cell);
    if (!col || !col.cell.classList.contains('jrk-th--sortable')) return;
    api.setSort(order && order.column === col.index
      ? (order.dir === 1 ? { column: col.index, dir: -1 } : null)
      : { column: col.index, dir: 1 });
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    if ((e.target as HTMLElement | null)?.closest(CONTROL)) return;
    e.preventDefault();
    activate(e);
  };
  if (sortOn && head) {
    head.addEventListener('click', activate);
    head.addEventListener('keydown', onKey);
  }

  const api: EnhancedTable = {
    get columns() { return columns; },
    setQuery(q) {
      query = q;
      quietly(apply);
    },
    setFilter(column, next) {
      const out = { ...filters };
      if (next && isActive(next)) out[column] = next;
      else delete out[column];
      filters = out;
      quietly(apply);
      renderFunnels();
    },
    clearFilters() {
      filters = {};
      quietly(apply);
      renderFunnels();
    },
    setSort(next) {
      order = next;
      quietly(apply);
    },
    refresh,
    destroy() {
      alive = false;
      cancelAnimationFrame(frame);
      observer.disconnect();
      head?.removeEventListener('click', activate);
      head?.removeEventListener('keydown', onKey);
      emptyRow?.remove();
      columns.forEach((c) => {
        if (c.slot) {
          options.unmountFilter?.(c.slot);
          c.slot.remove();
        }
        c.cell.classList.remove('jrk-th--sortable', 'jrk-th--asc', 'jrk-th--desc', 'jrk-th--filter');
        if (sortOn) c.cell.removeAttribute('aria-sort');
      });
      focusable.forEach((cell) => cell.removeAttribute('tabindex'));
      Array.from(table.tBodies).forEach((body) => {
        const rows = Array.from(body.rows);
        rows.forEach((r) => { r.hidden = false; });
        rows
          .filter((r) => r.hasAttribute(ORDER_ATTR))
          .sort((a, b) => Number(a.getAttribute(ORDER_ATTR)) - Number(b.getAttribute(ORDER_ATTR)))
          .forEach((r) => { body.appendChild(r); r.removeAttribute(ORDER_ATTR); });
      });
    },
  };

  refresh();
  return api;
}
