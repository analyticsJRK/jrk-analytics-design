import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { cx } from './utils';

/* Chart primitives.

   The rules these encode are not preferences:
     - A legend appears for >= 2 series and never for 1.
     - Series take slots 1..8 in order and the palette is NEVER cycled.
     - A table view always exists — it is the relief channel for the three
       light-mode hues that sit below 3:1, and the answer for screen readers.
     - Text uses text tokens; only the marks carry the series color. */

export const MAX_SERIES = 8;

/** Cap for scatter / bubble / choropleth / small multiples, where any two
 *  marks can sit side by side and the all-pairs CVD floor binds. */
export const MAX_SERIES_ALL_PAIRS = 3;

export interface Series {
  /** Names the series in the legend, the tooltip, and the table view. */
  name: string;
  values: number[];
}

function assertSeriesCount(n: number, cap = MAX_SERIES) {
  if (n > cap) {
    throw new RangeError(
      `${n} series exceeds the ${cap}-slot palette. The palette is never cycled — ` +
        `fold the tail into "Other", facet into small multiples, or add a second encoding.`,
    );
  }
}

/* ================================ ChartCard ================================ */

export interface ChartCardProps {
  title: ReactNode;
  /** Name the period and the unit. A chart whose title does not say what
   *  window it covers is not finished. */
  subtitle?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  /** The table view. Rendered behind a toggle, always reachable. */
  table?: ReactNode;
  className?: string;
}

export function ChartCard({ title, subtitle, actions, children, table, className }: ChartCardProps) {
  const [showTable, setShowTable] = useState(false);
  const panelId = useId();

  return (
    <section className={cx('jrk-chart-card', className)}>
      <header className="jrk-chart-card__header">
        <div>
          <h3 className="jrk-chart-card__title">{title}</h3>
          {subtitle && <p className="jrk-chart-card__subtitle">{subtitle}</p>}
        </div>
        <div className="jrk-card__actions">
          {actions}
          {table && (
            <button
              type="button"
              className="jrk-btn jrk-btn--ghost jrk-btn--sm"
              aria-expanded={showTable}
              aria-controls={panelId}
              onClick={() => setShowTable((v) => !v)}
            >
              {showTable ? 'Show chart' : 'Show table'}
            </button>
          )}
        </div>
      </header>
      <div className="jrk-chart-card__body">
        <div hidden={showTable}>{children}</div>
        {table && (
          <div id={panelId} hidden={!showTable}>
            {table}
          </div>
        )}
      </div>
    </section>
  );
}

/* ================================= Legend ================================== */

export interface LegendProps {
  series: string[];
  shape?: 'block' | 'line' | 'dot';
  /** Makes entries toggle buttons that filter the chart. */
  hidden?: ReadonlySet<string>;
  onToggle?: (name: string) => void;
  className?: string;
}

/** Renders nothing for a single series — the title already names what is
 *  plotted, and a one-swatch box just restates it. */
export function Legend({ series, shape = 'block', hidden, onToggle, className }: LegendProps) {
  if (series.length < 2) return null;
  assertSeriesCount(series.length);

  return (
    <div className={cx('jrk-legend', className)}>
      {series.map((name, i) => {
        const off = hidden?.has(name) ?? false;
        const swatch = (
          <span
            className={cx('jrk-legend__swatch', shape !== 'block' && `jrk-legend__swatch--${shape}`)}
            aria-hidden="true"
          />
        );
        const cls = cx('jrk-legend__item', `jrk-s${i + 1}`);

        return onToggle ? (
          <button key={name} type="button" className={cls} aria-pressed={!off} onClick={() => onToggle(name)}>
            {swatch}
            {name}
          </button>
        ) : (
          <span key={name} className={cls}>
            {swatch}
            {name}
          </span>
        );
      })}
    </div>
  );
}

/* ================================= BarList ================================= */

export interface BarListItem {
  label: string;
  value: number;
}

export interface BarListProps {
  items: BarListItem[];
  format?: (n: number) => string;
  /** Baseline for the bar widths. Defaults to the largest value. Pass an
   *  explicit max when several BarLists must be comparable. */
  max?: number;
  /** Column width for labels. */
  labelWidth?: string;
  className?: string;
}

