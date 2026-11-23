import { useEffect, useLayoutEffect, useRef } from 'react';
import type { RefObject } from 'react';

/* FLOATING PANELS — one placement routine for every panel that must escape a clip.
 *
 * `.jrk-card` is `overflow: clip` and `.jrk-table-wrap` scrolls, so an absolutely
 * positioned panel inside either is cut off at its edge. A panel shown as
 * `popover="manual"` paints in the top layer above every clip while keeping its DOM
 * place (so Tab order, `contains()` and inherited styles behave), and this file writes
 * its viewport coordinates into the three custom properties `.jrk-menu--floating`
 * reads (feedback.css). <Menu>, <ColumnFilter> and <Combobox> all use it — before
 * 2026-11-23 the first two each carried a private copy, the shape that drifts.
 */


const GAP = 4;
const EDGE = 8;

/** Whether any of the trigger is still visible inside the viewport AND every clipping ancestor. A
 *  funnel in a heading scrolls out of `.jrk-table-wrap` long before it leaves the screen, and a
 *  panel left behind would float over whatever is there now. */
function visible(trigger: HTMLElement, r: DOMRect, vw: number, vh: number): boolean {
  let top = 0;
  let left = 0;
  let bottom = vh;
  let right = vw;
  for (let a = trigger.parentElement; a && a !== document.body; a = a.parentElement) {
    const s = getComputedStyle(a);
    if (s.overflowX === 'visible' && s.overflowY === 'visible') continue;
    const b = a.getBoundingClientRect();
    top = Math.max(top, b.top);
    left = Math.max(left, b.left);
    bottom = Math.min(bottom, b.bottom);
    right = Math.min(right, b.right);
  }
  return r.bottom > top && r.top < bottom && r.right > left && r.left < right;
}

/** Places `panel` against `trigger` in viewport coordinates: below unless it does not fit there and
 *  there is more room above, never taller than the room on its side, clamped off the viewport edge.
 *  `minWidth` matches a panel to its trigger (a combobox list as wide as its button). Returns false
 *  when the trigger has scrolled out of view. */
export function placeFloating(
  trigger: HTMLElement,
  panel: HTMLElement,
  align: 'start' | 'end',
  minWidth = false,
): boolean {
  const r = trigger.getBoundingClientRect();
  const vw = document.documentElement.clientWidth;
  const vh = document.documentElement.clientHeight;
  if (!visible(trigger, r, vw, vh)) return false;

  if (minWidth) panel.style.minWidth = `${Math.round(r.width)}px`;
  const below = vh - r.bottom - GAP - EDGE;
  const above = r.top - GAP - EDGE;
  const natural = panel.scrollHeight + panel.offsetHeight - panel.clientHeight;
  const up = natural > below && above > below;
  panel.dataset.side = up ? 'top' : 'bottom';
  panel.style.setProperty('--jrk-menu-y', `${up ? vh - r.top + GAP : r.bottom + GAP}px`);
  panel.style.setProperty('--jrk-menu-room', `${Math.max(0, up ? above : below)}px`);

  panel.style.setProperty('--jrk-menu-x', '0px');
  const w = panel.offsetWidth;
  const leftEdge = (align === 'start') !== (getComputedStyle(trigger).direction === 'rtl');
  const x = leftEdge ? r.left : r.right - w;
  panel.style.setProperty('--jrk-menu-x', `${Math.max(EDGE, Math.min(x, vw - w - EDGE))}px`);
  return true;
}

const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

/** Shows `panel` in the top layer while `open` and keeps it against `trigger` through scrolls,
 *  resizes and its own height changing. Calls `onLost` when the trigger scrolls out of view. */
export function useFloatingPanel(
  open: boolean,
  trigger: RefObject<HTMLElement | null>,
  panel: RefObject<HTMLElement | null>,
  onLost: () => void,
  { align = 'end', minWidth = false }: { align?: 'start' | 'end'; minWidth?: boolean } = {},
) {
  const lost = useRef(onLost);
  lost.current = onLost;
  useIsoLayoutEffect(() => {
    if (!open) return;
    const t = trigger.current;
    const p = panel.current;
    if (!t || !p) return;
    if (typeof p.showPopover === 'function' && !p.matches(':popover-open')) p.showPopover();
    if (!placeFloating(t, p, align, minWidth)) {
      lost.current();
      return;
    }
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (!placeFloating(t, p, align, minWidth)) lost.current();
      });
    };
    // Capture: a scroll inside the table wrap does not bubble to window. The panel's own list
    // scrolling moves nothing.
    const onScroll = (e: Event) => {
      if (e.target instanceof Node && p.contains(e.target)) return;
      update();
    };
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', update);
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(update) : undefined;
    observer?.observe(t);
    observer?.observe(p);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', update);
      observer?.disconnect();
    };
  }, [open, align, minWidth]);
}
