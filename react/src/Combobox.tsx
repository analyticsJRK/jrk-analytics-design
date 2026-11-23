import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { Icon } from './Icon';
import { cx } from './utils';
import { useFloatingPanel } from './floating';

/* A drop-down with a search box, for lists too long to scan: a property picker (ninety on the
 * roster), vendors, weather areas, people. Upstreamed from the portal (components/snow2/
 * SearchSelect.tsx), where thirty screens use it.
 *
 * WHY NOT <select>. The library styles a native select's open list, but it cannot add a search to
 * it, and the browser draws that list the full width of the control — 1,300px of names on a wide
 * screen with no way to type one. Native type-ahead matches only from the start of a label and is
 * invisible, so "Lasalle" cannot find "1250 Lasalle".
 *
 * IT IS A COMBOBOX, PROPERLY: a button that says what is chosen and, when open, a search field
 * with `role="combobox"` over a `role="listbox"`, with arrow keys, Home/End, Enter, Escape and Tab.
 * Typing a character on the closed button opens it with that character already searched.
 *
 * THE PANEL FLOATS IN THE TOP LAYER, as <Menu> and <ColumnFilter> do: a picker inside a card
 * (`overflow: clip`), a scrolling tab strip or a table cell is otherwise cut off at that box. It
 * opens upward when there is more room above, follows the button through a scroll, and closes when
 * the button scrolls out of view. The panel is a `.jrk-menu`, so every skin's overlay geometry
 * applies to it with no rule of its own. */

export interface ComboboxOption {
  value: string;
  label: string;
  /** A muted second word at the row's end — a code, a city, a count. Searched too. */
  hint?: string;
}

export interface ComboboxProps {
  value: string;
  options: ComboboxOption[];
  onChange: (value: string) => void;
  /** The button's id, so a visible `<label htmlFor>` names it. */
  id?: string;
  /** The accessible name when no visible label points at the button. */
  label?: string;
  placeholder?: string;
  /** Offer a blank choice first ("None", "Not set"). Without it the blank cannot be chosen. */
  emptyLabel?: string;
  size?: 'sm' | 'md';
  disabled?: boolean;
  /** Keep the list open after a pick, for adding several in a row. The caller drops picked values
   *  from `options`; the search text stays so the next match is one keystroke away. */
  stayOpen?: boolean;
  className?: string;
}

