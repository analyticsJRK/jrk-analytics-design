import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useFloatingPanel } from './floating';
import { Icon } from './Icon';
import { cx } from './utils';
import { isActive } from './filterCore';
import type { FilterKind, FilterState, ValueOption } from './filterCore';

/* The column filter, Excel style: a funnel at the trailing edge of a heading opens the filter that
 * fits the column — a checklist of the values present with their counts, a list-item checklist, a
 * min/max, a date range, or "contains". The rules are `filterCore.ts`; this file is the control.
 *
 * Upstreamed from the portal (components/table/FilterButton.tsx), where every table carries one
 * per column. Two things changed on the way in:
 *
 *  - THE PANEL FLOATS IN THE TOP LAYER rather than being portalled to <body>. Same reasoning
 *    <Menu> records: `.jrk-card` is `overflow: clip` and `.jrk-table-wrap` scrolls, so an anchored
 *    panel is cut off — but a portal moves the panel to the end of the document, so Tab from the
 *    funnel skips it. A `popover="manual"` panel keeps its DOM place and paints above every clip.
 *  - IT COMPOSES ON `.jrk-menu`, so the surface, the radius, the shadow and every skin's overlay
 *    geometry come for free instead of being restated for a fourth floating panel.
 *
 * The panel lives INSIDE the heading cell, so it inherits the heading's type (centred, nowrap,
 * semibold, accent ink, midgard's caps). `.jrk-filter` resets all of that — see filter.css. */

/* Floating placement lives in floating.ts, shared with <Menu> and <Combobox>. */

/* ------------------------------------------------------------------------------------------------
   The control
   ------------------------------------------------------------------------------------------------ */

export interface ColumnFilterProps {
  /** The column's name. Titles the panel and names the button ("Filter Status"). */
  label: string;
  kind: FilterKind;
  value: FilterState | undefined;
  /** `undefined` clears the filter. A checklist with every value ticked reports `undefined` too,
   *  so "no filter" has one representation. */
  onChange: (next: FilterState | undefined) => void;
  /** Checklist only: every value present, counted over the rows passing the OTHER filters. Called
   *  when the panel opens, so nothing is counted for a column nobody filters. */
  options?: () => ValueOption[];
  /** Date only: the earliest and latest date in the column (YYYY-MM-DD), to bound the pickers. */
  dateBounds?: () => [string, string];
  /** For the checklist counts. */
  locale?: string;
  className?: string;
}

/** A funnel for a column heading, opening that column's filter. Put it inside the `<th>` and give
 *  the heading `.jrk-th--filter` so the label keeps clear of it. */
