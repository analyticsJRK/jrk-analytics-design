import { useEffect } from 'react';
import { typeaheadMatch, normalizeTypeaheadLabel, typeaheadOrder, TYPEAHEAD_RESET_MS } from './typeahead';

/* Type a rail row, tab or section name to jump to it — File Explorer's type-to-select. The
 * rules (what matches, in what order) are in typeahead.ts; this finds the levels on the
 * page, listens for keys and moves focus. Mount it ONCE, inside the shell. Renders nothing.
 *
 * READ OFF THE RENDERED PAGE, NOT DECLARED BY EACH STRIP. A strip that had to opt in is a
 * strip that one day forgets to, so a LEVEL is anything matching `strips` that holds links —
 * the markup every tab row and <SubNav> already emits — plus the rail. `data-typeahead` opts
 * in anything that does not look like a tab row. A button-only `.jrk-btn-group` (Chart |
 * Table) holds no links, so it is not a level: it switches a view, it does not navigate.
 *
 * FOCUS IS THE HIGHLIGHT. Moving focus gets the library's focus ring, tells a screen reader
 * where it is, and makes Enter open the item with no extra code. A separate "selected" state
 * would be a second cursor beside the browser's.
 *
 * LETTERS ARE LEFT ALONE wherever something else reads them: fields, selects, and the widgets
 * that own their keys (listbox, menu, grid, tree, combobox, dialogs). The handler is on the
 * document and checks `defaultPrevented`, so a component that handles a key first keeps it. */

export interface NavTypeaheadProps {
  /** The rail — level 0. Default `.jrk-sidebar__nav`. */
  rail?: string;
  /** The page's strips — levels 1.., in document order. Default: every `.jrk-tabs` nav and
   *  every link-bearing `.jrk-btn-group` inside `main`, plus `[data-typeahead]`. */
  strips?: string;
  /** Focus inside any of these keeps its letters. Default: fields, selects, editable text and
   *  the roles that own a key contract. */
  ownsKeys?: string;
  /** Text inside an item that is not part of its name — an alert disc, a decorative glyph. */
  skipText?: string;
  /** A pause longer than this starts a new search. Default 1000. */
  resetMs?: number;
  /** How long the next level has to appear after Enter. A first screen can take a few
   *  seconds to stream in; past this the reader has moved on. Default 8000. */
  descendWaitMs?: number;
  /** With no deeper level on the new page, focus returns to the level it came from once the
   *  page has stopped changing for this long. Default 400. */
  settleMs?: number;
}

export const NAV_TYPEAHEAD_DEFAULTS = {
  rail: '.jrk-sidebar__nav',
  strips: ['main nav.jrk-tabs', 'main .jrk-btn-group:is(nav, [role="group"])', 'main [data-typeahead]'].join(', '),
  ownsKeys: [
    'input', 'textarea', 'select', '[contenteditable]:not([contenteditable="false"])',
    '[role="listbox"]', '[role="combobox"]', '[role="menu"]', '[role="menubar"]',
    '[role="grid"]', '[role="treegrid"]', '[role="tree"]',
    '[role="dialog"]', '[role="alertdialog"]', 'dialog', '[aria-modal="true"]',
  ].join(', '),
  skipText: '.jrk-subnav__alert, [aria-hidden="true"]',
  descendWaitMs: 8000,
  settleMs: 400,
} as const;

type Level = { box: Element; items: HTMLAnchorElement[] };

