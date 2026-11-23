import { useMemo, useRef, useState } from 'react';
import { Icon } from './Icon';
import { cx } from './utils';

/* One search box and one matching rule for a table the caller renders itself. Upstreamed from the
 * portal (components/TableSearch.tsx), which replaced five hand-written copies that had drifted:
 * three matched the manager and two did not, one trimmed the needle and one did not.
 *
 * The rule, once:
 *   - case-insensitive substring, needle trimmed
 *   - an empty needle returns the rows UNTOUCHED, by identity — callers memo on the array, and a
 *     fresh copy per keystroke re-renders every row for nothing
 *   - each field is tested SEPARATELY. Joining the fields with a space first lets a needle match
 *     across a boundary: "CRE OH" hit a row where the code ended one field and the state began the
 *     next
 *   - a null or undefined field contributes nothing, never the string "null", which is how
 *     searching "null" once matched every row with a gap in it
 *
 * What a caller owns is WHICH fields are searchable, because that genuinely differs per table.
 * <TableKit> has this built in; this is for tables that are not a TableKit. */

/** Pull the searchable values out of one row. `unknown[]`, so a year or a unit count is searchable
 *  without the call site stringifying it — `String(v)` is how "null" became a matchable word. */
export type SearchFields<T> = (row: T) => unknown[];

export function useTableSearch<T>(rows: T[], fields: SearchFields<T>) {
  const [q, setQ] = useState('');

  /* `fields` is usually written inline, so it is a new function every render. Read through a ref,
     the memo stays keyed on what changes the answer — the rows and the needle — and not on every
     unrelated re-render. Written during render on purpose: it must be current before the memo. */
  const fieldsRef = useRef(fields);
  fieldsRef.current = fields;

  const matched = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((row) =>
      fieldsRef.current(row).some((v) => v != null && String(v).toLowerCase().includes(needle)),
    );
  }, [rows, q]);

  return { q, setQ, matched, filtering: q.trim().length > 0 };
}

export interface TableSearchProps {
  value: string;
  onChange: (next: string) => void;
  /** The accessible name, naming the table it searches ("Search contracts"). Required: a screen
   *  with two of these and both called "Search" is two controls nobody can tell apart. */
  label: string;
  placeholder?: string;
  size?: 'sm' | 'md';
  className?: string;
}

/** The box. A `type="search"` field, so it takes the library's tinted search look and the field's
 *  focus ring; the glyph sits in the field through `.jrk-input-group`. */
export function TableSearch({
  value, onChange, label, placeholder = 'Search…', size = 'sm', className,
}: TableSearchProps) {
  return (
    <span className={cx('jrk-input-group', 'jrk-table-search', className)}>
      <span className="jrk-input-group__icon" aria-hidden="true">
        <Icon name="search" />
      </span>
      <input
        className={cx('jrk-input', size === 'sm' && 'jrk-input--sm')}
        type="search"
        value={value}
        placeholder={placeholder}
        aria-label={label}
        onChange={(e) => onChange(e.target.value)}
      />
    </span>
  );
}

export interface SearchCountProps {
  shown: number;
  total: number;
  /** Plural, e.g. 'contracts'. */
  noun?: string;
  /** Only where dropping the 's' is wrong — 'properties' is not 'propertie'. */
  singular?: string;
  locale?: string;
}

/** "43 properties" or "7 of 43 properties" — the only two shapes. The noun agrees with the TOTAL in
 *  both, never with the shown count: "1 of 43 property" is what agreeing with `shown` produces on the
 *  common case of a search narrowed to one row. Announced politely, since the rows themselves just
 *  get fewer and this is the only thing that says a filter is narrowing the table. */
export function SearchCount({
  shown, total, noun = 'properties', singular = 'property', locale = 'en-US',
}: SearchCountProps) {
  const word = total === 1 ? singular : noun;
  const n = (x: number) => x.toLocaleString(locale);
  return (
    <span className="jrk-caption jrk-search-count" aria-live="polite">
      {shown === total ? `${n(total)} ${word}` : `${n(shown)} of ${n(total)} ${word}`}
    </span>
  );
}