export function Combobox({
  value,
  options,
  onChange,
  id,
  label,
  placeholder = 'Choose…',
  emptyLabel,
  size = 'md',
  disabled,
  stayOpen,
  className,
}: ComboboxProps) {
  const uid = useId();
  const listId = `${uid}-list`;
  const box = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState(false);
  const [needle, setNeedle] = useState('');
  const [active, setActive] = useState(0);
  /** Scroll the highlighted row into view on the next render — keyboard and opening only. */
  const follow = useRef(true);

  useFloatingPanel(open, trigger, panel, () => hide(false), { align: 'start', minWidth: true });

  const all = useMemo<ComboboxOption[]>(
    () => (emptyLabel !== undefined ? [{ value: '', label: emptyLabel }, ...options] : options),
    [options, emptyLabel],
  );
  const rows = useMemo(() => {
    const n = needle.trim().toLowerCase();
    if (!n) return all;
    // The blank choice is not a search result: "None" matching "no" would be a trap.
    return all.filter((o) => o.value !== '' && `${o.label} ${o.hint ?? ''} ${o.value}`.toLowerCase().includes(n));
  }, [all, needle]);
  const current = all.find((o) => o.value === value) ?? null;

  const show = (first = '') => {
    if (disabled) return;
    setNeedle(first);
    // Open on the current choice, so the reader sees where they are in the list.
    setActive(first ? 0 : Math.max(0, all.findIndex((o) => o.value === value)));
    follow.current = true;
    setOpen(true);
  };
  function hide(refocus: boolean) {
    setOpen(false);
    setNeedle('');
    if (refocus) trigger.current?.focus({ preventScroll: true });
  }
  const pick = (o: ComboboxOption) => {
    if (stayOpen) {
      onChange(o.value);
      search.current?.focus({ preventScroll: true });
      return;
    }
    hide(true);
    if (o.value !== value) onChange(o.value);
  };

  /* A picked row leaves the list in stay-open mode; keep the highlight on a row that exists. */
  useEffect(() => {
    if (active > rows.length - 1) setActive(Math.max(0, rows.length - 1));
  }, [rows.length, active]);

  useEffect(() => {
    if (!open) return;
    // preventScroll: focusing must not scroll the strip, table or dialog the button sits in.
    search.current?.focus({ preventScroll: true });
    const away = (e: PointerEvent) => {
      if (!box.current?.contains(e.target as Node)) hide(false);
    };
    // Escape closes the list wherever focus went (a scrollbar press moves it off the field). The
    // field's own handler runs first and stops the key reaching a dialog.
    const esc = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); hide(true); }
    };
    document.addEventListener('pointerdown', away);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('pointerdown', away);
      document.removeEventListener('keydown', esc);
    };
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  /* Keep the highlighted row in view when the KEYBOARD moves it or the list opens — never when the
     mouse does. Scrolling a half-hidden row into view under a still pointer slid the next row
     beneath it, which highlighted and scrolled in turn, and the list ran away on a plain hover. */
  useEffect(() => {
    if (!open || !follow.current) return;
    follow.current = false;
    list.current?.querySelector<HTMLElement>(`[data-i="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [active, open]);
  const move = (next: (i: number) => number) => {
    follow.current = true;
    setActive(next);
  };

  const onTriggerKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      show();
    } else if (e.key.length === 1 && /\S/.test(e.key) && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      show(e.key);
    }
  };

  const onSearchKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); move((i) => Math.min(i + 1, rows.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); move((i) => Math.max(i - 1, 0)); }
    else if (e.key === 'Home') { e.preventDefault(); move(() => 0); }
    else if (e.key === 'End') { e.preventDefault(); move(() => rows.length - 1); }
    else if (e.key === 'Enter') { e.preventDefault(); if (rows[active]) pick(rows[active]); }
    // Stopped here so an Escape that closes the list does not also close the dialog around it.
    else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); hide(true); }
    else if (e.key === 'Tab') hide(false);
  };

  return (
    <div
      ref={box}
      className={cx('jrk-combobox', size === 'sm' && 'jrk-combobox--sm', className)}
      data-open={open || undefined}
    >
      <button
        ref={trigger}
        id={id}
        type="button"
        className={cx('jrk-input', size === 'sm' && 'jrk-input--sm', 'jrk-combobox__trigger')}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label ? `${label}: ${current?.label ?? placeholder}` : undefined}
        disabled={disabled}
        onClick={() => (open ? hide(true) : show())}
        onKeyDown={onTriggerKey}
      >
        <span className={cx('jrk-combobox__value', !(current && current.value !== '') && 'jrk-combobox__value--placeholder')}>
          {current ? current.label : placeholder}
        </span>
        <Icon name="chevronDown" className="jrk-combobox__chevron" />
      </button>
      {open && (
        <div
          ref={panel}
          popover="manual"
          className="jrk-menu jrk-menu--anchored jrk-menu--floating jrk-combobox__panel"
        >
          <input
            ref={search}
            type="text"
            role="combobox"
            className="jrk-input jrk-input--sm jrk-input--search"
            placeholder="Type to search"
            aria-label={`Search ${label ?? 'the list'}`}
            aria-expanded="true"
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={rows[active] ? `${uid}-o${active}` : undefined}
            value={needle}
            onChange={(e) => { setNeedle(e.target.value); move(() => 0); }}
            onKeyDown={onSearchKey}
          />
          <ul id={listId} role="listbox" aria-label={label ?? 'Options'} className="jrk-combobox__list" ref={list}>
            {rows.length === 0 && <li className="jrk-combobox__empty">No match for “{needle.trim()}”.</li>}
            {rows.map((o, i) => (
              <li
                key={o.value || '_none'}
                id={`${uid}-o${i}`}
                data-i={i}
                role="option"
                aria-selected={o.value === value}
                className={cx('jrk-combobox__option', i === active && 'jrk-combobox__option--active')}
                // pointerdown + preventDefault: the search field keeps focus, so the pick does not
                // blur-close the list before it lands.
                onPointerDown={(e) => { e.preventDefault(); pick(o); }}
                // Move, not enter: enter also fires when the list scrolls under a still pointer.
                onMouseMove={() => { if (i !== active) setActive(i); }}
              >
                <span>{o.label}</span>
                {o.hint && <small className="jrk-combobox__hint">{o.hint}</small>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
