import { useCallback, useEffect, useId, useRef, useState } from 'react';
import type { MouseEvent, ReactNode, RefObject } from 'react';
import { cx } from './utils';

/* Section index for a long vertical page — "on this page", with the section you
 * are currently reading marked.
 *
 * READ THE HEADER OF css/components/section-nav.css BEFORE CHANGING THIS FILE.
 * It carries the layer-2 argument for why this component is allowed to exist
 * beside the breadcrumb / sidebar / tabs spine, the hand-measured contrast
 * figures for the marker, and the reason the current row is NOT the rail's
 * tinted pill. The short version of the part that constrains this file:
 *
 *   THE INDEX IS DERIVED FROM THE DOCUMENT, NEVER AUTHORED. There is no `items`
 *   prop and there will not be one. philosophy.md permits a section index only
 *   in the derived form, "so it cannot drift from them" — an authored list is a
 *   second source of truth for the page's own structure and it goes stale the
 *   first time a section is renamed. This is the seriesColor(8) pattern: the
 *   library refuses the shape that degrades quietly rather than offering it and
 *   hoping.
 *
 * What a caller supplies is a REGION and a HEADING SELECTOR. Everything else —
 * labels, ids, order, depth, the current row — comes off the DOM. */

export interface SectionNavProps {
  /** The region to index.
   *
   *  Omit it in the common case: the component walks up to its own
   *  `.jrk-section-layout` and indexes that layout's `__body`, so the two-column
   *  markup wires itself and there is nothing to get wrong. Outside that layout
   *  it falls back to the first `main` or `.jrk-content` on the page.
   *
   *  Pass a ref or a selector string only when the region is somewhere those
   *  cannot find. */
  within?: RefObject<HTMLElement | null> | string;
  /** Caption above the list, and the accessible name of the `<nav>` (via
   *  aria-labelledby, so it is announced once rather than twice). */
  title?: ReactNode;
  /** Which elements are sections. Document order decides the order of the index;
   *  position in THIS list decides the depth, so `'h2, h3'` indents every h3 one
   *  step under the h2s.
   *
   *  **The default is right for a DOCUMENT and wrong for a component-dense page,
   *  and that is the one thing to get right at the call site.** On a page of prose
   *  every h2/h3 is a section. On a dashboard almost none of them are: every
   *  `.jrk-card__title`, `.jrk-chart-card__title` and `.jrk-expander__heading` in
   *  this library is an `<h3>`, and the expander's carries an id of its own for
   *  `aria-labelledby`, so it cannot even be filtered out by requiring one. An
   *  unscoped index on such a page lists the tiles.
   *
   *  Scope it positionally instead — `'.my-section > header > h2, .my-section > h3'`
   *  — which is the author declaring which headings are sections. The LABELS still
   *  come off the document, and that is the part that must never be authored.
   *  `preview/dashboard.html` is the worked example; `preview/sections.html` is a
   *  prose page where the default is correct.
   *
   *  Two levels is the cap. A third selector is accepted and clamped to level 2
   *  with a dev warning — see the `--sub` rule in the CSS for why an index deep
   *  enough to need three levels is a layer-1 problem with the page, not a
   *  rendering problem here. */
  headings?: string;
  className?: string;
}

interface Entry {
  id: string;
  label: string;
  level: 1 | 2;
  el: HTMLElement;
}

const DEV = typeof process !== 'undefined' && process.env.NODE_ENV !== 'production';

/* 56px topbar + 16px of air — the same figure --jrk-section-offset resolves to.
   Only reached when the nav's computed `top` is unreadable (no layout yet, or a
   consumer who unset position: sticky). */
const FALLBACK_OFFSET = 72;

/* The reading line sits a few pixels below where a heading comes to rest, so a
   section counts as current the moment its heading reaches its parked position
   rather than one frame later. */
const LINE_SLOP = 8;

function slugify(text: string): string {
  const base = text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 64);
  return base || 'section';
}

function resolveRoot(
  navEl: HTMLElement | null,
  within: SectionNavProps['within'],
): HTMLElement | null {
  if (typeof within === 'string') return document.querySelector<HTMLElement>(within);
  if (within) return within.current;
  const body = navEl?.closest('.jrk-section-layout')?.querySelector<HTMLElement>(
    '.jrk-section-layout__body',
  );
  return body ?? document.querySelector<HTMLElement>('main, .jrk-content');
}

