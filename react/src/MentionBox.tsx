import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, ReactNode, RefObject, TextareaHTMLAttributes } from 'react';
import { cx } from './utils';

/** Somebody (or a group) who can be tagged. `label` is what `@` writes into the
 *  text; `id` is what the caller is told — an email, an account id, `group:7`. */
export interface MentionPerson {
  id: string;
  label: string;
  /** A second line in the list — an email, "Group · 12 people". */
  hint?: string;
}

export interface MentionBoxProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'value' | 'onChange' | 'defaultValue'> {
  value: string;
  /** Every change, with the ids of everyone whose `@label` is in the text NOW —
   *  picked from the list, typed out in full, or already in a note being edited.
   *  Deleting a tag from the text drops its id, so what is sent is what is shown. */
  onChange: (value: string, mentions: string[]) => void;
  /** Everyone who can be tagged, filtered here as the reader types. */
  people?: MentionPerson[];
  /** Or look them up: called with what follows the `@`. Results are remembered,
   *  so a name found once is recognised when it is typed out later. */
  search?: (query: string) => Promise<MentionPerson[]> | MentionPerson[];
  /** Rows the list shows at most. */
  limit?: number;
  /** The list's accessible name. */
  listLabel?: string;
  inputRef?: RefObject<HTMLTextAreaElement | null>;
}

const MAX_QUERY = 40;

/** The `@` being typed before the caret: where it starts and what follows it. */
function atQuery(text: string, caret: number): { at: number; query: string } | null {
  const start = Math.max(0, caret - MAX_QUERY - 1);
  for (let i = caret - 1; i >= start; i -= 1) {
    const ch = text[i];
    if (ch === '\n') return null;
    if (ch === '@') {
      // A character before the @ makes it an email address, not a tag.
      if (i > 0 && /[\w.]/.test(text[i - 1])) return null;
      const query = text.slice(i + 1, caret);
      // Group names run longer than people's; five words is the ceiling.
      if (/\s\s/.test(query) || query.split(' ').length > 5) return null;
      return { at: i, query };
    }
  }
  return null;
}

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function tagPattern(labels: string[]): RegExp | null {
  const names = Array.from(new Set(labels.filter((n) => n.length > 1))).sort((a, b) => b.length - a.length);
  if (!names.length) return null;
  return new RegExp(`@(${names.map(escapeRe).join('|')})(?![\\w])`, 'gi');
}

/** The ids tagged in `text`. A label two people share is a tag only when one of
 *  them was PICKED from the list — the text alone cannot say which is meant. */
export function findMentions(text: string, people: MentionPerson[], picked: Iterable<string> = []): string[] {
  if (!text.includes('@')) return [];
  const re = tagPattern(people.map((p) => p.label));
  if (!re) return [];
  const chosen = new Set(picked);
  const byLabel = new Map<string, string[]>();
  for (const p of people) {
    const k = p.label.toLowerCase();
    byLabel.set(k, [...(byLabel.get(k) ?? []), p.id]);
  }
  const out: string[] = [];
  for (const m of text.matchAll(re)) {
    const ids = byLabel.get(m[1].toLowerCase()) ?? [];
    const hit = ids.length === 1 ? ids : ids.filter((id) => chosen.has(id));
    for (const id of hit) if (!out.includes(id)) out.push(id);
  }
  return out;
}

/* What a copy of the text needs to sit exactly over the textarea's own text. */
const MIRRORED = [
  'boxSizing', 'fontFamily', 'fontSize', 'fontWeight', 'fontStyle', 'fontVariant', 'fontStretch', 'lineHeight',
  'letterSpacing', 'wordSpacing', 'textTransform', 'textIndent', 'tabSize', 'paddingTop', 'paddingRight',
  'paddingBottom', 'paddingLeft', 'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth',
  'borderTopLeftRadius', 'borderTopRightRadius', 'borderBottomLeftRadius', 'borderBottomRightRadius',
] as const;

type PopoverEl = HTMLElement & { showPopover?: () => void; hidePopover?: () => void };

/** A textarea that tags people with `@`.
 *
 *  Typing `@` opens a list; picking writes `@Full Name ` into the text. The text
 *  keeps the plain `@Full Name`, so it reads the same in every screen and export,
 *  and `onChange` reports who is tagged alongside it.
 *
 *  A TAG IS HIGHLIGHTED AS SOON AS IT IS THERE. A textarea cannot colour part of
 *  its text, so a see-through copy sits over it with each tag marked; it copies
 *  the box's font, padding, border widths, size and scroll. A full `@Name` typed
 *  by hand counts as a tag too, so what is highlighted is exactly what is sent.
 *
 *  Keys while the list is open: ↑ ↓ move, Enter or Tab pick, Escape closes the
 *  list and nothing else — it stops there, so the dialog or panel around the box
 *  stays open. */
