import { createElement, useCallback, useEffect, useLayoutEffect, useState } from 'react';
import type { ReactNode, RefObject } from 'react';

/* Shared chart arithmetic and the two hooks every hand-drawn chart needs.
 *
 * Exported because the portal copied each of these at least twice (two
 * `useWidth`s, two `niceMax`s, three tooltips) and the copies had already
 * drifted — one skipped a palette slot, one floored its width at 320 and the
 * other at 240. One copy here is the fix. */

const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

/** Tracks an element's content width so an SVG viewBox stays 1:1 with CSS
 *  pixels. A fixed viewBox stretched by `width: 100%` scales the TEXT and the
 *  hairlines too (charts.md §7). Falls back to `initial` before measurement and
 *  on the server. */
export function useContainerWidth(ref: RefObject<HTMLElement | null>, initial: number, floor = 240) {
  const [w, setW] = useState(initial);

  // Layout effect so the first paint already has the measured width.
  useIsoLayoutEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(([entry]) => {
      // The SVG is width:100% of this element, so a viewBox change cannot move
      // the measured width — no feedback loop.
      const next = Math.max(floor, Math.round(entry.contentRect.width));
      setW((prev) => (prev === next ? prev : next));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref, floor]);

  return w;
}

/** A floating tooltip that follows the pointer, in the library's own
 *  `.jrk-chart-tooltip` markup. `position: fixed`, so it is never clipped by a
 *  card's overflow; clamped so it never leaves the viewport. */
export function useChartTip() {
  const [tip, setTip] = useState<{ x: number; y: number; head?: ReactNode; rows: ReactNode[] } | null>(null);

  const show = useCallback((x: number, y: number, head: ReactNode | undefined, rows: ReactNode[]) => {
    setTip({ x, y, head, rows });
  }, []);
  const hide = useCallback(() => setTip(null), []);

  let node: ReactNode = null;
  if (tip) {
    const vw = typeof window === 'undefined' ? 1200 : window.innerWidth;
    // Flip to the pointer's left once it nears the right edge rather than
    // running off-screen; 240 is the tooltip's practical width.
    const left = tip.x + 14 + 240 > vw ? Math.max(8, tip.x - 254) : tip.x + 14;
    node = createElement(
      'div',
      { className: 'jrk-chart-tooltip jrk-chart-tooltip--fixed', style: { left, top: tip.y + 14 } },
      tip.head != null ? createElement('div', { className: 'jrk-chart-tooltip__header' }, tip.head) : null,
      ...tip.rows,
    );
  }
  return { show, hide, node };
}

/** A tick step of 1, 2, 2.5 or 5 x 10^k that cuts `span` into about `count`
 *  intervals. Round steps are what make the labels numbers a reader would have
 *  chosen — "6,906" is arithmetic, not an axis. */
export function niceStep(span: number, count = 4): number {
  if (!(span > 0) || !Number.isFinite(span)) return 1;
  const raw = span / count;
  const p = 10 ** Math.floor(Math.log10(raw));
  return ([1, 2, 2.5, 5, 10].find((m) => raw <= m * p) ?? 10) * p;
}

/** Axis ticks covering [lo, hi] on a round step.
 *
 *  ZERO IS IN THE DOMAIN of anything non-negative, because a count truncated at
 *  its own floor exaggerates every step. `fromZero: false` is for a rating,
 *  where a 4.06 drawn from zero is a flat line in an empty box. A signed series
 *  keeps zero too — "above" and "below" only read against a visible zero. */
export function axisTicks(lo: number, hi: number, { fromZero = true, count = 4 } = {}) {
  let bottom = lo;
  let top = hi;
  if (!Number.isFinite(bottom) || !Number.isFinite(top)) return { min: 0, max: 1, ticks: [0, 1], step: 1 };
  if (lo >= 0 && fromZero) bottom = 0;
  if (hi <= 0 && lo < 0) top = 0;
  if (lo < 0 && hi > 0) {
    bottom = Math.min(bottom, 0);
    top = Math.max(top, 0);
  }
  if (!fromZero && lo >= 0) {
    const span = top - bottom || Math.abs(top) || 1;
    bottom = Math.max(0, bottom - span * 0.25);
  }
  const step = niceStep(top - bottom || Math.abs(top) || 1, count);
  // The floor is the last tick AT OR UNDER the data, so a signed axis does not
  // buy a whole empty gridline below its minimum.
  const first = Math.floor(bottom / step + 1e-9) * step;
  const snap = (v: number) => (Math.abs(v) < step * 1e-9 ? 0 : Number(v.toFixed(6)));
  const ticks: number[] = [];
  // Generated until the top is covered; the cap stops a pathological step looping.
  for (let i = 0; i < 12; i += 1) {
    ticks.push(snap(first + step * i));
    if (ticks[ticks.length - 1] >= top - 1e-9) break;
  }
  if (ticks.length < 2) ticks.push(snap(first + step));
  /* A SMALL NEGATIVE ARM DOES NOT BUY A WHOLE STEP. A -44 under a 958 top on a
     500 step would floor the axis at -500 and spend a third of the plot on
     nothing; the floor then stops just under the data, off-tick, and only the
     ticks inside it are drawn. Zero is always among them. */
  let min = ticks[0];
  if (lo < 0 && hi > 0 && first < lo) {
    const padded = lo - (top - bottom) * 0.06;
    if (padded > first) {
      min = padded;
      while (ticks.length > 2 && ticks[0] < min) ticks.shift();
    }
  }
  return { min, max: ticks[ticks.length - 1], ticks, step };
}