/* Read the offset off the element that already resolved it. The nav's `top` is a
   real CSS property holding exactly the number the sticky index parks at, so the
   browser has done the calc() for us and there is one source rather than a token
   read in CSS and a constant duplicated in JS.

   `cache` is not an optimisation. The nav unmounts when a derive finds nothing —
   a report whose sections arrive from a fetch starts that way — and the NEXT
   derive would then read the offset with no element to read it from and fall back
   to the default, silently ignoring an app that had overridden it. The first
   derive always runs with the nav on screen, so the cached value is the real one. */
function readOffset(navEl: HTMLElement | null, cache: { current: number }): number {
  if (navEl) {
    const top = Number.parseFloat(getComputedStyle(navEl).top);
    if (Number.isFinite(top)) cache.current = top;
  }
  return cache.current;
}

function deriveEntries(root: HTMLElement, headings: string, offset: number): Entry[] {
  const selectors = headings
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  if (DEV && selectors.length > 2) {
    console.warn(
      `[jrk] <SectionNav headings="${headings}"> lists ${selectors.length} levels. Everything past the second is clamped to level 2 — an index that needs three levels means the page is too long, which is a layer-1 problem the index cannot fix.`,
    );
  }

  const entries: Entry[] = [];
  const taken = new Set<string>();

  for (const el of Array.from(root.querySelectorAll<HTMLElement>(headings))) {
    /* data-section-label is the escape hatch for a heading whose full text is a
       sentence. The heading stays long and the index stays scannable, and the
       label still lives ON the section, so it cannot drift either. */
    const label = (el.dataset.sectionLabel ?? el.textContent ?? '').trim();
    if (!label) continue;

    let id = el.id;
    if (!id) {
      id = slugify(label);
      let n = 2;
      while (taken.has(id) || document.getElementById(id)) id = `${slugify(label)}-${n++}`;
      el.id = id;
      if (DEV) {
        console.warn(
          `[jrk] <SectionNav> generated id "${id}" for the section "${label}". Generated ids move when the heading text is edited, which silently breaks every deep link already shared. Put an explicit id on the heading.`,
        );
      }
    }
    if (taken.has(id)) continue;
    taken.add(id);

    /* Both writes are guarded so a re-derive is a no-op on the DOM — the
       MutationObserver below would otherwise be watching for changes this
       function makes. tabIndex is what lets a keyboard reader continue FROM the
       section they jumped to instead of from the index they left. */
    const margin = `${offset}px`;
    if (el.style.scrollMarginTop !== margin) el.style.scrollMarginTop = margin;
    if (el.tabIndex !== -1) el.tabIndex = -1;

    const matched = selectors.findIndex((sel) => el.matches(sel));
    entries.push({ id, label, level: matched <= 0 ? 1 : 2, el });
  }

  return entries;
}