/** Ranked horizontal bars — the right form for "which categories are biggest".
 *  Nominal categories all take slot 1: bar length already encodes the value,
 *  so spending the identity channel on it would be re-encoding. */
export function BarList({ items, format, max, labelWidth = '140px', className }: BarListProps) {
  const peak = max ?? Math.max(...items.map((i) => i.value), 0);
  const fmt = format ?? ((n: number) => n.toLocaleString());

  return (
    <div
      className={cx('jrk-bars', className)}
      style={{ ['--jrk-bars-label' as string]: labelWidth }}
    >
      {items.map((item) => (
        <div className="jrk-bars__row" key={item.label}>
          <span className="jrk-bars__label" title={item.label}>
            {item.label}
          </span>
          <span className="jrk-bars__track">
            <span
              className="jrk-bars__fill"
              style={{ width: peak > 0 ? `${(item.value / peak) * 100}%` : 0 }}
            />
          </span>
          {/* The value is always visible — this is the relief channel that
              makes the sub-3:1 light-mode hues legal. */}
          <span className="jrk-bars__value">{fmt(item.value)}</span>
        </div>
      ))}
    </div>
  );
}

/* =============================== LineChart ================================= */

export interface LineChartProps {
  series: Series[];
  /** One label per index — dates, buckets. Length must match values. */
  labels: string[];
  format?: (n: number) => string;
  height?: number;
  /** Fill under the line at ~10% opacity. Single series only — stacked washes
   *  become unreadable past one. */
  area?: boolean;
  /** Add the per-slot dash so series stay separable when their hues collapse
   *  under CVD. Defaults to on for 2+ series and off for 1.
   *
   *  Why the default is conditional rather than always-on: the slot order was
   *  searched to maximise the worst ADJACENT pair, so hue alone is strong
   *  between neighbours but every collapsing pair lands at (n, n+4) —
   *  orange|yellow measures dE 0.8 under deuteranopia. A line chart compares
   *  non-adjacent series freely, so from two series up the second channel is
   *  load-bearing. At one series there is nothing to confuse it with, and
   *  charts.md reserves the dashed stroke for .jrk-threshold — a lone dashed
   *  line would read as a reference value. */
  encoding?: 'hue' | 'redundant';
  className?: string;
}

/** Line chart with the crosshair + tooltip hover layer, which ships by
 *  default: an SVG chart IS interactive, and values the eye cannot read off
 *  the axis have to be reachable somehow. */
