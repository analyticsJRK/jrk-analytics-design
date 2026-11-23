import { useMemo, useRef, useState } from 'react';
import { cx } from './utils';
import { MAX_SERIES } from './Chart';
import { useContainerWidth } from './chartUtils';

/* Sankey — flows between columns of nodes, in hand-drawn SVG.
 *
 * ONE ENGINE FOR THREE SHAPES the portal drew three times: a two-column
 * allocation (vendor -> service), a many-to-many flow (vendor -> GL), and a
 * chain with drop-offs (stage -> stage, each loss falling away below). All
 * three are columns of stacked nodes joined by filled ribbons whose width is
 * the value, so one layout serves them; what differs is only which column a
 * node sits in.
 *
 * COLOUR FOLLOWS A CATEGORY, NEVER A NODE COUNT. A node or link may name a
 * palette `slot` (1-8) — the service a line belongs to, say — and the slot is
 * pinned to that category so a filter cannot repaint it. Everything without a
 * slot is `chart.neutral`: seventy-eight vendors are far past the eight-slot
 * ceiling, and a generated hue for each would be indistinguishable under CVD,
 * so the ribbons and the labels carry the identity instead. A stage in a
 * chain is neutral too; a drop is neutral and `muted`.
 *
 * EVERY NODE IS LABELLED WITH ITS VALUE, in text ink beside it — the light
 * hues sit under 3:1, and a ribbon's width is not a number anyone can read.
 * Labels that will not fit their lane are clipped with an ellipsis and the full
 * string stays in the node's <title>; they are never moved off the band they
 * describe. The table view behind ChartCard carries every exact figure.
 *
 * HOVER DIMS WHAT IS UNRELATED: pointing at a node keeps its own ribbons and
 * the nodes at their other ends at full strength. */

export interface SankeyNode {
  id: string;
  label: string;
  /** 0-based column, left to right. A link may skip columns. */
  column: number;
  /** Defaults to the larger of the node's inflow and outflow. Give it where a
   *  node holds more than its links say (a stage with unlinked remainder). */
  value?: number;
  /** Palette slot 1-8 for a categorical node. Omit for neutral. */
  slot?: number;
  /** A loss, an "Other": drawn lighter so the eye follows the trunk. */
  muted?: boolean;
}

export interface SankeyLink {
  source: string;
  target: string;
  value: number;
  /** Palette slot 1-8. Defaults to the source's slot, then the target's. */
  slot?: number;
}

export interface SankeyProps {
  nodes: SankeyNode[];
  links: SankeyLink[];
  /** Names the flow for assistive tech. Required — a picture of ribbons with no
   *  name is not an answer to what the reader is looking at. */
  label: string;
  format?: (n: number) => string;
  /** Print each node's share of its column beside its value. Default on. */
  share?: boolean;
  /** Plot height. Defaults to the busiest column at ~28px a node. */
  height?: number;
  /** Width kept for the LAST column's labels, in px. */
  labelWidth?: number;
  /** Keys for the slotted categories. Rendered from two entries up. */
  legend?: { label: string; slot: number }[];
  className?: string;
}

const NODE_W = 14;
const GAP = 12;
const PAD_Y = 8;
/** Average glyph width at 12px Inter — used to clip labels to their lane. */
const CHAR_W = 6.6;

function clip(s: string, max: number) {
  if (max < 2) return '…';
  return s.length > max ? `${s.slice(0, Math.max(1, max - 1))}…` : s;
}

function checkSlot(slot: number | undefined) {
  if (slot === undefined) return undefined;
  if (!Number.isInteger(slot) || slot < 1 || slot > MAX_SERIES) {
    throw new RangeError(`Sankey slot ${slot} is outside 1-${MAX_SERIES}. The palette is never cycled — leave it neutral.`);
  }
  return slot;
}

