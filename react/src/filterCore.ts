/* Column filters — the rules, with no DOM and no React, so they can be tested on their own and
 * shared by every carrier: <ColumnFilter> (the funnel and its panel), <TableKit> (data rows) and
 * `enhanceTable` (rendered cells).
 *
 * Upstreamed from the portal (components/table/filterCore.ts), where every table in every module
 * sorts and filters each column the same way. A filter is one of five kinds, picked per column:
 *
 *   values  a checklist of the values present (a category: property, status, type)
 *   tags    the same checklist for a column of LISTS ("Mold, Water damage"): each item is offered
 *           once, and a row passes when it holds any item ticked
 *   number  a min and a max (money, counts, percentages)
 *   date    a from and a to
 *   text    "contains" (a name, a unit, an id — a column where nearly every value differs)
 *
 * A cell is read three ways (text, number, date) once, and every rule below tests that reading.
 * That is what lets one rule serve a data row and a rendered cell alike. */

export type FilterKind = 'values' | 'tags' | 'text' | 'date' | 'number';

export type FilterState =
  | { kind: 'values'; selected: string[] }
  | { kind: 'tags'; selected: string[] }
  | { kind: 'text'; q: string }
  | { kind: 'date'; from: string; to: string }
  | { kind: 'number'; min: string; max: string };

export type Filters = Record<string, FilterState>;

/** One cell, read three ways: what it says, its number (if it is one), its date (if it is one). */
export interface CellValue {
  text: string;
  num: number | null;
  /** YYYY-MM-DD, so a range test is a string comparison. */
  date: string | null;
}

/** The text of an empty cell. Lists as "(Blank)" in a checklist and always sorts last. */
export const BLANK = '';

/* Min and max stay STRINGS in the state, as typed. A half-typed "-" or "1." is a valid moment in
   an input and must survive a re-render; it is read as a bound only here, and an unreadable one
   is no bound at all rather than zero. */
const bound = (s: string) => (s.trim() === '' || Number.isNaN(Number(s)) ? null : Number(s));

/** Whether a filter narrows anything. A checklist always does — "everything ticked" is stored as
 *  no filter at all (see <ColumnFilter>), so a stored checklist is by construction a narrowing. */
export function isActive(f: FilterState | undefined): f is FilterState {
  if (!f) return false;
  if (f.kind === 'values' || f.kind === 'tags') return true;
  if (f.kind === 'text') return f.q.trim() !== '';
  if (f.kind === 'date') return Boolean(f.from || f.to);
  return bound(f.min) !== null || bound(f.max) !== null;
}

export function passes(f: FilterState, v: CellValue): boolean {
  if (f.kind === 'values') return f.selected.includes(v.text);
  if (f.kind === 'tags') return listItems(v.text).some((t) => f.selected.includes(t));
  if (f.kind === 'text') return v.text.toLowerCase().includes(f.q.trim().toLowerCase());
  if (f.kind === 'date') return Boolean(v.date) && (!f.from || v.date! >= f.from) && (!f.to || v.date! <= f.to);
  // A blank never passes a number range, as in Excel: "at least 0" is not a claim about a missing figure.
  if (v.num === null) return false;
  const lo = bound(f.min);
  const hi = bound(f.max);
  return (lo === null || v.num >= lo) && (hi === null || v.num <= hi);
}

/** Not a value: blank, a dash, n/a. Sorts last and lists as (Blank). */
export function isBlankText(s: string): boolean {
  const t = s.trim();
  return !t || t === '—' || t === '–' || t === '-' || /^n\/?a$/i.test(t);
}

/** A figure however it is dressed: $1,530 · 3.81% · 54d · +12.4% · (1,200) · −$4k · 30.1".
 *  `(1,200)` is negative — the accounting form this library prints negative money in. */
