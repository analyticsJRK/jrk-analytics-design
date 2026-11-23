import { useId, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { cx } from './utils';
import {
  axisTicks,
  compactNumber,
  linearFit,
  runsOf,
  spreadLabels,
  thinLabels,
  useContainerWidth,
} from './chartUtils';

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
  /** `null` is a GAP, never a zero — the line breaks and resumes. A month that
   *  has not happened drawn at the axis reads as a collapse. */
  values: (number | null)[];
  /** Pin the series to a palette slot (1-8) so colour follows the ENTITY, not
   *  its rank: a filter that drops series two must not repaint series three.
   *  Defaults to position. Slots must be unique within one chart. */
  slot?: number;
  /** Draw the stroke dashed — prior years beside a solid current one. Setting
   *  a style on ANY series switches the per-slot redundant dash off for the
   *  chart: two dash vocabularies on one plot is one too many. */
  style?: 'solid' | 'dashed';
}

export function assertSeriesCount(n: number, cap = MAX_SERIES) {
  if (n > cap) {
    throw new RangeError(
      `${n} series exceeds the ${cap}-slot palette. The palette is never cycled — ` +
        `fold the tail into "Other", facet into small multiples, or add a second encoding.`,
    );
  }
}

function slotOf(explicit: number | undefined, index: number): number {
  const slot = explicit ?? index + 1;
  if (!Number.isInteger(slot) || slot < 1 || slot > MAX_SERIES) {
    throw new RangeError(`Series slot ${slot} is outside 1-${MAX_SERIES}. The palette is never cycled.`);
  }
  return slot;
}

const plainFormat = (n: number) => n.toLocaleString();

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
  /** Explicit slot per entry, matching `Series.slot`. Defaults to position. */
  slots?: number[];
  /** Entries whose line key is drawn dashed, matching `Series.style`. */
  dashed?: ReadonlySet<string>;
  className?: string;
}

/** Renders nothing for a single series — the title already names what is
 *  plotted, and a one-swatch box just restates it. */