export function ColumnFilter({
  label, kind, value, onChange, options, dateBounds, locale = 'en-US', className,
}: ColumnFilterProps) {
  const [open, setOpen] = useState(false);
  const btn = useRef<HTMLButtonElement>(null);
  const pop = useRef<HTMLDivElement>(null);
  const active = isActive(value);

  const close = (refocus: boolean) => {
    setOpen(false);
    if (refocus) btn.current?.focus({ preventScroll: true });
  };

  useFloatingPanel(open, btn, pop, () => setOpen(false), { align: 'end' });

  useEffect(() => {
    if (!open) return;
    // First field or button, without scrolling the table the funnel sits in.
    pop.current?.querySelector<HTMLElement>('input, button')?.focus({ preventScroll: true });
    const outside = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!pop.current?.contains(t) && !btn.current?.contains(t)) setOpen(false);
    };
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') close(true); };
    document.addEventListener('pointerdown', outside, true);
    document.addEventListener('keydown', key);
    return () => {
      document.removeEventListener('pointerdown', outside, true);
      document.removeEventListener('keydown', key);
    };
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <button
        ref={btn}
        type="button"
        data-noexport=""
        className={cx('jrk-th__funnel', active && 'jrk-th__funnel--on', className)}
        aria-label={`Filter ${label}${active ? ' (filtered)' : ''}`}
        title={`Filter ${label}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        // A heading may sort on a click; opening a filter must not also sort the column.
        onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <Icon name="filter" />
      </button>
      {open && (
        <div
          ref={pop}
          popover="manual"
          role="dialog"
          aria-label={`Filter ${label}`}
          className="jrk-menu jrk-menu--anchored jrk-menu--floating jrk-filter"
          // The panel sits inside the heading; nothing in it may reach a heading's sort handler.
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => { if (e.key !== 'Escape') e.stopPropagation(); }}
          onBlur={(e) => {
            const to = e.relatedTarget as Node | null;
            if (to && !pop.current?.contains(to) && !btn.current?.contains(to)) setOpen(false);
          }}
        >
          <div className="jrk-filter__title">{label}</div>
          {kind === 'values' || kind === 'tags' ? (
            <Checklist kind={kind} options={options} value={value} onChange={onChange} locale={locale} />
          ) : kind === 'date' ? (
            <DateRange bounds={dateBounds} value={value} onChange={onChange} />
          ) : kind === 'number' ? (
            <NumberRange value={value} onChange={onChange} />
          ) : (
            <TextMatch value={value} onChange={onChange} />
          )}
          <div className="jrk-filter__foot">
            <button
              type="button"
              className="jrk-btn jrk-btn--primary jrk-btn--sm"
              disabled={!active}
              onClick={() => onChange(undefined)}
            >
              Clear
            </button>
            <button type="button" className="jrk-btn jrk-btn--cta jrk-btn--sm" onClick={() => close(true)}>
              Done
            </button>
          </div>
        </div>
      )}
    </>
  );
}

type Part = { value: FilterState | undefined; onChange: (next: FilterState | undefined) => void };

function Checklist({ kind, options, value, onChange, locale }: Part & {
  kind: 'values' | 'tags';
  options?: () => ValueOption[];
  locale: string;
}) {
  const [q, setQ] = useState('');
  // Built once per opening: the counts are of the rows as they stood when the panel opened, so a
  // box does not jump while the reader is working down the list.
  const all = useMemo(() => options?.() ?? [], []); // eslint-disable-line react-hooks/exhaustive-deps
  const selected = value?.kind === kind ? new Set(value.selected) : null;
  const on = (v: string) => !selected || selected.has(v);
  const needle = q.trim().toLowerCase();
  const shown = needle ? all.filter((o) => o.label.toLowerCase().includes(needle)) : all;
  const allOn = shown.length > 0 && shown.every((o) => on(o.v));
  const someOn = shown.some((o) => on(o.v));

  const save = (next: Set<string>) =>
    onChange(all.every((o) => next.has(o.v)) ? undefined : { kind, selected: [...next] });
  const current = () => new Set(selected ?? all.map((o) => o.v));
  const toggle = (v: string) => {
    const s = current();
    if (s.has(v)) s.delete(v);
    else s.add(v);
    save(s);
  };
  // Select all acts on what the search shows, so "search, then select all" picks the matches.
  const toggleShown = () => {
    const s = current();
    shown.forEach((o) => (allOn ? s.delete(o.v) : s.add(o.v)));
    save(s);
  };

  return (
    <>
      {all.length > 8 && (
        <input
          className="jrk-input jrk-input--sm jrk-filter__search"
          type="search"
          placeholder="Search"
          aria-label="Search values"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      )}
      <label className="jrk-check jrk-filter__opt jrk-filter__all">
        <input
          type="checkbox"
          checked={allOn}
          ref={(el) => { if (el) el.indeterminate = someOn && !allOn; }}
          onChange={toggleShown}
        />
        <span className="jrk-check__label">Select all</span>
      </label>
      <div className="jrk-filter__list">
        {shown.map((o) => (
          <label key={o.v} className="jrk-check jrk-filter__opt">
            <input type="checkbox" checked={on(o.v)} onChange={() => toggle(o.v)} />
            <span className="jrk-check__label">{o.label}</span>
            <span className="jrk-filter__n">{o.n.toLocaleString(locale)}</span>
          </label>
        ))}
        {!shown.length && <span className="jrk-filter__none">No match</span>}
      </div>
    </>
  );
}

function DateRange({ bounds, value, onChange }: Part & { bounds?: () => [string, string] }) {
  const id = useId();
  const [lo, hi] = useMemo(() => bounds?.() ?? ['', ''], []); // eslint-disable-line react-hooks/exhaustive-deps
  const from = value?.kind === 'date' ? value.from : '';
  const to = value?.kind === 'date' ? value.to : '';
  const set = (f: string, t: string) => onChange(f || t ? { kind: 'date', from: f, to: t } : undefined);
  return (
    <div className="jrk-filter__range">
      <label htmlFor={`${id}-from`}>From</label>
      <input
        id={`${id}-from`} className="jrk-input jrk-input--sm" type="date" value={from}
        min={lo || undefined} max={to || hi || undefined} onChange={(e) => set(e.target.value, to)}
      />
      <label htmlFor={`${id}-to`}>To</label>
      <input
        id={`${id}-to`} className="jrk-input jrk-input--sm" type="date" value={to}
        min={from || lo || undefined} max={hi || undefined} onChange={(e) => set(from, e.target.value)}
      />
    </div>
  );
}

function NumberRange({ value, onChange }: Part) {
  const id = useId();
  const min = value?.kind === 'number' ? value.min : '';
  const max = value?.kind === 'number' ? value.max : '';
  const set = (a: string, b: string) => onChange(a || b ? { kind: 'number', min: a, max: b } : undefined);
  return (
    <div className="jrk-filter__range">
      <label htmlFor={`${id}-min`}>Min</label>
      <input
        id={`${id}-min`} className="jrk-input jrk-input--sm" type="number" step="any" inputMode="decimal"
        value={min} onChange={(e) => set(e.target.value, max)}
      />
      <label htmlFor={`${id}-max`}>Max</label>
      <input
        id={`${id}-max`} className="jrk-input jrk-input--sm" type="number" step="any" inputMode="decimal"
        value={max} onChange={(e) => set(min, e.target.value)}
      />
    </div>
  );
}

function TextMatch({ value, onChange }: Part) {
  return (
    <label className="jrk-filter__range">
      Contains
      <input
        className="jrk-input jrk-input--sm" type="search"
        value={value?.kind === 'text' ? value.q : ''}
        onChange={(e) => onChange(e.target.value ? { kind: 'text', q: e.target.value } : undefined)}
      />
    </label>
  );
}