export function NavTypeahead({
  rail = NAV_TYPEAHEAD_DEFAULTS.rail,
  strips = NAV_TYPEAHEAD_DEFAULTS.strips,
  ownsKeys = NAV_TYPEAHEAD_DEFAULTS.ownsKeys,
  skipText = NAV_TYPEAHEAD_DEFAULTS.skipText,
  resetMs = TYPEAHEAD_RESET_MS,
  descendWaitMs = NAV_TYPEAHEAD_DEFAULTS.descendWaitMs,
  settleMs = NAV_TYPEAHEAD_DEFAULTS.settleMs,
}: NavTypeaheadProps) {
  useEffect(() => {
    /* The links a level offers, in order. Hidden ones are skipped (a closed rail section, a
       strip in a collapsed card). Repeats are dropped once, in startBurst. */
    const itemsOf = (box: Element): HTMLAnchorElement[] =>
      [...box.querySelectorAll<HTMLAnchorElement>('a[href]')].filter(
        (a) => a.getAttribute('aria-disabled') !== 'true' && a.getClientRects().length > 0,
      );

    /* Index 0 is the rail, then the strips top to bottom. A level with nothing to offer is
       left out, so "the next level down" never lands on an empty row. */
    const levels = (): { rail: Level | null; strips: Level[] } => {
      const railBox = document.querySelector(rail);
      const railLevel = railBox ? { box: railBox, items: itemsOf(railBox) } : null;
      const found: Level[] = [];
      document.querySelectorAll(strips).forEach((box) => {
        /* A strip nested in another strip (a section row inside a [data-typeahead] wrapper)
           is reached through the outer one; listing both would offer each link twice. */
        if (found.some((l) => l.box.contains(box))) return;
        const items = itemsOf(box);
        if (items.length > 0) found.push({ box, items });
      });
      return { rail: railLevel && railLevel.items.length ? railLevel : null, strips: found };
    };

    /* What the reader SEES as the name. A rail row carries it in `.jrk-nav-item__label`
       beside an icon or glyph; a tab is its text minus any alert disc or decoration. */
    const labelOf = (a: HTMLElement): string => {
      const own = a.querySelector('.jrk-nav-item__label');
      if (own) return normalizeTypeaheadLabel(own.textContent ?? '');
      let text = '';
      const walk = (node: Node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          text += node.textContent ?? '';
          return;
        }
        if (node instanceof Element && node.matches(skipText)) return;
        node.childNodes.forEach(walk);
      };
      walk(a);
      return normalizeTypeaheadLabel(text || a.getAttribute('aria-label') || '');
    };

    /* Arriving at a level lands on the item the page says is current, which is where
       Explorer's cursor sits in a folder you have just opened. */
    const entryOf = (level: Level): HTMLAnchorElement =>
      level.items.find((a) => a.getAttribute('aria-current') === 'page') ?? level.items[0];

    /* One burst of typing: what has been typed, when, and the list it is searched over. The
       list is built at the first key and KEPT until the pause — see typeaheadOrder. */
    let buffer = '';
    let last = -Infinity;
    let list: HTMLAnchorElement[] = [];
    let labels: string[] = [];
    let cancelDescent: (() => void) | null = null;

    function startBurst(active: Element | null) {
      const found = levels();
      const all = found.rail ? [found.rail, ...found.strips] : found.strips;
      const focused = active ? all.findIndex((l) => l.box.contains(active)) : -1;
      const current = focused >= 0 ? all[focused].items.indexOf(active as HTMLAnchorElement) : -1;
      /* ONE STOP PER NAMED DESTINATION, keyed on address AND name. The rail repeats a pinned
         row and an open module's sections, which are the same pages as the strip — keyed on
         address alone, a group tab that links to its first section would hide that section's
         own name, and a reader may type either. */
      const seen = new Set<string>();
      list = [];
      labels = [];
      for (const a of typeaheadOrder(all.map((l) => l.items), focused, current)) {
        const label = labelOf(a);
        const key = `${a.href}\n${label}`;
        if (seen.has(key)) continue;
        seen.add(key);
        list.push(a);
        labels.push(label);
      }
    }

    /* ENTER OPENS, THEN FOCUS GOES ONE LEVEL DOWN — the folder just opened. The link
       navigates on its own; this waits for the new page and places focus: from the rail on
       the first strip, from a strip on the strip below it, and with nothing below back on
       the same level so the reader can keep typing.

       It waits for the ADDRESS to change before looking, because until then the old page's
       strips are still on screen and would be found instead. It gives up if the reader
       clicks or puts focus anywhere else meanwhile. */
    function descend(link: HTMLAnchorElement) {
      cancelDescent?.();
      const found = levels();
      let depth = -1;
      if (found.rail?.box.contains(link)) depth = 0;
      else {
        const k = found.strips.findIndex((s) => s.box.contains(link));
        if (k >= 0) depth = k + 1;
      }
      if (depth < 0) return;
      if (link.target && link.target !== '_self') return;

      const from = location.href;
      const sameAddress = new URL(link.href, from).href === from;

      const land = (final: boolean): boolean => {
        const active = document.activeElement;
        if (active && active !== document.body && active !== link) return true;
        const now = levels().strips;
        let target = now[depth];
        if (!target && final && depth > 0 && now.length > 0) target = now[Math.min(depth - 1, now.length - 1)];
        if (!target) return final;
        entryOf(target).focus();
        return true;
      };

      let quiet: number | undefined;
      const check = () => {
        if (!sameAddress && location.href === from) return;
        if (land(false)) {
          stop();
          return;
        }
        window.clearTimeout(quiet);
        quiet = window.setTimeout(() => {
          land(true);
          stop();
        }, settleMs);
      };
      const observer = new MutationObserver(check);
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['aria-current'],
      });
      const giveUp = window.setTimeout(() => stop(), descendWaitMs);
      const onPointer = () => stop();
      document.addEventListener('pointerdown', onPointer, true);
      function stop() {
        observer.disconnect();
        window.clearTimeout(quiet);
        window.clearTimeout(giveUp);
        document.removeEventListener('pointerdown', onPointer, true);
        if (cancelDescent === stop) cancelDescent = null;
      }
      cancelDescent = stop;
      // Enter on the page already open never changes the address, so nothing would wake us.
      if (sameAddress) requestAnimationFrame(check);
    }

    function onKey(e: KeyboardEvent) {
      if (e.defaultPrevented || e.isComposing || e.ctrlKey || e.metaKey || e.altKey) return;
      const active = document.activeElement as HTMLElement | null;
      if (active?.closest(ownsKeys)) return;

      if (e.key === 'Enter') {
        // Shift+Enter opens a new window; this page is not changing.
        if (!e.shiftKey && active instanceof HTMLAnchorElement) descend(active);
        return;
      }
      if (e.key === 'Escape') {
        buffer = '';
        last = -Infinity;
        return;
      }
      if (e.key.length !== 1) return;

      const fresh = e.timeStamp - last > resetMs;
      /* A space only continues a name ("action c…"). As the first key it is the browser's —
         it presses a focused button and scrolls the page — and taking it breaks both. */
      if (e.key === ' ' && (fresh || !buffer)) return;
      last = e.timeStamp;
      if (fresh) buffer = '';
      /* The page can re-render mid-burst (a strip streaming in): rebuild from where focus is
         now and keep the letters typed so far. */
      if (fresh || !list.every((a) => a.isConnected)) startBurst(active);
      buffer += e.key.toLowerCase();

      const at = typeaheadMatch(labels, buffer, active ? list.indexOf(active as HTMLAnchorElement) : -1);
      if (at < 0) return;
      e.preventDefault();
      cancelDescent?.();
      list[at].focus();
    }

    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      cancelDescent?.();
    };
  }, [rail, strips, ownsKeys, skipText, resetMs, descendWaitMs, settleMs]);

  return null;
}