export function SectionNav({
  within,
  title = 'On this page',
  headings = 'h2, h3',
  className,
}: SectionNavProps) {
  const navRef = useRef<HTMLElement>(null);
  const titleId = `${useId()}-title`;

  const [entries, setEntries] = useState<Entry[]>([]);
  const [derived, setDerived] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  /* Read by the scroll handler, which must not be re-bound every time the index
     changes — a listener that is removed and re-added on each derive drops
     events in the gap. */
  const entriesRef = useRef<Entry[]>(entries);
  entriesRef.current = entries;

  /* Set while a click-driven scroll is in flight. Without it the spy reports
     every section the page flies past on a smooth scroll and the marker
     stutters down the list instead of moving once. */
  const lockRef = useRef<string | null>(null);

  /* Last offset read off the live nav — see readOffset for why it is kept. */
  const offsetRef = useRef(FALLBACK_OFFSET);

  /* One entry per rendered row, so the "keep the marked row visible" effect can
     measure a row without querying by id — an id is author-supplied and would
     have to be CSS-escaped before it could go in a selector. */
  const rowRefs = useRef<Array<HTMLAnchorElement | null>>([]);

  /* ---------------------------------------------------------------- derive */

  useEffect(() => {
    const nav = navRef.current;
    const root = resolveRoot(nav, within);

    if (!root) {
      if (DEV) {
        console.warn(
          '[jrk] <SectionNav> found no region to index. Put it in a .jrk-section-layout beside a .jrk-section-layout__body, or pass `within`.',
        );
      }
      setDerived(true);
      return;
    }

    let frame = 0;
    let observer: MutationObserver | null = null;

    const run = () => {
      /* Disconnected across the pass because deriveEntries touches the DOM (ids,
         tabindex, scroll-margin). The writes are guarded to be no-ops on a
         second pass, but the first one on a fresh heading is real, and an
         observer left connected through it would schedule itself forever. */
      observer?.disconnect();
      const next = deriveEntries(root, headings, readOffset(navRef.current, offsetRef));
      setEntries((prev) =>
        prev.length === next.length && prev.every((p, i) => p.id === next[i].id && p.label === next[i].label && p.el === next[i].el)
          ? prev
          : next,
      );
      setDerived(true);
      if (DEV && next.length === 0) {
        console.warn(
          `[jrk] <SectionNav> matched no "${headings}" inside the region it was given, so it renders nothing.`,
        );
      }
      observer?.observe(root, { childList: true, subtree: true, characterData: true });
    };

    const schedule = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        run();
      });
    };

    /* Content that arrives after mount — a loaded report, a revealed section — is
       the normal case on these pages, and an index that only reflects the first
       paint is exactly the drift this component exists to prevent. */
    observer = new MutationObserver(schedule);
    run();

    return () => {
      if (frame) cancelAnimationFrame(frame);
      observer?.disconnect();
    };
  }, [within, headings]);

  /* ------------------------------------------------------------ scroll spy */

  useEffect(() => {
    if (!derived) return;

    let frame = 0;

    /* Last heading that has reached the reading line, which is a POSITION test
       rather than a most-visible test. Most-visible is the obvious implementation
       and it is wrong here for two reasons this product hits constantly: a short
       section between two long ones never wins the comparison and can never be
       marked, and two sections of similar height swap the marker back and forth
       on a single pixel of scroll. */
    const compute = (): string | null => {
      const list = entriesRef.current;
      if (!list.length) return null;

      /* A final section shorter than the remaining viewport can never reach the
         line, so at the bottom of the document it would otherwise be impossible
         to mark. Snap to the last entry instead. */
      const doc = document.documentElement;
      if (window.scrollY + window.innerHeight >= doc.scrollHeight - 2) {
        return list[list.length - 1].id;
      }

      /* Above the first heading the first section is marked rather than nothing.
         An index with no mark reads as broken, and the page top belongs to the
         first section in every sense that matters to a reader. */
      let current = list[0].id;
      const line = readOffset(navRef.current, offsetRef) + LINE_SLOP;
      for (const entry of list) {
        if (entry.el.getBoundingClientRect().top > line) break;
        current = entry.id;
      }
      return current;
    };

    const update = () => {
      if (lockRef.current) return;
      setActiveId(compute());
    };

    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        update();
      });
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [derived]);

  /* A pasted deep link is a first-class way to arrive, so the index marks the
     linked section rather than waiting for the reader to scroll. The browser's
     own anchor jump handles the scrolling and honours the scroll-margin-top set
     during derive. */
  useEffect(() => {
    const fromHash = () => {
      const id = decodeURIComponent(window.location.hash.slice(1));
      if (id && entriesRef.current.some((e) => e.id === id)) setActiveId(id);
    };
    fromHash();
    window.addEventListener('hashchange', fromHash);
    return () => window.removeEventListener('hashchange', fromHash);
  }, [derived]);

  /* ---------------------------------------------------------------- reveal */

  /* THE INDEX SCROLLS TOO. Once a page has more sections than the index column is
     tall, the marked row can be outside the index's own scroll box — and an index
     whose current row is off its own screen answers nothing. This moves that box,
     and only that box.
   *
   * NOT `row.scrollIntoView({ block: 'nearest' })`, which is the obvious call and
   * is wrong here: scrollIntoView walks EVERY scrollable ancestor up to and
   * including the document, so it would re-scroll the page a click had just
   * started moving — the marker would land right and the page would land somewhere
   * else. Scrolling one element by a computed delta is the version that only does
   * what it says.
   *
   * Nearest-edge, never centred. Centring re-scrolls the index on every single
   * step down the list, so a list that is comfortably visible appears to drift
   * under the reader for no reason; this moves only when the row is actually out
   * of view, and only far enough to bring it in. */
  useEffect(() => {
    const nav = navRef.current;
    if (!nav || !activeId) return;
    /* A short index has nothing to scroll, and scrollTo on it is a no-op that
       still costs a layout read. */
    if (nav.scrollHeight <= nav.clientHeight) return;

    const row = rowRefs.current[entries.findIndex((e) => e.id === activeId)];
    if (!row) return;

    const pad = 8;
    const navBox = nav.getBoundingClientRect();
    const rowBox = row.getBoundingClientRect();
    let delta = 0;
    if (rowBox.top < navBox.top + pad) delta = rowBox.top - (navBox.top + pad);
    else if (rowBox.bottom > navBox.bottom - pad) delta = rowBox.bottom - (navBox.bottom - pad);
    if (!delta) return;

    const reduce =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    nav.scrollTo({ top: nav.scrollTop + delta, behavior: reduce ? 'auto' : 'smooth' });
  }, [activeId, entries]);

  /* ----------------------------------------------------------------- click */

  const handleClick = useCallback((event: MouseEvent<HTMLAnchorElement>, entry: Entry) => {
    /* Modified and middle clicks belong to the browser. A section link opened in
       a new tab is a legitimate thing to want and hijacking it is the kind of
       small theft that makes a UI feel untrustworthy. */
    if (event.defaultPrevented) return;
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    event.preventDefault();

    const reduce =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    entry.el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    /* preventScroll because scrollIntoView above already placed the section
       correctly, honouring its scroll-margin; letting focus() scroll as well
       jumps the heading to the very top and back under the topbar. */
    entry.el.focus({ preventScroll: true });

    setActiveId(entry.id);
    lockRef.current = entry.id;
    window.setTimeout(() => {
      lockRef.current = null;
    }, reduce ? 0 : 700);

    /* replaceState, not pushState and not the default anchor navigation. The URL
       has to be citable — "every explored state is a URL" is a hard constraint,
       and a reader who copies the address bar mid-report should get the part they
       are looking at. But the back button belongs to the PAGE: pushing an entry
       per section turns one Back press into eleven and strands the reader inside
       a document they were trying to leave. */
    if (typeof window.history?.replaceState === 'function') {
      window.history.replaceState(null, '', `#${encodeURIComponent(entry.id)}`);
    }
  }, []);

  /* The nav is rendered before the first derive so the effect has an element to
     measure the offset from and to find the layout with. It unmounts only once a
     pass has actually run and found nothing — otherwise a caller would see the
     index flash and vanish on every re-render. */
  if (derived && entries.length === 0) return null;

  return (
    <nav ref={navRef} className={cx('jrk-section-nav', className)} aria-labelledby={titleId}>
      <p className="jrk-section-nav__title" id={titleId}>
        {title}
      </p>
      {entries.length > 0 && (
        <ul className="jrk-section-nav__list">
          {entries.map((entry, i) => (
            <li key={entry.id}>
              <a
                ref={(el) => {
                  rowRefs.current[i] = el;
                }}
                href={`#${entry.id}`}
                className={cx(
                  'jrk-section-nav__link',
                  entry.level === 2 && 'jrk-section-nav__link--sub',
                )}
                /* "location", never "page" — the rail's current-page row is still
                   true and still on screen, and two elements claiming "page" is
                   two answers to where-am-I in the accessibility tree. */
                aria-current={entry.id === activeId ? 'location' : undefined}
                onClick={(event) => handleClick(event, entry)}
              >
                {/* The span is required, not cosmetic: the dot is the anchor's
                    ::after and the label is what fades in and out, so the two
                    have to be separate boxes. It fades with `opacity` and never
                    `display`/`visibility`, which is what keeps every section name
                    in the accessibility tree while the rail reads as bare dots. */}
                <span className="jrk-section-nav__label">{entry.label}</span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </nav>
  );
}