export function LineChart({ series, labels, format, height = 220, area, encoding, className }: LineChartProps) {
  assertSeriesCount(series.length);

  const redundant = (encoding ?? (series.length > 1 ? 'redundant' : 'hue')) === 'redundant';

  const [active, setActive] = useState<number | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const fmt = format ?? ((n: number) => n.toLocaleString());

  // The viewBox must match the rendered width in CSS pixels. A fixed viewBox
  // scaled up by `width: 100%` scales the TEXT too — axis labels set at 12px
  // land at 17-18px on a wide card, which quietly breaks the type scale and
  // the hairline weights. Measuring keeps user units == CSS pixels.
  const W = useContainerWidth(wrapRef, 600);
  const H = height;
  const padL = 44;
  const padR = 16;
  const padT = 12;
  const padB = 26;

  const all = series.flatMap((s) => s.values);
  const rawMax = Math.max(...all, 0);
  const max = niceCeil(rawMax);
  const n = labels.length;

  const x = (i: number) => padL + (n <= 1 ? 0 : (i * (W - padL - padR)) / (n - 1));
  const y = (v: number) => H - padB - (max > 0 ? (v / max) * (H - padT - padB) : 0);

  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * max);

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    const box = wrapRef.current?.getBoundingClientRect();
    if (!box || n === 0) return;
    // Map pointer position back through the same viewBox transform the marks use.
    const svgX = ((e.clientX - box.left) / box.width) * W;
    const i = Math.round(((svgX - padL) / (W - padL - padR)) * (n - 1));
    setActive(Math.max(0, Math.min(n - 1, i)));
  }

  return (
    <div className={cx('jrk-chart', className)} data-encoding={redundant ? 'redundant' : undefined}>
      <div
        className="jrk-chart__plot"
        ref={wrapRef}
        onMouseMove={onMove}
        onMouseLeave={() => setActive(null)}
      >
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={chartSummary(series, labels)}>
          <g className="jrk-grid">
            {ticks.map((t) => (
              <line key={t} x1={padL} x2={W - padR} y1={y(t)} y2={y(t)} />
            ))}
          </g>

          <g className="jrk-axis">
            <line x1={padL} x2={W - padR} y1={y(0)} y2={y(0)} />
            {ticks.map((t) => (
              <text key={t} x={padL - 8} y={y(t) + 4} textAnchor="end">
                {compact(t)}
              </text>
            ))}
            {labels.map((l, i) =>
              // Thin the x labels so they never collide at narrow widths.
              i % Math.ceil(n / 7) === 0 ? (
                <text key={l + i} x={x(i)} y={H - 8} textAnchor="middle">
                  {l}
                </text>
              ) : null,
            )}
          </g>

          {active !== null && (
            <line className="jrk-chart__crosshair" x1={x(active)} x2={x(active)} y1={padT} y2={y(0)} />
          )}

          {series.map((s, si) => (
            <g key={s.name} className={`jrk-s${si + 1}`}>
              {area && series.length === 1 && (
                <path
                  className="jrk-area"
                  d={`${path(s.values, x, y)} L${x(n - 1)},${y(0)} L${x(0)},${y(0)} Z`}
                />
              )}
              <path className="jrk-line" d={path(s.values, x, y)} />
              {active !== null && s.values[active] !== undefined && (
                <circle className="jrk-dot" cx={x(active)} cy={y(s.values[active])} r={4} />
              )}
            </g>
          ))}
        </svg>

        {active !== null && (
          <div
            className="jrk-chart-tooltip"
            style={{
              left: `${(x(active) / W) * 100}%`,
              top: 0,
              // Flip the tooltip to the other side near the right edge so it
              // never runs outside the plot.
              transform: active > n / 2 ? 'translateX(calc(-100% - 12px))' : 'translateX(12px)',
            }}
          >
            <div className="jrk-chart-tooltip__header">{labels[active]}</div>
            {series.map((s, si) => (
              <div className={cx('jrk-chart-tooltip__row', `jrk-s${si + 1}`)} key={s.name}>
                <span className="jrk-chart-tooltip__swatch" />
                <span className="jrk-chart-tooltip__label">{s.name}</span>
                <span className="jrk-chart-tooltip__value">{fmt(s.values[active])}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <Legend series={series.map((s) => s.name)} shape="line" />
    </div>
  );
}

/* ================================= helpers ================================= */

/** Tracks an element's content width so an SVG viewBox can be kept 1:1 with
 *  CSS pixels. Falls back to `initial` before measurement and on SSR. */
function useContainerWidth(ref: React.RefObject<HTMLElement | null>, initial: number) {
  const [w, setW] = useState(initial);

  // Layout effect so the first paint already has the measured width and the
  // chart does not visibly resize.
  const useIso = typeof window === 'undefined' ? useEffect : useLayoutEffect;
  useIso(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(([entry]) => {
      // The SVG is width:100% of this element, so changing the viewBox cannot
      // change the measured width — no feedback loop.
      const next = Math.max(240, Math.round(entry.contentRect.width));
      setW((prev) => (prev === next ? prev : next));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);

  return w;
}

function path(values: number[], x: (i: number) => number, y: (v: number) => number) {
  return values.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
}

/** Rounds the axis top to a clean number so ticks read 0 / 1,000 / 2,000
 *  rather than 0 / 1,073 / 2,146. */
function niceCeil(v: number) {
  if (v <= 0) return 1;
  const mag = 10 ** Math.floor(Math.log10(v));
  return Math.ceil(v / mag) * mag;
}

function compact(n: number) {
  if (Math.abs(n) >= 1e6) return `${(n / 1e6).toFixed(1).replace(/\.0$/, '')}M`;
  if (Math.abs(n) >= 1e3) return `${(n / 1e3).toFixed(1).replace(/\.0$/, '')}K`;
  return String(Math.round(n));
}

/** The SVG needs a text alternative — the table view carries the values, this
 *  carries the gist. */
function chartSummary(series: Series[], labels: string[]) {
  const names = series.map((s) => s.name).join(', ');
  return `Line chart. ${series.length} series (${names}) across ${labels.length} points from ${labels[0]} to ${labels[labels.length - 1]}. Full values in the table view.`;
}
