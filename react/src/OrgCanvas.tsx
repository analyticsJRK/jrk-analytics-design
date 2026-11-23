import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { CSSProperties, PointerEvent as ReactPointerEvent, ReactNode, RefObject } from 'react';
import { Icon } from './Icon';
import { cx } from './utils';

/* Zoom and pan for an org chart too wide for any screen.
 *
 * ZOOM IS THE CSS `zoom` PROPERTY, NOT `transform: scale()`, and that is the
 * whole reason panning works. A transform does not affect layout, so a scaled
 * canvas keeps its unscaled scroll area: zoom in and a third of the chart is
 * unreachable, zoom out and you scroll across empty space. `zoom` is a layout
 * property, so the port recomputes and both scrollbars land where they should.
 * What it costs is that every measurement inside comes back pre-multiplied —
 * natural size is `rect / zoom`, never `offsetWidth`, which engines disagree
 * about under zoom.
 *
 * ANCHORING. A zoom that ignores the pointer walks the chart out from under the
 * cursor, so the scroll correction runs in a layout effect AFTER the browser
 * has laid out at the new scale.
 *
 * `--jrk-org-zoom` is set beside the zoom for CSS that must NOT scale with it —
 * a drop target's outline divides by it to stay a constant size on screen.
 *
 * Put `<OrgChart scroll={false}>` inside: this is the scroller. */

const STEPS = [0.1, 0.15, 0.2, 0.25, 0.35, 0.45, 0.55, 0.7, 0.85, 1, 1.2, 1.4, 1.6];

export interface OrgCanvasProps {
  children: ReactNode;
  /** Controls that belong on the chart's own toolbar — export, a view picker. */
  tools?: ReactNode;
  /** Appended to the pan-and-zoom line, for anything the chart can do that a
   *  reader would otherwise have to discover by trying it ("Drag a card to
   *  reassign"). A `grab` cursor is not discoverable on its own. */
  hint?: ReactNode;
  /** 0.1 is a smudge and that is accepted: Fit is for ORIENTATION, the one job
   *  that survives illegible type. A floor higher than the fit needs makes
   *  "Fit to width" not fit, which reads as the chart being broken. */
  minZoom?: number;
  maxZoom?: number;
  /** Fit to width once, on the first frame with something to measure. Once:
   *  after that the reader's zoom stands. Default on. */
  fitOnMount?: boolean;
  /** On Ctrl+P, zoom the chart to fit a landscape Letter sheet and restore the
   *  reader's zoom afterwards. CSS cannot measure the chart, so the scale is set
   *  here; the stylesheet only un-clips the port. Default on. */
  printFit?: boolean;
  /** The zoomed element, for an exporter: it is the box the zoom sits on, so it
   *  is the one whose size has to be divided back out. */
  innerRef?: RefObject<HTMLDivElement | null>;
  /** Names the scroll region. */
  label?: string;
  className?: string;
}