export function Sankey({
  nodes, links, label, format, share = true, height, labelWidth = 170, legend, className,
}: SankeyProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const W = useContainerWidth(wrapRef, 760, 480);
  const [hover, setHover] = useState<string | null>(null);
  const fmt = format ?? ((n: number) => Math.round(n).toLocaleString());

  const layout = useMemo(() => {
    const byId = new Map(nodes.map((n) => [n.id, n]));
    const inflow = new Map<string, number>();
    const outflow = new Map<string, number>();
    for (const l of links) {
      outflow.set(l.source, (outflow.get(l.source) ?? 0) + Math.max(0, l.value));
      inflow.set(l.target, (inflow.get(l.target) ?? 0) + Math.max(0, l.value));
    }
    const valueOf = (n: SankeyNode) => Math.max(0, n.value ?? Math.max(inflow.get(n.id) ?? 0, outflow.get(n.id) ?? 0));

    const cols = [...new Set(nodes.map((n) => n.column))].sort((a, b) => a - b);
    const colIndex = new Map(cols.map((c, i) => [c, i]));
    const byCol = cols.map((c) => nodes.filter((n) => n.column === c));
    const colTotals = byCol.map((list) => list.reduce((a, n) => a + valueOf(n), 0));
    const maxCount = Math.max(1, ...byCol.map((l) => l.length));
    const H = height ?? Math.max(240, maxCount * 28 + PAD_Y * 2);

    // Scale off the HEAVIEST column, so one value is one height on every side.
    const maxTotal = Math.max(1, ...colTotals);
    const scale = Math.max(0, (H - PAD_Y * 2 - (maxCount - 1) * GAP) / maxTotal);

    const padL = 4;
    const padR = labelWidth;
    const span = Math.max(1, W - padL - padR - NODE_W);
    const colX = (k: number) => (cols.length <= 1 ? padL + span / 2 : padL + (k * span) / (cols.length - 1));
    const lane = cols.length <= 1 ? padR : span / (cols.length - 1) - NODE_W - 12;

    const pos = new Map<string, { x: number; y: number; h: number; node: SankeyNode; share: number; chars: number }>();
    byCol.forEach((list, k) => {
      const used = list.reduce((a, n) => a + Math.max(valueOf(n) * scale, 1), 0) + (list.length - 1) * GAP;
      let y = Math.max((H - used) / 2, PAD_Y);
      const last = k === cols.length - 1;
      for (const n of list) {
        checkSlot(n.slot);
        const h = Math.max(valueOf(n) * scale, 1);
        pos.set(n.id, {
          x: colX(k),
          y,
          h,
          node: n,
          share: colTotals[k] > 0 ? valueOf(n) / colTotals[k] : 0,
          chars: Math.floor((last ? padR - 10 : lane) / CHAR_W),
        });
        y += h + GAP;
      }
    });

    // Ribbons leave each node in the order their far ends sit, which keeps the
    // crossings shallow; ordering by size alone produced a visible braid.
    const ordered = [...links]
      .filter((l) => pos.has(l.source) && pos.has(l.target) && l.value > 0)
      .sort((a, b) => {
        const sa = pos.get(a.source)!;
        const sb = pos.get(b.source)!;
        return sa.x - sb.x || sa.y - sb.y || pos.get(a.target)!.y - pos.get(b.target)!.y;
      });
    const outCursor = new Map<string, number>();
    const inCursor = new Map<string, number>();
    const ribbons = ordered.map((l) => {
      const s = pos.get(l.source)!;
      const t = pos.get(l.target)!;
      const h = Math.max(l.value * scale, 0.6);
      const y0 = outCursor.get(l.source) ?? s.y;
      const y1 = inCursor.get(l.target) ?? t.y;
      outCursor.set(l.source, y0 + h);
      inCursor.set(l.target, y1 + h);
      const x0 = s.x + NODE_W;
      const x1 = t.x;
      const mx = (x0 + x1) / 2;
      // A filled band, not a stroked line: a stroke cannot taper.
      const d =
        `M${x0},${y0} C${mx},${y0} ${mx},${y1} ${x1},${y1} ` +
        `L${x1},${y1 + h} C${mx},${y1 + h} ${mx},${y0 + h} ${x0},${y0 + h} Z`;
      const slot = checkSlot(l.slot) ?? byId.get(l.source)?.slot ?? byId.get(l.target)?.slot;
      return { key: `${l.source}->${l.target}`, link: l, d, slot };
    });

    return { H, pos, ribbons, colIndex, valueOf };
  }, [nodes, links, height, labelWidth, W]);

  const { H, pos, ribbons, valueOf } = layout;

  const touches = (r: (typeof ribbons)[number]) =>
    hover === null || hover === r.key || r.link.source === hover || r.link.target === hover;
  const near = (id: string) =>
    hover === null ||
    hover === id ||
    ribbons.some((r) => touches(r) && (r.link.source === id || r.link.target === id));

  const name = (id: string) => pos.get(id)?.node.label ?? id;

  return (
    <div className={cx('jrk-chart', 'jrk-sankey', hover !== null && 'jrk-sankey--focus', className)}>
      <div className="jrk-sankey__plot" ref={wrapRef}>
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label} onPointerLeave={() => setHover(null)}>
          {/* Ribbons first, so a node's own block sits above the bands leaving it. */}
          <g>
            {ribbons.map((r) => (
              <path
                key={r.key}
                d={r.d}
                className={cx(
                  'jrk-sankey__ribbon',
                  r.slot ? `jrk-s${r.slot}` : 'jrk-sankey__ribbon--neutral',
                  hover !== null && (touches(r) ? 'jrk-sankey__ribbon--lit' : 'jrk-sankey__ribbon--dim'),
                )}
                onPointerEnter={() => setHover(r.key)}
              >
                <title>{`${name(r.link.source)} → ${name(r.link.target)}: ${fmt(r.link.value)}`}</title>
              </path>
            ))}
          </g>

          {[...pos.values()].map(({ x, y, h, node, share: sh, chars }) => {
            const val = fmt(valueOf(node));
            const pct = share ? ` (${(sh * 100).toFixed(1)}%)` : '';
            const shown = clip(node.label, Math.max(2, chars - val.length - pct.length - 1));
            const full = `${node.label}: ${val}${pct}`;
            return (
              <g
                key={node.id}
                className={cx('jrk-sankey__group', !near(node.id) && 'jrk-sankey__group--dim')}
                onPointerEnter={() => setHover(node.id)}
              >
                <rect
                  className={cx(
                    'jrk-sankey__node',
                    node.slot ? `jrk-s${node.slot}` : 'jrk-sankey__node--neutral',
                    node.muted && 'jrk-sankey__node--muted',
                  )}
                  x={x}
                  y={y}
                  width={NODE_W}
                  height={h}
                  rx={2}
                >
                  <title>{full}</title>
                </rect>
                {/* Anchors as ATTRIBUTES: presentation that changes what a chart
                    means must not depend on a stylesheet having loaded. */}
                <text className="jrk-sankey__label" x={x + NODE_W + 6} y={y + h / 2} textAnchor="start" dominantBaseline="middle">
                  <title>{full}</title>
                  <tspan className="jrk-sankey__name">{shown}</tspan>
                  <tspan className="jrk-sankey__value">{` ${val}`}</tspan>
                  {pct && <tspan className="jrk-sankey__share">{pct}</tspan>}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      {legend && legend.length > 1 && (
        <div className="jrk-legend">
          {legend.map((item) => (
            <span key={item.label} className={cx('jrk-legend__item', `jrk-s${checkSlot(item.slot)}`)}>
              <span className="jrk-legend__swatch" aria-hidden="true" />
              {item.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