/** Thousands-compact for an axis gutter: 1,284 / 12K / 3.4M. Never for a
 *  tooltip, which exists to give the exact figure. */
export function compactNumber(n: number): string {
  const a = Math.abs(n);
  if (a >= 1e9) return `${Number((n / 1e9).toFixed(1))}B`;
  if (a >= 1e6) return `${Number((n / 1e6).toFixed(1))}M`;
  if (a >= 1e4) return `${Number((n / 1e3).toFixed(0))}K`;
  return Number.isInteger(n) ? n.toLocaleString() : Number(n.toFixed(2)).toLocaleString();
}

/** A column with a rounded data end and a square baseline (charts.md §3).
 *  `down` rounds the bottom instead, for a value below zero. */
export function columnPath(x: number, y: number, w: number, h: number, r = 4, down = false): string {
  if (h <= 0 || w <= 0) return '';
  const k = Math.min(r, w / 2, h);
  if (down) {
    return `M${x},${y}V${y + h - k}Q${x},${y + h} ${x + k},${y + h}H${x + w - k}Q${x + w},${y + h} ${x + w},${y + h - k}V${y}Z`;
  }
  return `M${x},${y + h}V${y + k}Q${x},${y} ${x + k},${y}H${x + w - k}Q${x + w},${y} ${x + w},${y + k}V${y + h}Z`;
}

/** A square-ended rect as a path, for the interior segments of a stack. */
export function rectPath(x: number, y: number, w: number, h: number): string {
  if (h <= 0 || w <= 0) return '';
  return `M${x},${y}h${w}v${h}h${-w}Z`;
}

/** Contiguous runs of present values, as [index, value] pairs. A missing
 *  point is a GAP, never a zero: drawn at the axis a line dives to the floor
 *  and reads as a collapse. A run of one is kept — it is a real reading and has
 *  to be drawn as a dot, since a path through one point draws nothing. */
export function runsOf(values: ReadonlyArray<number | null | undefined>): [number, number][][] {
  const runs: [number, number][][] = [];
  let run: [number, number][] = [];
  values.forEach((v, i) => {
    if (v == null || !Number.isFinite(v)) {
      if (run.length) runs.push(run);
      run = [];
      return;
    }
    run.push([i, v]);
  });
  if (run.length) runs.push(run);
  return runs;
}

/** Least-squares fit over the present points, indexed against the FULL list —
 *  re-indexing after dropping gaps would slide a gap closed and draw the trend
 *  across months with no data. Null below two points. */
export function linearFit(values: ReadonlyArray<number | null | undefined>) {
  const pts = values
    .map((v, i) => ({ i, v }))
    .filter((p): p is { i: number; v: number } => p.v != null && Number.isFinite(p.v));
  if (pts.length < 2) return null;
  const n = pts.length;
  const sx = pts.reduce((a, p) => a + p.i, 0);
  const sy = pts.reduce((a, p) => a + p.v, 0);
  const sxy = pts.reduce((a, p) => a + p.i * p.v, 0);
  const sxx = pts.reduce((a, p) => a + p.i * p.i, 0);
  const denom = n * sxx - sx * sx;
  const slope = denom ? (n * sxy - sx * sy) / denom : 0;
  const intercept = (sy - slope * sx) / n;
  return { slope, intercept, from: pts[0].i, to: pts[n - 1].i, at: (i: number) => slope * i + intercept };
}

/** Which x labels print: a stride from the COUNT and the room, plus the last
 *  one only when a full stride clears it — the right end is the one a reader
 *  looks for, and the one most likely to collide. The data is never thinned. */
export function thinLabels(count: number, plotWidth: number, perLabel = 56): Set<number> {
  const fit = Math.max(2, Math.floor(plotWidth / perLabel));
  const stride = Math.max(1, Math.ceil(count / fit));
  const keep = new Set<number>();
  for (let i = 0; i < count; i += stride) keep.add(i);
  const last = count - 1;
  if (last > 0 && !keep.has(last) && last - Math.max(...keep) >= stride) keep.add(last);
  return keep;
}

/** Spread-and-clamp for end-of-line labels: sorted by the y the data asks for,
 *  pushed apart by `gap`, then walked back up from `floor` so a stack that
 *  overflowed is pushed inside rather than off. The label moves; its dot stays
 *  on the true value. */
export function spreadLabels<T extends { y: number }>(items: T[], gap: number, ceiling: number, floor: number): T[] {
  const out = [...items].sort((a, b) => a.y - b.y).map((t) => ({ ...t }));
  for (let i = 0; i < out.length; i += 1) {
    if (out[i].y < ceiling) out[i].y = ceiling;
    if (i > 0 && out[i].y - out[i - 1].y < gap) out[i].y = out[i - 1].y + gap;
  }
  for (let i = out.length - 1; i >= 0; i -= 1) {
    if (out[i].y > floor) out[i].y = floor;
    if (i > 0 && out[i].y - out[i - 1].y < gap) out[i - 1].y = out[i].y - gap;
  }
  return out;
}