export function OrgCanvas({
  children, tools, hint, minZoom = 0.1, maxZoom = 1.6, fitOnMount = true, printFit = true, innerRef,
  label = 'Org chart — scrollable', className,
}: OrgCanvasProps) {
  const viewport = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLDivElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [panning, setPanning] = useState(false);
  const clamp = useCallback((z: number) => Math.min(maxZoom, Math.max(minZoom, z)), [minZoom, maxZoom]);

  /* An instruction for one paint, not a rendered value — as state it would cost
     a second render per zoom step. */
  const pending = useRef<{ px: number; py: number; ax: number; ay: number; from: number } | null>(null);

  const zoomTo = useCallback(
    (next: number | ((z: number) => number), anchor?: { x: number; y: number }) => {
      const vp = viewport.current;
      if (!vp) return;
      setZoom((prev) => {
        const value = clamp(typeof next === 'function' ? next(prev) : next);
        if (value === prev) return prev;
        // Default anchor is the middle of the port, so a button press keeps the
        // reader looking at the same part of the chart.
        const ax = anchor?.x ?? vp.clientWidth / 2;
        const ay = anchor?.y ?? vp.clientHeight / 2;
        pending.current = { px: vp.scrollLeft + ax, py: vp.scrollTop + ay, ax, ay, from: prev };
        return value;
      });
    },
    [clamp],
  );

  useLayoutEffect(() => {
    const p = pending.current;
    const vp = viewport.current;
    if (!p || !vp) return;
    pending.current = null;
    const k = zoom / p.from;
    vp.scrollLeft = p.px * k - p.ax;
    vp.scrollTop = p.py * k - p.ay;
  }, [zoom]);

  /* Ctrl/⌘ + wheel, the convention every map uses. Registered by hand because
     React's onWheel is passive and cannot preventDefault — without it the
     browser zooms the whole page. A bare wheel still scrolls. */
  useEffect(() => {
    const vp = viewport.current;
    if (!vp) return;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const rect = vp.getBoundingClientRect();
      // Exponential in the delta, so a trackpad pinch (many small deltas) and a
      // mouse wheel (few large ones) travel about the same per gesture.
      zoomTo((z) => z * Math.exp(-e.deltaY / 420), { x: e.clientX - rect.left, y: e.clientY - rect.top });
    };
    vp.addEventListener('wheel', onWheel, { passive: false });
    return () => vp.removeEventListener('wheel', onWheel);
  }, [zoomTo]);

  /** Scale the chart into the port's width. Never past 100% — a small org
   *  would otherwise be blown up to fill a wide monitor. */
  const fit = useCallback(() => {
    const vp = viewport.current;
    const el = canvas.current;
    if (!vp || !el) return;
    const natural = el.getBoundingClientRect().width / zoom;
    if (!natural) return;
    const style = getComputedStyle(vp);
    const inner = vp.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
    zoomTo(Math.min(1, inner / natural), { x: 0, y: 0 });
  }, [zoom, zoomTo]);

  /* Once, via a frame: on the first paint the chart has no width, so `fit`
     would return without doing anything. A ResizeObserver would re-fit on every
     window resize, which is the behaviour this is not. */
  const fitted = useRef(false);
  useEffect(() => {
    if (!fitOnMount || fitted.current) return;
    const id = requestAnimationFrame(() => {
      const el = canvas.current;
      if (!el || !el.getBoundingClientRect().width) return;
      fitted.current = true;
      fit();
    });
    return () => cancelAnimationFrame(id);
  });

  /* Drag to pan, with pointer capture so a drag that leaves the port keeps
     tracking. Never from something the pointer is meant to OPERATE — and
     `[draggable="true"]` is in that list because pointer capture stops the
     browser from starting a native drag: without it a draggable card pans the
     chart and `dragstart` never fires, with no error anywhere. */
  const drag = useRef<{ x: number; y: number; sl: number; st: number } | null>(null);

  function onPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest('a, button, summary, input, select, textarea, label, [draggable="true"]')) return;
    const vp = viewport.current;
    if (!vp) return;
    vp.setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, sl: vp.scrollLeft, st: vp.scrollTop };
    setPanning(true);
  }

  function onPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    const d = drag.current;
    const vp = viewport.current;
    if (!d || !vp) return;
    vp.scrollLeft = d.sl - (e.clientX - d.x);
    vp.scrollTop = d.st - (e.clientY - d.y);
  }

  function endPan(e: ReactPointerEvent<HTMLDivElement>) {
    if (!drag.current) return;
    drag.current = null;
    setPanning(false);
    if (viewport.current?.hasPointerCapture(e.pointerId)) viewport.current.releasePointerCapture(e.pointerId);
  }

  // The nearest stop in the direction of travel, so a wheel-set 0.63 steps to
  // 0.7 rather than back to 0.55.
  const step = (dir: 1 | -1) =>
    zoomTo((z) => {
      const stops = STEPS.filter((s) => s >= minZoom - 1e-9 && s <= maxZoom + 1e-9);
      const next = dir > 0 ? stops.find((s) => s > z + 0.001) : [...stops].reverse().find((s) => s < z - 0.001);
      return next ?? z;
    });

  /* FIT TO THE SHEET ON Ctrl+P. Letter landscape at 0.4in margins is an
     ASSUMPTION — the browser never says which paper was picked — and getting it
     wrong costs a chart smaller than it needed to be, never a clipped one,
     which is why the scale is capped at 1. Restored to the reader's zoom, not to
     1. `beforeprint` does not fire for a print made inside a hidden iframe, so
     an export (`printElement`) cannot fight this. */
  useEffect(() => {
    if (!printFit) return;
    const PRINTABLE_IN = { w: 11 - 0.8, h: 8.5 - 0.8 };
    const before = () => {
      const el = canvas.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const natural = { w: rect.width / (zoom || 1), h: rect.height / (zoom || 1) };
      if (natural.w <= 0 || natural.h <= 0) return;
      const k = Math.min((PRINTABLE_IN.w * 96) / natural.w, (PRINTABLE_IN.h * 96) / natural.h, 1);
      el.dataset.printZoom = String(zoom);
      el.style.setProperty('zoom', String(k));
      el.style.setProperty('--jrk-org-zoom', String(k));
    };
    const after = () => {
      const el = canvas.current;
      if (!el) return;
      const z = el.dataset.printZoom ?? String(zoom);
      el.style.setProperty('zoom', z);
      el.style.setProperty('--jrk-org-zoom', z);
      delete el.dataset.printZoom;
    };
    window.addEventListener('beforeprint', before);
    window.addEventListener('afterprint', after);
    return () => {
      window.removeEventListener('beforeprint', before);
      window.removeEventListener('afterprint', after);
    };
  }, [zoom, printFit]);

  const pct = Math.round(zoom * 100);

  return (
    <div className={cx('jrk-org-canvas', className)}>
      <div className="jrk-org-canvas__bar">
        <div className="jrk-org-canvas__zoom" role="group" aria-label="Zoom">
          <button
            className="jrk-btn jrk-btn--secondary jrk-btn--sm jrk-btn--icon"
            type="button"
            onClick={() => step(-1)}
            disabled={zoom <= minZoom + 0.001}
            aria-label="Zoom out"
          >
            <Icon name="minus" />
          </button>
          {/* The readout IS the reset: a "100%" button beside a "100%" label is
              one control too many. */}
          <button
            className="jrk-btn jrk-btn--ghost jrk-btn--sm jrk-org-canvas__pct"
            type="button"
            onClick={() => zoomTo(1)}
            aria-label={`Zoom is ${pct} percent — reset to 100%`}
          >
            {pct}%
          </button>
          <button
            className="jrk-btn jrk-btn--secondary jrk-btn--sm jrk-btn--icon"
            type="button"
            onClick={() => step(1)}
            disabled={zoom >= maxZoom - 0.001}
            aria-label="Zoom in"
          >
            <Icon name="plus" />
          </button>
        </div>
        <button className="jrk-btn jrk-btn--secondary jrk-btn--sm" type="button" onClick={fit}>
          Fit to width
        </button>
        {tools && <div className="jrk-org-canvas__tools">{tools}</div>}
        <p className="jrk-org-canvas__hint">
          Drag to pan · ⌘/Ctrl + scroll to zoom
          {hint ? ' · ' : ''}
          {hint}
        </p>
      </div>

      {/* Focusable, so arrow keys and Page Up/Down scroll it for anyone not
          using a pointer — otherwise the chart is reachable only by tabbing
          through every link inside it. */}
      <div
        className={cx('jrk-org-canvas__view', panning && 'jrk-org-canvas__view--panning')}
        ref={viewport}
        tabIndex={0}
        role="group"
        aria-label={label}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endPan}
        onPointerCancel={endPan}
      >
        <div
          className="jrk-org-canvas__inner"
          ref={(el) => {
            canvas.current = el;
            if (innerRef) (innerRef as { current: HTMLDivElement | null }).current = el;
          }}
          style={{ zoom, ['--jrk-org-zoom' as string]: String(zoom) } as CSSProperties}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
