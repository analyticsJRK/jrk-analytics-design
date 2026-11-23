import { useCallback, useEffect, useState } from 'react';
import type { CSSProperties } from 'react';

/* A table port that ends at the bottom of the window. Upstreamed from the portal
 * (lib/useFitToViewport.ts + components/FitTableWrap.tsx), where about forty screens use it.
 *
 *   const fit = useFitHeight({ container: '.app-main' });
 *   <div ref={fit.ref} className="jrk-table-wrap" style={fit.style}>…</div>
 *
 * WHY MEASURED. "Fits the screen" is window height minus whatever is above the table, and that is
 * not a constant: a page header, a section strip, a banner present in one mode, a filter row that
 * wraps at a narrower window. `calc(100vh - 571px)` is what the alternative looks like — right for
 * one screen at one width, and a doubled scrollbar everywhere else within the week.
 *
 * IT WRITES `--jrk-table-height`, NEVER `max-height`, and that is what keeps the table printable.
 * table.css removes the cap under `@media print`; an inline `max-height` outranks that rule, so the
 * table would print the rows inside the window and silently drop the rest.
 *
 * WHAT IS BELOW THE PORT IS MEASURED TOO. The target is the bottom of the CONTENT COLUMN
 * (`container`), not of the window, so a card footer under the table keeps its place instead of
 * being pushed past the fold. The tail is invariant under the cap — nothing below the port depends
 * on its height — so the measurement is stable. And where the tail is most of the page (a stack of
 * panels), the arithmetic leaves less than `min`, the hook answers `undefined`, and the port keeps
 * the library's 70vh default with a scrolling page. A screen that should not fit opts out by being
 * shaped like one rather than by being remembered.
 *
 * A CALLBACK REF, NOT A REF OBJECT. A ref object read in an effect misses a port that mounts late —
 * a table rendered after a spinner — because nothing in the dependency list changes when it lands,
 * and it measures nothing once and never again. Setting the node as state re-runs the effect when
 * the element actually arrives. */

export interface FitHeightOptions {
  /** Space to leave under the port, in viewport pixels. Default 24 — a page's own bottom margin. */
  gutter?: number;
  /** Never cap below this, in viewport pixels. Under it the hook answers `undefined` and the port
   *  keeps the library default: a 90px port with a frozen header is not a usable table. */
  min?: number;
  /** A CSS `zoom` in force on an ancestor. `getBoundingClientRect` reports real pixels, but a length
   *  set inside `zoom: 0.8` renders at 80% of itself, so the answer is divided by this. */
  zoom?: number;
  /** The content column the port is fitted into: a selector matched with `closest()` from the
   *  port, or an element. Unset, or no match, is `document.body`. */
  container?: string | Element | null;
}

export interface FitHeight {
  /** Put this on the element that should end at the bottom of the window. */
  ref: (node: HTMLElement | null) => void;
  /** The cap in the element's own units, or `undefined` for "do not cap". */
  height: number | undefined;
  /** `{ '--jrk-table-height': '<n>px' }`, or `undefined` — hand it straight to `style`. */
  style: CSSProperties | undefined;
}

export function useFitHeight({ gutter = 24, min = 260, zoom = 1, container }: FitHeightOptions = {}): FitHeight {
  const [node, setNode] = useState<HTMLElement | null>(null);
  const [height, setHeight] = useState<number | undefined>(undefined);
  const ref = useCallback((next: HTMLElement | null) => setNode(next), []);

  useEffect(() => {
    if (!node) {
      setHeight(undefined);
      return undefined;
    }
    const column =
      (typeof container === 'string' ? node.closest(container) : container) ?? document.body;

    let frame = 0;
    const measure = () => {
      frame = 0;
      const box = node.getBoundingClientRect();
      // Clamped at zero: a port that overflows its column reports a negative tail, and subtracting
      // that would hand the port MORE room than the window has.
      const tail = Math.max(0, column.getBoundingClientRect().bottom - box.bottom);
      const room = window.innerHeight - box.top - tail - gutter;
      setHeight(room >= min ? room / (zoom || 1) : undefined);
    };
    // Coalesced to a frame: an observer that measures and then changes a size is a loop unless
    // something breaks it, and this also keeps "ResizeObserver loop completed" out of the console.
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };

    measure();
    // The port (its columns re-wrapped), the page (a banner above it appeared), and the column (a
    // footer under it grew — a resize of neither of the other two).
    const ro = new ResizeObserver(schedule);
    ro.observe(node);
    ro.observe(document.body);
    if (column !== document.body) ro.observe(column);
    window.addEventListener('resize', schedule);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      ro.disconnect();
      window.removeEventListener('resize', schedule);
    };
  }, [node, gutter, min, zoom, container]);

  const style = height
    ? ({ '--jrk-table-height': `${Math.round(height)}px` } as CSSProperties)
    : undefined;
  return { ref, height, style };
}
