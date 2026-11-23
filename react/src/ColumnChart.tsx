import { useId, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { cx } from './utils';
import { assertSeriesCount, MAX_SERIES } from './Chart';
import {
  axisTicks,
  columnPath,
  compactNumber,
  rectPath,
  thinLabels,
  useChartTip,
  useContainerWidth,
} from './chartUtils';

/* Column chart — vertical columns over a category axis, usually time.
 *
 * One series draws plain columns; several STACK, because a grouped column
 * chart needs a per-slot second channel this library does not give bars
 * (charts.md §3a: neighbours in a stack are adjacent by construction, so hue
 * holds; neighbours in a group are not). A value below zero stacks DOWN from a
 * drawn zero line, and only the outermost segment on each side takes the
 * rounded data end — the baseline stays square, as every bar here does.
 *
 * A COLUMN STILL FILLING IS HATCHED AND SAYS SO. A month in progress drawn like
 * a closed one reads as a fall; `partial` lightens it, lays the 45° hatch over
 * it and writes the words on the axis, so colour is never the only signal.
 *
 * The axis always starts at zero. A truncated column axis is the classic lie:
 * a bar's whole length is the encoding, so cutting its base cuts the value. */

export interface ColumnSeries {
  /** Names the series in the legend, the tooltip and the table view. */
  name: string;
  /** One per label. `null` draws nothing and reads "—" in the tooltip; it is
   *  not a zero. Negative values stack below the zero line. */
  values: (number | null)[];
  /** Pin to a palette slot (1-8) so colour follows the entity, not its order.
   *  Defaults to position — a stack's ORDER is its slot assignment, so keep it
   *  fixed across months and across charts that must agree. `'neutral'` is for
   *  the fold — "Other" — which names no category and takes `chart.neutral`
   *  rather than spending a slot. */
  slot?: number | 'neutral';
}

export interface ColumnChartProps {
  labels: string[];
  /** Bottom of the stack first. */
  series: ColumnSeries[];
  /** Gist for assistive tech. The table view carries the numbers. */
  label?: string;
  format?: (n: number) => string;
  /** Axis spelling. Defaults to thousands-compact. */
  tickFormat?: (n: number) => string;
  /** Tooltip heading per column, where it can be longer than the tick. */
  tips?: string[];
  /** Columns still filling. `'last'` marks only the final column; an array
   *  marks per index. Drawn lighter and hatched, labelled `partialLabel`. */
  partial?: 'last' | boolean[];
  /** Replaces a partial column's axis label. Default "to date". */
  partialLabel?: string;
  height?: number;
  className?: string;
}

const COLUMN_MAX = 24;

const slotClass = (slot: number | 'neutral') => (slot === 'neutral' ? 'jrk-series--neutral' : `jrk-s${slot}`);
const STACK_GAP = 2;

export function ColumnChart({
  labels, series, label, format, tickFormat, tips, partial, partialLabel = 'to date', height = 220, className,
}: ColumnChartProps) {
  assertSeriesCount(series.length);
  const slots = series.map((s, i) => {
    if (s.slot === 'neutral') return 'neutral' as const;
    const slot = s.slot ?? i + 1;
    if (!Number.isInteger(slot) || slot < 1 || slot > MAX_SERIES) {
      throw new RangeError(`Series slot ${slot} is outside 1-${MAX_SERIES}. The palette is never cycled.`);
    }
    return slot;
  });

  const wrapRef = useRef<HTMLDivElement>(null);
  const W = useContainerWidth(wrapRef, 600);
  const H = height;
  const tip = useChartTip();
  const [hover, setHover] = useState<number | null>(null);
  const hatchId = `jrk-col-hatch-${useId().replace(/:/g, '')}`;
  const fmt = format ?? ((n: number) => n.toLocaleString());
  const tfmt = tickFormat ?? compactNumber;
  const stacked = series.length > 1;
  const n = labels.length;

  const isPartial = (i: number) =>
    partial === 'last' ? i === n - 1 : Array.isArray(partial) ? Boolean(partial[i]) : false;

  // Per column: the positive stack's top and the negative stack's bottom.
  const sums = labels.map((_, i) =>
    series.reduce(
      (acc, s) => {
        const v = s.values[i];
        if (v == null || !Number.isFinite(v)) return acc;
        return v >= 0 ? { up: acc.up + v, down: acc.down } : { up: acc.up, down: acc.down + v };
      },
      { up: 0, down: 0 },
    ),
  );
  const { min, max, ticks } = axisTicks(
    Math.min(0, ...sums.map((s) => s.down)),
    Math.max(0, ...sums.map((s) => s.up)),
  );

  const padL = Math.max(36, Math.max(...ticks.map((t) => tfmt(t).length)) * 6.5 + 14);
  const padR = 8;
  const padT = 12;
  const padB = 26;
  const plotW = Math.max(1, W - padL - padR);
  const plotH = H - padT - padB;
  const band = plotW / Math.max(1, n);
  const bw = Math.max(2, Math.min(COLUMN_MAX, band - 4));
  const y = (v: number) => padT + ((max - v) / (max - min || 1)) * plotH;
  const keepX = thinLabels(n, plotW, Math.max(36, Math.max(0, ...labels.map((l) => l.length)) * 6.6 + 12));

  const summary =
    label ??
    `Column chart${stacked ? `, ${series.length} stacked series (${series.map((s) => s.name).join(', ')})` : `, ${series[0]?.name ?? ''}`} ` +
      `across ${n} columns from ${labels[0]} to ${labels[n - 1]}. Full values in the table view.`;

  return (
    <div className={cx('jrk-chart', 'jrk-column-chart', className)}>
      <div className="jrk-chart__plot" ref={wrapRef}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label={summary}
          onPointerLeave={() => {
            tip.hide();
            setHover(null);
          }}
        >
          <defs>
            {/* 45° and only 45° — horizontal or vertical hatching reads as a
                gridline (charts.md, Texture). */}
            <pattern id={hatchId} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line className="jrk-col__hatch-line" x1="0" y1="0" x2="0" y2="6" />
            </pattern>
          </defs>

          <g className="jrk-grid">
            {ticks.map((t) => (t === 0 ? null : <line key={t} x1={padL} x2={W - padR} y1={y(t)} y2={y(t)} />))}
          </g>

          <g className="jrk-axis">
            {ticks.map((t) => (
              <text key={t} x={padL - 8} y={y(t) + 4} textAnchor="end">
                {tfmt(t)}
              </text>
            ))}
          </g>

          {labels.map((l, i) => {
            const x = padL + i * band + (band - bw) / 2;
            const part = isPartial(i);
            let up = 0;
            let down = 0;
            const lastUp = series.reduce((a, s, j) => ((s.values[i] ?? 0) > 0 ? j : a), -1);
            const lastDown = series.reduce((a, s, j) => ((s.values[i] ?? 0) < 0 ? j : a), -1);
            const marks: ReactNode[] = [];
            series.forEach((s, j) => {
              const v = s.values[i];
              if (v == null || v === 0 || !Number.isFinite(v)) return;
              const from = v > 0 ? up : down;
              const to = from + v;
              const touchesPrev = v > 0 ? up !== 0 : down !== 0;
              if (v > 0) up = to;
              else down = to;
              let top = y(Math.max(from, to));
              let h = Math.abs(y(from) - y(to));
              // The 2px surface gap between touching segments is white space,
              // never a stroke: it comes off the joining edge.
              if (touchesPrev && h > STACK_GAP + 1) {
                h -= STACK_GAP;
                if (v < 0) top += STACK_GAP;
              }
              if (h < 0.5) return;
              const outer = v > 0 ? j === lastUp : j === lastDown;
              const d = outer ? columnPath(x, top, bw, h, 4, v < 0) : rectPath(x, top, bw, h);
              marks.push(
                <g key={j} className={slotClass(slots[j])}>
                  <path className={cx('jrk-col', part && 'jrk-col--partial')} d={d} />
                  {part && <path className="jrk-col__hatch" d={d} fill={`url(#${hatchId})`} />}
                </g>,
              );
            });

            const head = `${tips?.[i] ?? l}${part ? ` (${partialLabel})` : ''}`;
            const rows: ReactNode[] = series.map((s, j) => {
              const v = s.values[i];
              return (
                <div key={s.name} className={cx('jrk-chart-tooltip__row', slotClass(slots[j]))}>
                  <span className="jrk-chart-tooltip__swatch" />
                  <span className="jrk-chart-tooltip__label">{s.name}</span>
                  <span className="jrk-chart-tooltip__value">{v == null ? '—' : fmt(v)}</span>
                </div>
              );
            });
            if (stacked) {
              const total = series.reduce((a, s) => a + (s.values[i] ?? 0), 0);
              rows.push(
                <div key="__total" className="jrk-chart-tooltip__row jrk-chart-tooltip__row--total">
                  <span />
                  <span className="jrk-chart-tooltip__label">Total</span>
                  <span className="jrk-chart-tooltip__value">{fmt(total)}</span>
                </div>,
              );
            }

            return (
              <g key={`${l}-${i}`}>
                {hover === i && (
                  <rect className="jrk-chart__hover-band" x={padL + i * band} y={padT} width={band} height={plotH} />
                )}
                {marks}
                {/* The hit target is the whole slot, taller and wider than the
                    column — a 4px column is far too small to hover. */}
                <rect
                  className="jrk-chart__hit"
                  x={padL + i * band}
                  y={padT}
                  width={band}
                  height={plotH}
                  onPointerMove={(e) => {
                    setHover(i);
                    tip.show(e.clientX, e.clientY, head, rows);
                  }}
                />
                {(keepX.has(i) || part) && (
                  <text
                    className={cx('jrk-chart__tick', part && 'jrk-chart__tick--partial')}
                    x={padL + i * band + band / 2}
                    y={H - 8}
                    textAnchor="middle"
                  >
                    {part ? partialLabel : l}
                  </text>
                )}
              </g>
            );
          })}

          {/* Zero last, so it sits over the columns' square bases. */}
          <g className="jrk-axis">
            <line x1={padL} x2={W - padR} y1={y(0)} y2={y(0)} />
          </g>
        </svg>
      </div>
      {stacked && (
        <div className="jrk-legend">
          {series.map((s, j) => (
            <span key={s.name} className={cx('jrk-legend__item', slotClass(slots[j]))}>
              <span className="jrk-legend__swatch" aria-hidden="true" />
              {s.name}
            </span>
          ))}
        </div>
      )}
      {tip.node}
    </div>
  );
}