export function MentionBox({
  value,
  onChange,
  people,
  search,
  limit = 8,
  listLabel = 'People to tag',
  inputRef,
  className,
  onKeyDown,
  onScroll,
  onBlur,
  ...rest
}: MentionBoxProps) {
  const own = useRef<HTMLTextAreaElement | null>(null);
  const box = inputRef ?? own;
  const listRef = useRef<HTMLUListElement | null>(null);
  const hl = useRef<HTMLDivElement | null>(null);
  const base = useId();
  const [at, setAt] = useState<{ at: number; query: string } | null>(null);
  const [active, setActive] = useState(0);
  const [found, setFound] = useState<MentionPerson[]>([]);

  /* Everyone this box has ever been told about, so a name found by `search` once
     is still recognised when it is typed out later. */
  const known = useRef<Map<string, MentionPerson>>(new Map());
  const picked = useRef<Set<string>>(new Set());
  const remember = (list: MentionPerson[]) => list.forEach((p) => known.current.set(p.id, p));
  if (people) remember(people);
  const knownList = () => Array.from(known.current.values());

  /* ---- the list ---- */
  useEffect(() => {
    if (!at || !search) return undefined;
    let live = true;
    Promise.resolve(search(at.query.trim()))
      .then((rows) => {
        if (!live) return;
        remember(rows);
        setFound(rows.slice(0, limit));
      })
      .catch(() => live && setFound([]));
    return () => {
      live = false;
    };
  }, [at?.query, search, limit]); // eslint-disable-line react-hooks/exhaustive-deps

  /* Local filtering: a name whose word STARTS with what was typed comes before one
     that merely contains it. */
  const matches = useMemo<MentionPerson[]>(() => {
    if (!at) return [];
    if (search) return found;
    const all = people ?? [];
    const q = at.query.trim().toLowerCase();
    if (!q) return all.slice(0, limit);
    const starts = (p: MentionPerson) =>
      p.label.toLowerCase().split(/\s+/).some((w) => w.startsWith(q)) || p.id.toLowerCase().startsWith(q);
    const hit = all.filter((p) => p.label.toLowerCase().includes(q) || p.id.toLowerCase().includes(q));
    return [...hit.filter(starts), ...hit.filter((p) => !starts(p))].slice(0, limit);
  }, [at, people, search, found, limit]);

  const open = !!at && matches.length > 0;

  /* ---- the highlight layer ---- */
  const tagRe = useMemo(() => tagPattern(knownList().map((p) => p.label)), [people, found]); // eslint-disable-line react-hooks/exhaustive-deps
  const marked = useMemo<ReactNode[] | null>(() => {
    if (!tagRe || !value.includes('@')) return null;
    const out: ReactNode[] = [];
    let last = 0;
    for (const m of value.matchAll(tagRe)) {
      const i = m.index ?? 0;
      if (i > last) out.push(value.slice(last, i));
      out.push(<mark key={i}>{m[0]}</mark>);
      last = i + m[0].length;
    }
    if (!out.length) return null;
    if (last < value.length) out.push(value.slice(last));
    out.push(' '); // a trailing newline still takes its line, as it does in the box
    return out;
  }, [tagRe, value]);
  const showing = marked !== null;

  useLayoutEffect(() => {
    const el = box.current;
    const layer = hl.current;
    if (!el || !layer) return undefined;
    const fit = () => {
      const cs = window.getComputedStyle(el);
      for (const k of MIRRORED) layer.style[k] = cs[k];
      /* A scrollbar narrows the box's text; narrow the copy the same way. */
      const bar = el.offsetWidth - el.clientWidth - parseFloat(cs.borderLeftWidth) - parseFloat(cs.borderRightWidth);
      layer.style.paddingRight = `${parseFloat(cs.paddingRight) + Math.max(0, bar)}px`;
      layer.style.top = `${el.offsetTop}px`;
      layer.style.left = `${el.offsetLeft}px`;
      const r = el.getBoundingClientRect(); // fractional, where offsetWidth rounds
      layer.style.width = `${r.width}px`;
      layer.style.height = `${r.height}px`;
      layer.scrollTop = el.scrollTop;
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [showing]); // eslint-disable-line react-hooks/exhaustive-deps

  /* The copy follows the box's scroll after every change of text too — typing at
     the bottom scrolls the box. */
  useLayoutEffect(() => {
    if (hl.current && box.current) hl.current.scrollTop = box.current.scrollTop;
  });

  /* ---- placement: viewport coordinates, upward when there is more room above ---- */
  const [pos, setPos] = useState<CSSProperties | null>(null);
  useLayoutEffect(() => {
    if (!open) {
      setPos(null);
      return undefined;
    }
    const place = () => {
      const r = box.current?.getBoundingClientRect();
      if (!r) return;
      const below = window.innerHeight - r.bottom - 8;
      const up = below < 220 && r.top > below;
      setPos({
        left: Math.max(8, Math.min(r.left, window.innerWidth - 300)),
        width: Math.min(Math.max(r.width, 260), 420),
        ...(up ? { bottom: window.innerHeight - r.top + 4 } : { top: r.bottom + 4 }),
      });
    };
    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  /* Into the top layer, above a dialog's scrolling body and any backdrop filter. */
  useLayoutEffect(() => {
    const el = listRef.current as PopoverEl | null;
    if (!open || !el || typeof el.showPopover !== 'function') return undefined;
    try {
      el.showPopover();
    } catch {
      /* Already showing. */
    }
    return () => {
      try {
        el.hidePopover?.();
      } catch {
        /* Gone with its subtree. */
      }
    };
  }, [open]);

  const blurTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(blurTimer.current), []);

  const emit = (next: string) => onChange(next, findMentions(next, knownList(), picked.current));

  const sync = (el: HTMLTextAreaElement) => {
    setAt(atQuery(el.value, el.selectionStart ?? el.value.length));
    setActive(0);
  };

  const pick = (p: MentionPerson) => {
    const el = box.current;
    if (!el || !at) return;
    const caret = el.selectionStart ?? value.length;
    const before = value.slice(0, at.at);
    const ins = `@${p.label} `;
    remember([p]);
    picked.current.add(p.id);
    emit(before + ins + value.slice(caret));
    setAt(null);
    requestAnimationFrame(() => {
      el.focus();
      const caretAt = before.length + ins.length;
      el.setSelectionRange(caretAt, caretAt);
    });
  };

  const optionId = (i: number) => `${base}-opt-${i}`;

  return (
    <div className="jrk-mention">
      <textarea
        {...rest}
        ref={box as RefObject<HTMLTextAreaElement>}
        className={cx(className ?? 'jrk-textarea')}
        value={value}
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={open ? `${base}-list` : undefined}
        aria-activedescendant={open ? optionId(active) : undefined}
        onChange={(e) => {
          emit(e.target.value);
          sync(e.target);
        }}
        onClick={(e) => sync(e.currentTarget)}
        onBlur={(e) => {
          blurTimer.current = setTimeout(() => setAt(null), 150);
          onBlur?.(e);
        }}
        onScroll={(e) => {
          if (hl.current) hl.current.scrollTop = e.currentTarget.scrollTop;
          onScroll?.(e);
        }}
        onKeyDown={(e) => {
          if (open) {
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setActive((a) => (a + 1) % matches.length);
              return;
            }
            if (e.key === 'ArrowUp') {
              e.preventDefault();
              setActive((a) => (a - 1 + matches.length) % matches.length);
              return;
            }
            if (e.key === 'Enter' || e.key === 'Tab') {
              e.preventDefault();
              const p = matches[active];
              if (p) pick(p);
              return;
            }
            if (e.key === 'Escape') {
              e.preventDefault();
              e.stopPropagation();
              setAt(null);
              return;
            }
          }
          onKeyDown?.(e);
        }}
      />
      {marked ? (
        <div ref={hl} className="jrk-mention__highlight" aria-hidden="true">
          {marked}
        </div>
      ) : null}
      {open ? (
        <ul
          ref={listRef}
          id={`${base}-list`}
          className="jrk-mention__list"
          role="listbox"
          aria-label={listLabel}
          popover="manual"
          style={pos ?? { visibility: 'hidden' }}
        >
          {matches.map((p, i) => (
            <li
              key={p.id}
              id={optionId(i)}
              role="option"
              aria-selected={i === active}
              className="jrk-mention__option"
              onMouseDown={(e) => {
                e.preventDefault();
                pick(p);
              }}
              onMouseEnter={() => setActive(i)}
            >
              <span className="jrk-mention__name">{p.label}</span>
              {p.hint && <span className="jrk-mention__hint">{p.hint}</span>}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

/** Posted text with each `@Label` of a known person drawn as a tag. */
export function MentionText({
  text,
  people,
  className,
}: {
  text: string;
  people: MentionPerson[];
  className?: string;
}) {
  const parts = useMemo(() => {
    const re = tagPattern(people.map((p) => p.label));
    if (!re || !text.includes('@')) return [text] as ReactNode[];
    const out: ReactNode[] = [];
    let last = 0;
    for (const m of text.matchAll(re)) {
      const i = m.index ?? 0;
      if (i > last) out.push(text.slice(last, i));
      out.push(
        <span key={i} className="jrk-mention-tag">
          {m[0]}
        </span>,
      );
      last = i + m[0].length;
    }
    if (last < text.length) out.push(text.slice(last));
    return out;
  }, [people, text]);
  return <span className={className}>{parts}</span>;
}