export function Legend({ series, shape = 'block', hidden, onToggle, slots, dashed, className }: LegendProps) {
  if (series.length < 2) return null;
  assertSeriesCount(series.length);

  return (
    <div className={cx('jrk-legend', className)}>
      {series.map((name, i) => {
        const off = hidden?.has(name) ?? false;
        const swatch = (
          <span
            className={cx(
              'jrk-legend__swatch',
              shape !== 'block' && `jrk-legend__swatch--${shape}`,
              dashed?.has(name) && 'jrk-legend__swatch--dashed',
            )}
            aria-hidden="true"
          />
        );
        const cls = cx('jrk-legend__item', `jrk-s${slotOf(slots?.[i], i)}`);

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
  /** A second figure printed beside the value — units beside a property
   *  count. Bar plus number, never two bars: a second axis in a list this small
   *  reads as noise. */
  secondary?: number | string;
}

export interface BarListProps {
  items: BarListItem[];
  format?: (n: number) => string;
  /** Formats a numeric `secondary`. */
  secondaryFormat?: (n: number) => string;
  /** Baseline for the bar widths. Defaults to the largest value. Pass an
   *  explicit max when several BarLists must be comparable. */
  max?: number;
  /** Column width for labels. */
  labelWidth?: string;
  /** Show the first N rows and a "+N more" line. The bar scale is still the
   *  largest of ALL items, so truncating never re-scales what is shown. */
  limit?: number;
  /** Words for the overflow line. Default "+ N more". */
  moreLabel?: (hidden: number) => ReactNode;
  /** The label that means "no value" — `(blank)`, `Unassigned`. That row is
   *  styled as a gap rather than as a category, so it does not read as a name. */
  blankLabel?: string;
  className?: string;
}

/** Ranked horizontal bars — the right form for "which categories are biggest".
 *  Nominal categories all take slot 1: bar length already encodes the value,
 *  so spending the identity channel on it would be re-encoding. */
export function BarList({
  items, format, secondaryFormat, max, labelWidth = '140px', limit, moreLabel, blankLabel, className,
}: BarListProps) {
  const peak = max ?? Math.max(...items.map((i) => i.value), 0);
  const fmt = format ?? plainFormat;
  const fmt2 = secondaryFormat ?? plainFormat;
  const shown = limit !== undefined && limit >= 0 ? items.slice(0, limit) : items;
  const rest = items.length - shown.length;
  const hasSecondary = items.some((i) => i.secondary !== undefined);

  return (
    <div
      className={cx('jrk-bars', hasSecondary && 'jrk-bars--secondary', className)}
      style={{ ['--jrk-bars-label' as string]: labelWidth }}
    >
      {shown.map((item, i) => (
        <div className="jrk-bars__row" key={`${item.label}-${i}`}>
          <span
            className={cx('jrk-bars__label', blankLabel !== undefined && item.label === blankLabel && 'jrk-bars__label--blank')}
            title={item.label}
          >
            {item.label}
          </span>
          <span className="jrk-bars__track">
            <span
              className="jrk-bars__fill"
              style={{ width: peak > 0 ? `${(Math.max(0, item.value) / peak) * 100}%` : 0 }}
            />
          </span>
          {/* The value is always visible — this is the relief channel that
              makes the sub-3:1 light-mode hues legal. */}
          <span className="jrk-bars__value">{fmt(item.value)}</span>
          {hasSecondary && (
            <span className="jrk-bars__secondary">
              {item.secondary === undefined ? '' : typeof item.secondary === 'number' ? fmt2(item.secondary) : item.secondary}
            </span>
          )}
        </div>
      ))}
      {rest > 0 && <p className="jrk-bars__more">{moreLabel ? moreLabel(rest) : `+ ${rest} more`}</p>}
    </div>
  );
}

/* ================================ StackBar ================================= */

export interface StackBarSegment {
  label: string;
  value: number;
}

export interface StackBarProps {
  /** Part-to-whole, in a FIXED order — the order is what assigns the slot, so
   *  two stack bars that must agree take the same order (sort by a shared
   *  ranking, never by each bar's own measure). Eight at most; fold the tail
   *  into "Other". */
  segments: StackBarSegment[];
  /** Names the whole for assistive tech: "Units by asset manager". */
  label: string;
  format?: (n: number) => string;
  /** The keyed legend with each segment's value and share. On by default —
   *  colour is never the only channel, and this is the stack's table. */
  legend?: boolean;
  /** Pastel fills. Legal only because the legend labels every segment. */
  tinted?: boolean;
  className?: string;
}

/** The React wrapper over `.jrk-stack-bar`: part-to-whole, few parts.
 *
 *  This is where a donut would go, and the library deliberately has none —
 *  charts.md sends part-to-whole to a stacked bar, because length along one
 *  axis is read more accurately than angle. Zero-valued segments stay in the
 *  DOM (hidden) so `:nth-child` keeps every later segment on its own slot. */
export function StackBar({ segments, label, format, legend = true, tinted, className }: StackBarProps) {
  assertSeriesCount(segments.length);
  const fmt = format ?? plainFormat;
  const total = segments.reduce((s, x) => s + Math.max(0, x.value), 0);
  const share = (v: number) => (total > 0 ? `${((Math.max(0, v) / total) * 100).toFixed(1)}%` : '—');
  const summary = `${label}. ${segments.map((s) => `${s.label} ${fmt(s.value)} (${share(s.value)})`).join(', ')}.`;

  return (
    <div className={cx('jrk-chart', 'jrk-stack-chart', className)}>
      <div className={cx('jrk-stack-bar', tinted && 'jrk-stack-bar--tinted')} role="img" aria-label={summary}>
        {segments.map((s) => (
          <span
            key={s.label}
            className="jrk-stack-bar__seg"
            hidden={!(s.value > 0)}
            style={{ flexGrow: Math.max(0, s.value), flexBasis: 0 }}
            title={`${s.label}: ${fmt(s.value)} (${share(s.value)})`}
          />
        ))}
      </div>
      {legend && (
        <ul className="jrk-legend jrk-legend--values">
          {segments.map((s, i) => (
            <li key={s.label} className={cx('jrk-legend__item', tinted ? `jrk-t${i + 1}` : `jrk-s${i + 1}`)}>
              <span className="jrk-legend__swatch" aria-hidden="true" />
              <span className="jrk-legend__label">{s.label}</span>
              <span className="jrk-legend__value">{fmt(s.value)}</span>
              <span className="jrk-legend__share">{share(s.value)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* =============================== SeriesTable =============================== */

export interface SeriesTableProps {
  labels: string[];
  series: Pick<Series, 'name' | 'values'>[];
  format?: (n: number) => string;
  /** Heading for the label column. */
  labelHeader?: string;
  /** Visually hidden caption — what the table is OF. */
  caption?: string;
  /** Add a row total column. Only for series that add up. */
  total?: boolean;
  className?: string;
}

/** The table view a ChartCard puts behind its toggle, for any labelled series
 *  chart — LineChart, ColumnChart. A missing value prints a dash, never 0. */
export function SeriesTable({ labels, series, format, labelHeader = 'Period', caption, total, className }: SeriesTableProps) {
  const fmt = format ?? plainFormat;
  return (
    <div className={cx('jrk-table-wrap', className)}>
      <table className="jrk-table jrk-table--compact">
        {caption && <caption className="jrk-sr-only">{caption}</caption>}
        <thead>
          <tr>
            <th scope="col">{labelHeader}</th>
            {series.map((s) => (
              <th key={s.name} scope="col" className="jrk-num">
                {s.name}
              </th>
            ))}
            {total && (
              <th scope="col" className="jrk-num">
                Total
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {labels.map((l, i) => (
            <tr key={`${l}-${i}`}>
              <th scope="row">{l}</th>
              {series.map((s) => {
                const v = s.values[i];
                return (
                  <td key={s.name} className="jrk-num">
                    {v == null ? '—' : fmt(v)}
                  </td>
                );
              })}
              {total && (
                <td className="jrk-num">{fmt(series.reduce((a, s) => a + (s.values[i] ?? 0), 0))}</td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* =============================== LineChart ================================= */

export interface LineChartBand {
  /** Lower edge per label. A null on either edge breaks the band. */
  lo: (number | null)[];
  hi: (number | null)[];
  /** Names the range in the legend and tooltip: "Middle 50% of properties". */
  label: string;
}

export interface LineChartProps {
  series: Series[];
  /** One label per index — dates, buckets. Length must match values. */
  labels: string[];
  format?: (n: number) => string;
  /** How a value reads on the axis. Defaults to thousands-compact; the tooltip
   *  always uses `format`, because it exists to give the exact figure. */
  tickFormat?: (n: number) => string;
  /** The tooltip's heading per index, where it can be longer than a tick —
   *  "12 March 2026" over a "12 Mar" axis. */
  tips?: string[];
  height?: number;
  /** Fill under the line at ~10% opacity. Single series only — stacked washes
   *  become unreadable past one. */
  area?: boolean;
  /** Add the per-slot dash so series stay separable when their hues collapse
   *  under CVD. Defaults to on for 2+ series and off for 1.
   *
   *  Why the default is conditional rather than always-on: the slot order was
   *  searched to maximise the worst ADJACENT pair, so hue alone is strong
   *  between neighbours but every collapsing pair is same-parity —
   *  orange|yellow measures dE 0.8 under deuteranopia. A line chart compares
   *  non-adjacent series freely, so from two series up the second channel is
   *  load-bearing. At one series there is nothing to confuse it with, and
   *  charts.md reserves the dashed stroke for .jrk-threshold — a lone dashed
   *  line would read as a reference value. Ignored once any series sets
   *  `style`. */
  encoding?: 'hue' | 'redundant';
  /** Start the axis at zero (default). Off for a rating, where 4.06 drawn from
   *  zero is a flat line four fifths of the way up an empty box. A signed
   *  series always keeps zero in the domain and draws a zero line. */
  fromZero?: boolean;
  /** Name each line at its last point. Identity then rides in a label as well
   *  as in the hue; labels are spread so two close finishes never overprint. */
  endLabels?: boolean;
  /** A dashed least-squares trend, drawn as a reference (threshold ink, not the
   *  series hue). SINGLE SERIES ONLY — a grey dashed line per series cannot say
   *  whose trend it is. */
  trend?: boolean;
  /** A shaded range under the lines — a peer interquartile range, a forecast
   *  interval. Neutral ink: a range is a reference, not a series. */
  band?: LineChartBand;
  /** Overrides the generated `aria-label`. */
  label?: string;
  className?: string;
}

/** Line chart with the crosshair + tooltip hover layer, which ships by
 *  default: an SVG chart IS interactive, and values the eye cannot read off
 *  the axis have to be reachable somehow. */
export function LineChart({
  series, labels, format, tickFormat, tips, height = 220, area, encoding, fromZero = true,
  endLabels, trend, band, label, className,
}: LineChartProps) {
  assertSeriesCount(series.length);
  const slots = series.map((s, i) => slotOf(s.slot, i));
  if (new Set(slots).size !== slots.length) {
    throw new RangeError('Two series share a palette slot. Each slot names one entity.');
  }

  const styled = series.some((s) => s.style !== undefined);
  const redundant = !styled && (encoding ?? (series.length > 1 ? 'redundant' : 'hue')) === 'redundant';
  const showTrend = Boolean(trend) && series.length === 1;
  if (trend && series.length !== 1 && typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
    console.warn('[jrk] <LineChart trend> draws one grey dashed fit and cannot say whose it is on a multi-series chart. Ignored.');
  }

  const [active, setActive] = useState<number | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const fmt = format ?? plainFormat;
  const tfmt = tickFormat ?? compactNumber;

  // The viewBox must match the rendered width in CSS pixels (charts.md §7).
  const W = useContainerWidth(wrapRef, 600);
  const H = height;
  const n = labels.length;

  const { min, max, ticks } = useMemo(() => {
    const present = [
      ...series.flatMap((s) => s.values),
      ...(band ? [...band.lo, ...band.hi] : []),
    ].filter((v): v is number => v != null && Number.isFinite(v));
    if (!present.length) return { min: 0, max: 1, ticks: [0, 1] };
    return axisTicks(Math.min(...present), Math.max(...present), { fromZero });
  }, [series, band, fromZero]);

  // The gutter fits the widest tick label rather than a fixed 44px, so a
  // "$1.2M" axis does not print into the plot.
  const padL = Math.max(36, Math.max(...ticks.map((t) => tfmt(t).length)) * 6.5 + 14);
  const padR = endLabels ? Math.min(160, Math.max(...series.map((s) => s.name.length)) * 6.6 + 20) : 16;
  const padT = 12;
  const padB = 26;
  const plotW = Math.max(1, W - padL - padR);

  const x = (i: number) => padL + (n <= 1 ? plotW / 2 : (i * plotW) / (n - 1));
  const y = (v: number) => H - padB - ((v - min) / (max - min || 1)) * (H - padT - padB);

  const keepX = thinLabels(n, plotW, Math.max(36, Math.max(0, ...labels.map((l) => l.length)) * 6.6 + 12));

  const fit = showTrend ? linearFit(series[0].values) : null;

  const lastIndex = (vals: (number | null)[]) =>
    vals.reduce<number | null>((found, v, i) => (v == null ? found : i), null);

  const tags = endLabels
    ? spreadLabels(
        series
          .map((s, si) => {
            const last = lastIndex(s.values);
            return last == null ? null : { key: s.name, slot: slots[si], x: x(last), y: y(s.values[last] as number) };
          })
          .filter((t): t is NonNullable<typeof t> => t != null),
        13,
        padT,
        H - padB,
      )
    : [];

  function onMove(e: React.PointerEvent<HTMLDivElement>) {
    const box = wrapRef.current?.getBoundingClientRect();
    if (!box || n === 0) return;
    // Map pointer position back through the same viewBox transform the marks use.
    const svgX = ((e.clientX - box.left) / box.width) * W;
    const i = Math.round(((svgX - padL) / plotW) * (n - 1));
    setActive(n <= 1 ? 0 : Math.max(0, Math.min(n - 1, i)));
  }

  const bandRuns = band
    ? runsOf(band.lo.map((lo, i) => (lo == null || band.hi[i] == null ? null : lo)))
    : [];

  const legendItems: ReactNode[] = [];
  if (series.length > 1) {
    series.forEach((s, si) =>
      legendItems.push(
        <span key={s.name} className={cx('jrk-legend__item', `jrk-s${slots[si]}`)}>
          <span
            className={cx('jrk-legend__swatch', 'jrk-legend__swatch--line', s.style === 'dashed' && 'jrk-legend__swatch--dashed')}
            aria-hidden="true"
          />
          {s.name}
        </span>,
      ),
    );
  }
  if (band) {
    legendItems.push(
      <span key="__band" className="jrk-legend__item jrk-legend__item--band">
        <span className="jrk-legend__swatch" aria-hidden="true" />
        {band.label}
      </span>,
    );
  }
  if (showTrend && fit) {
    legendItems.push(
      <span key="__trend" className="jrk-legend__item jrk-legend__item--reference">
        <span className="jrk-legend__swatch jrk-legend__swatch--line jrk-legend__swatch--dashed" aria-hidden="true" />
        Linear trend
      </span>,
    );
  }

  return (
    <div className={cx('jrk-chart', className)} data-encoding={redundant ? 'redundant' : undefined}>
      <div className="jrk-chart__plot" ref={wrapRef} onPointerMove={onMove} onPointerLeave={() => setActive(null)}>
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label ?? chartSummary(series, labels)}>
          <g className="jrk-grid">
            {ticks.map((t) => (
              <line key={t} x1={padL} x2={W - padR} y1={y(t)} y2={y(t)} />
            ))}
          </g>

          {band && (
            <g className="jrk-chart__band">
              {bandRuns.map((run, ri) => (
                <polygon
                  key={ri}
                  points={[
                    ...run.map(([i]) => `${x(i).toFixed(1)},${y(band.hi[i] as number).toFixed(1)}`),
                    ...[...run].reverse().map(([i]) => `${x(i).toFixed(1)},${y(band.lo[i] as number).toFixed(1)}`),
                  ].join(' ')}
                />
              ))}
            </g>
          )}

          <g className="jrk-axis">
            {/* The baseline is the bottom tick, or zero when the series is
                signed — then it is drawn as its own stronger line below. */}
            {!(min < 0 && max > 0) && <line x1={padL} x2={W - padR} y1={y(min)} y2={y(min)} />}
            {ticks.map((t) => (
              <text key={t} x={padL - 8} y={y(t) + 4} textAnchor="end">
                {tfmt(t)}
              </text>
            ))}
            {labels.map((l, i) =>
              keepX.has(i) ? (
                <text key={l + i} x={x(i)} y={H - 8} textAnchor="middle">
                  {l}
                </text>
              ) : null,
            )}
          </g>

          {min < 0 && max > 0 && <line className="jrk-chart__zero" x1={padL} x2={W - padR} y1={y(0)} y2={y(0)} />}

          {active !== null && (
            <line className="jrk-chart__crosshair" x1={x(active)} x2={x(active)} y1={padT} y2={H - padB} />
          )}

          {fit && (
            <path
              className="jrk-threshold jrk-chart__trend"
              d={`M${x(fit.from).toFixed(1)},${y(fit.at(fit.from)).toFixed(1)} L${x(fit.to).toFixed(1)},${y(fit.at(fit.to)).toFixed(1)}`}
            />
          )}

          {series.map((s, si) => {
            const runs = runsOf(s.values);
            return (
              <g key={s.name} className={`jrk-s${slots[si]}`}>
                {area &&
                  series.length === 1 &&
                  runs
                    .filter((r) => r.length > 1)
                    .map((r, ri) => (
                      <path
                        key={`a${ri}`}
                        className="jrk-area"
                        d={`${linePath(r, x, y)} L${x(r[r.length - 1][0])},${y(Math.max(min, Math.min(0, max)))} L${x(r[0][0])},${y(Math.max(min, Math.min(0, max)))} Z`}
                      />
                    ))}
                {runs.map((r, ri) =>
                  r.length > 1 ? (
                    <path
                      key={ri}
                      className={cx('jrk-line', s.style === 'dashed' && 'jrk-line--dashed', styled && s.style !== 'dashed' && 'jrk-line--solid')}
                      d={linePath(r, x, y)}
                    />
                  ) : (
                    // An isolated reading between two gaps is a real value, and
                    // a path through one point draws nothing.
                    <circle key={ri} className="jrk-dot jrk-dot--lone" cx={x(r[0][0])} cy={y(r[0][1])} r={3} />
                  ),
                )}
                {active !== null && s.values[active] != null && (
                  <circle className="jrk-dot" cx={x(active)} cy={y(s.values[active] as number)} r={4} />
                )}
              </g>
            );
          })}

          {tags.map((t) => {
            const s = series.find((ss) => ss.name === t.key)!;
            const last = lastIndex(s.values) as number;
            return (
              <g key={`${t.key}-tag`} className={`jrk-s${t.slot}`}>
                <circle className="jrk-dot" cx={t.x} cy={y(s.values[last] as number)} r={4} />
                <text className="jrk-chart__end-label" x={t.x + 8} y={t.y} dominantBaseline="middle">
                  {t.key}
                </text>
              </g>
            );
          })}
        </svg>

        {active !== null && (
          <div
            className="jrk-chart-tooltip"
            style={{
              left: `${(x(active) / W) * 100}%`,
              top: 0,
              // Flip to the other side past the middle so it never runs outside the plot.
              transform: active > (n - 1) / 2 ? 'translateX(calc(-100% - 12px))' : 'translateX(12px)',
            }}
          >
            <div className="jrk-chart-tooltip__header">{tips?.[active] ?? labels[active]}</div>
            {series.map((s, si) => {
              const v = s.values[active];
              return (
                <div className={cx('jrk-chart-tooltip__row', `jrk-s${slots[si]}`)} key={s.name}>
                  <span className="jrk-chart-tooltip__swatch" />
                  <span className="jrk-chart-tooltip__label">{s.name}</span>
                  <span className="jrk-chart-tooltip__value">{v == null ? '—' : fmt(v)}</span>
                </div>
              );
            })}
            {band && band.lo[active] != null && band.hi[active] != null && (
              <div className="jrk-chart-tooltip__row jrk-chart-tooltip__row--band">
                <span className="jrk-chart-tooltip__swatch" />
                <span className="jrk-chart-tooltip__label">{band.label}</span>
                <span className="jrk-chart-tooltip__value">
                  {fmt(band.lo[active] as number)}–{fmt(band.hi[active] as number)}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {legendItems.length > 0 && <div className="jrk-legend">{legendItems}</div>}
    </div>
  );
}

/* ================================= helpers ================================= */

function linePath(run: [number, number][], x: (i: number) => number, y: (v: number) => number) {
  return run.map(([i, v], k) => `${k === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
}

/** The SVG needs a text alternative — the table view carries the values, this
 *  carries the gist. */
function chartSummary(series: Series[], labels: string[]) {
  const names = series.map((s) => s.name).join(', ');
  return `Line chart. ${series.length} series (${names}) across ${labels.length} points from ${labels[0]} to ${labels[labels.length - 1]}. Full values in the table view.`;
}