export function parseNumber(text: string): number | null {
  const raw = text.trim();
  if (isBlankText(raw)) return null;
  const s = raw
    .replace(/−/g, '-')
    .replace(/[$,\s]/g, '')
    .replace(/^\((.*)\)$/, '-$1')
    .replace(/(in|["″%d×x])$/i, '');
  if (/^[+-]?\d*\.?\d+$/.test(s)) return Number(s);
  const compact = /^([+-]?\d*\.?\d+)([kmb])$/i.exec(s);
  if (compact) return Number(compact[1]) * { k: 1e3, m: 1e6, b: 1e9 }[compact[2].toLowerCase() as 'k' | 'm' | 'b'];
  return null;
}

const MONTHS: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, sept: 9, oct: 10, nov: 11, dec: 12,
};
const pad = (n: number) => String(n).padStart(2, '0');
const iso = (y: number, m: number, d: number) =>
  m >= 1 && m <= 12 && d >= 1 && d <= 31 ? `${y}-${pad(m)}-${pad(d)}` : null;
const month = (s: string) => MONTHS[s.toLowerCase()] ?? MONTHS[s.slice(0, 3).toLowerCase()];

/** A full date as YYYY-MM-DD, from the spellings a US-English screen prints: 2026-10-28,
 *  10/28/26, 10/28/2026, Oct 28, 2026, 28 Oct 2026. A month without a day ("Oct 2026") is not a
 *  date here — it lists as a value instead, which is the better filter for it. */
export function parseDate(text: string): string | null {
  const t = text.trim();
  let m = /^(\d{4})-(\d{2})-(\d{2})(?:[ T].*)?$/.exec(t);
  if (m) return iso(+m[1], +m[2], +m[3]);
  m = /^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/.exec(t);
  if (m) return iso(m[3].length === 2 ? 2000 + +m[3] : +m[3], +m[1], +m[2]);
  m = /^([A-Za-z]{3,9})\.? (\d{1,2}),? (\d{4})$/.exec(t);
  if (m && month(m[1])) return iso(+m[3], month(m[1]), +m[2]);
  m = /^(\d{1,2}) ([A-Za-z]{3,9})\.? (\d{4})$/.exec(t);
  if (m && month(m[2])) return iso(+m[3], month(m[2]), +m[1]);
  return null;
}

/** The items of a list cell: "Mold, Water damage" -> ["Mold", "Water damage"]. An empty cell is
 *  one blank item, so it can still be ticked as (Blank). */
export function listItems(text: string): string[] {
  const t = text.split(/\s*,\s*/).filter(Boolean);
  return t.length ? t : [BLANK];
}

export function readCell(text: string): CellValue {
  const t = text.replace(/\s+/g, ' ').trim();
  if (isBlankText(t)) return { text: BLANK, num: null, date: null };
  return { text: t, num: parseNumber(t), date: parseDate(t) };
}

/** The filter that fits a column, from the values in it.
 *
 *  Dates and numbers win when nearly every filled cell is one. Long plain integers that are all
 *  different (lease numbers, account ids) are identifiers, not quantities, so they get "contains".
 *  Otherwise a column whose values repeat — or a short table — gets a checklist, and a column where
 *  nearly every value is different gets "contains". */
export function inferKind(values: CellValue[]): FilterKind {
  const filled = values.filter((v) => v.text !== BLANK);
  if (!filled.length) return 'values';
  const share = (n: number) => n / filled.length;
  const distinct = new Set(filled.map((v) => v.text)).size;
  if (share(filled.filter((v) => v.date).length) >= 0.9) return 'date';
  if (share(filled.filter((v) => v.num !== null).length) >= 0.9) {
    const ids = filled.every((v) => /^\d{5,}$/.test(v.text));
    return ids && distinct === filled.length ? 'text' : 'number';
  }
  /* A column of LISTS: many cells hold several items, and the items repeat far more than the cells
     do. Names written "Torres, Cathy" fail it, because their parts barely repeat. */
  const lists = filled.filter((v) => v.text.includes(', ')).length;
  if (lists >= filled.length * 0.2) {
    const items = filled.flatMap((v) => listItems(v.text));
    const kinds = new Set(items).size;
    if (kinds <= 40 && kinds < distinct && items.length >= kinds * 2) return 'tags';
  }
  if (distinct <= 25 || distinct <= filled.length * 0.5) return 'values';
  return 'text';
}

export interface ValueOption {
  /** The value as stored in the filter. `BLANK` for an empty cell. */
  v: string;
  /** What the checklist prints. */
  label: string;
  /** Rows holding it that pass the OTHER filters. */
  n: number;
}

/** The checklist: every value present, counted over the rows that pass the OTHER filters.
 *
 *  `all` lists every value in the column so a value the other filters have emptied still offers
 *  a box (at 0) — dropping it would make a ticked value impossible to untick. Blank goes last;
 *  `order` pins a domain order (Low, Medium, High) ahead of the natural sort. */
export function valueOptions(all: string[], counted: string[], order?: string[], show?: (v: string) => string): ValueOption[] {
  const n = new Map<string, number>();
  all.forEach((v) => { if (!n.has(v)) n.set(v, 0); });
  counted.forEach((v) => n.set(v, (n.get(v) ?? 0) + 1));
  const rank = (v: string) => { const i = order?.indexOf(v) ?? -1; return i < 0 ? 1e9 : i; };
  return [...n.keys()]
    .sort((a, b) => Number(a === BLANK) - Number(b === BLANK) || rank(a) - rank(b)
      || a.localeCompare(b, undefined, { numeric: true }))
    .map((v) => ({ v, label: v === BLANK ? '(Blank)' : (show?.(v) ?? v), n: n.get(v) ?? 0 }));
}

/** The checklist of a list column: each item once, counted over the passing rows holding it. */
export function tagOptions(all: string[], counted: string[]): ValueOption[] {
  return valueOptions(all.flatMap(listItems), counted.flatMap(listItems));
}

/* ---- serialised: one string per filter, for an address or a saved view ---------------------- */

const SEP = '\u001f';

/** One filter as one string. With `universe` (every value the checklist offers), a checklist that
 *  leaves out fewer than it keeps is written as what it leaves out, so unticking one value of
 *  ninety is a short address rather than eighty-nine names. */
export function encodeFilter(f: FilterState, universe?: string[]): string {
  if ((f.kind === 'values' || f.kind === 'tags') && universe) {
    const keep = new Set(f.selected);
    const out = [...new Set(universe)].filter((v) => !keep.has(v));
    if (out.length < f.selected.length) return `${f.kind === 'values' ? 'x' : 'y'}:${out.join(SEP)}`;
  }
  if (f.kind === 'values') return `v:${f.selected.join(SEP)}`;
  if (f.kind === 'tags') return `g:${f.selected.join(SEP)}`;
  if (f.kind === 'text') return `t:${f.q}`;
  if (f.kind === 'date') return `d:${f.from}..${f.to}`;
  return `n:${f.min}..${f.max}`;
}

/** Read one back. An `x:` / `y:` (written as exclusions) needs the same `universe` it was written
 *  against. A bare string with no prefix is read by the column's kind — a rule like ">1000" for a
 *  number, the value for a checklist, the needle for text — so a link written by an older filter
 *  row still opens filtered the same way. */
export function decodeFilter(s: string, kind: FilterKind, universe?: string[]): FilterState | undefined {
  const m = /^([vgxytdn]):([\s\S]*)$/.exec(s);
  if (m) {
    const body = m[2];
    const list = body === '' ? [] : body.split(SEP);
    if (m[1] === 'v') return { kind: 'values', selected: list };
    if (m[1] === 'g') return { kind: 'tags', selected: list };
    if (m[1] === 'x' || m[1] === 'y') {
      const out = new Set(list);
      return { kind: m[1] === 'x' ? 'values' : 'tags', selected: [...new Set(universe ?? [])].filter((v) => !out.has(v)) };
    }
    if (m[1] === 't') return body ? { kind: 'text', q: body } : undefined;
    const [a = '', b = ''] = body.split('..');
    if (m[1] === 'd') return a || b ? { kind: 'date', from: a, to: b } : undefined;
    return a || b ? { kind: 'number', min: a, max: b } : undefined;
  }
  if (!s) return undefined;
  if (kind === 'number') {
    const t = s.replace(/[$,\s]/g, '');
    let r = /^>=?(-?\d*\.?\d+)$/.exec(t);
    if (r) return { kind: 'number', min: r[1], max: '' };
    r = /^<=?(-?\d*\.?\d+)$/.exec(t);
    if (r) return { kind: 'number', min: '', max: r[1] };
    r = /^(-?\d*\.?\d+)-(-?\d*\.?\d+)$/.exec(t);
    if (r) return { kind: 'number', min: r[1], max: r[2] };
    return { kind: 'number', min: t, max: t };
  }
  if (kind === 'values' || kind === 'tags') return { kind, selected: [s] };
  return { kind: 'text', q: s };
}
