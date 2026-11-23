import { Children, cloneElement, isValidElement, useId } from 'react';
import type { ReactElement, ReactNode } from 'react';
import { cx } from './utils';
import { Icon } from './Icon';

/* Stat tile — the right answer when the data is a single headline number.
   A one-bar chart is never better than a tile. */

export interface DeltaProps {
  /** Signed change. The arrow is chosen from the sign. */
  value: number;
  /** Whether an increase is good. For churn or error rate this is false — the
   *  library never assumes up means good. */
  upIsGood?: boolean;
  /** Names the comparison window. Required: a delta with no window is
   *  meaningless, so this is not optional. */
  vs: string;
  format?: (n: number) => string;
}

const defaultFormat = (n: number) => `${n > 0 ? '+' : ''}${n.toFixed(1)}%`;

export function Delta({ value, upIsGood = true, vs, format = defaultFormat }: DeltaProps) {
  const flat = value === 0;
  const up = value > 0;
  const tone = flat ? 'flat' : up === upIsGood ? 'good' : 'bad';

  return (
    <span className={cx('jrk-delta', `jrk-delta--${tone}`)}>
      {!flat && (
        <svg viewBox="0 0 12 12" aria-hidden="true" strokeLinecap="round" strokeLinejoin="round">
          {up ? <path d="M6 9.5V2.5M3 5.5L6 2.5l3 3" /> : <path d="M6 2.5v7M3 6.5l3 3 3-3" />}
        </svg>
      )}
      {/* The arrow is decorative, so the direction is also stated in text for
          screen readers — never conveyed by the glyph or color alone. */}
      <span className="jrk-sr-only">{flat ? 'no change' : up ? 'up' : 'down'}</span>
      {format(value)}
      <span className="jrk-text-muted"> {vs}</span>
    </span>
  );
}

export interface StatProps {
  label: string;
  value: ReactNode;
  unit?: string;
  delta?: DeltaProps;
  /** 12-ish point series for the sparkline. Shape only — no axes, no labels.
   *  If the reader needs to read values off it, it needs to be a real chart. */
  spark?: number[];
  footnote?: ReactNode;
  className?: string;
}

export function Stat({ label, value, unit, delta, spark, footnote, className }: StatProps) {
  return (
    <div className={cx('jrk-stat', spark && 'jrk-stat--with-spark', className)}>
      <span className="jrk-stat__label">{label}</span>
      <span className="jrk-stat__value">
        {value}
        {unit && <span className="jrk-stat__unit">{unit}</span>}
      </span>
      {spark && spark.length > 1 && <Sparkline points={spark} />}
      {(delta || footnote) && (
        <span className="jrk-stat__meta">
          {delta && <Delta {...delta} />}
          {footnote}
        </span>
      )}
    </div>
  );
}

export type SparkTone = 'series' | 'neutral' | 'warning' | 'critical' | 'good';

export interface SparklineProps {
  /** The original shape-only series. Still drawn exactly as before: line plus
   *  area wash, decorative. */
  points?: number[];
  /** A series that may have GAPS. `null` breaks the line — a month nobody
   *  measured is not a zero, and a line drawn across it claims a reading that
   *  does not exist. A lone reading between two gaps is drawn as a dot. */
  values?: (number | null)[];
  /** Makes the sparkline an image: `role="img"` and this label plus the values
   *  as its accessible name. Without it the sparkline is decorative and
   *  aria-hidden, because the number beside it is the accessible value. */
  label?: string;
  /** One per point. Adds a hover column per point carrying a native <title>
   *  ("Mar 2026: 41") — no script, so it works in a server component. */
  labels?: string[];
  format?: (n: number) => string;
  /** `series` is slot 1. The status tones are for a line whose SUBJECT is a
   *  verdict (an alarm count, a failure rate) — never to colour a healthy
   *  metric green. */
  tone?: SparkTone;
  /** Mark the last real reading. On by default for `values`: where the line
   *  stops is itself the finding, and a bare end is easy to lose at a cell
   *  edge. */
  endDot?: boolean;
  /** A reference value, drawn as a dashed hairline — a target, a normal day. */
  baseline?: number | null;
  /** The ~12% wash under the line. Default on for `points`, off for `values`. */
  area?: boolean;
  /** `hatch` shades every missing stretch so absence reads as absence. */
  gaps?: 'break' | 'hatch';
  /** Include zero in the domain. Off by default: a sparkline is shape only, so
   *  its own min-max is the right scale — but then two in one column are NOT
   *  comparable, which is why the figure beside each carries the magnitude. */
  zero?: boolean;
  /** `tile` is 96x40 beside a stat; `cell` is 72x22, inline in a table row
   *  without moving the row height. */
  size?: 'tile' | 'cell';
  className?: string;
}

const SPARK_SIZE = { tile: { w: 96, h: 40, pad: 3 }, cell: { w: 72, h: 22, pad: 2 } } as const;

/** Shape only — no axes, no labels. If the reader needs to read values off it,
 *  it needs to be a real chart. Decorative unless given a `label`. */
export function Sparkline({
  points, values, label, labels, format, tone = 'series', endDot, baseline = null, area, gaps = 'break',
  zero, size = 'tile', className,
}: SparklineProps) {
  const patternId = `jrk-spark-gap-${useId().replace(/:/g, '')}`;
  const series: (number | null)[] = values ?? points ?? [];
  const present = series.filter((v): v is number => v != null && Number.isFinite(v));
  const fmt = format ?? ((n: number) => n.toLocaleString());

  if (present.length < 2) {
    return label ? (
      <span className="jrk-spark-empty" aria-label={`${label}: not enough data`}>
        —
      </span>
    ) : null;
  }

  const { w, h, pad } = SPARK_SIZE[size];
  const drawArea = area ?? values === undefined;
  const drawEnd = endDot ?? values !== undefined;
  const lo = Math.min(...present, ...(baseline != null ? [baseline] : []), ...(zero ? [0] : []));
  const hi = Math.max(...present, ...(baseline != null ? [baseline] : []), ...(zero ? [0] : []));
  // A flat series would divide by zero; it draws as a centred line instead.
  const span = hi - lo || 1;
  const n = series.length;
  const x = (i: number) => (n <= 1 ? w / 2 : pad + (i * (w - pad * 2)) / (n - 1));
  const y = (v: number) => (hi === lo ? h / 2 : h - pad - ((v - lo) / span) * (h - pad * 2));

  const runs: [number, number][][] = [];
  let run: [number, number][] = [];
  series.forEach((v, i) => {
    if (v == null || !Number.isFinite(v)) {
      if (run.length) runs.push(run);
      run = [];
      return;
    }
    run.push([i, v]);
  });
  if (run.length) runs.push(run);

  const path = (r: [number, number][]) => r.map(([i, v], k) => `${k ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const last = runs[runs.length - 1];
  const end = last[last.length - 1];

  // Missing stretches, as x-ranges reaching halfway to each present neighbour.
  const gapRects: { x: number; w: number }[] = [];
  if (gaps === 'hatch') {
    let start: number | null = null;
    series.forEach((v, i) => {
      const missing = v == null || !Number.isFinite(v);
      if (missing && start === null) start = i;
      if ((!missing || i === n - 1) && start !== null) {
        const stop = missing ? i : i - 1;
        const step = (w - pad * 2) / Math.max(1, n - 1);
        const x0 = Math.max(0, x(start) - step / 2);
        const x1 = Math.min(w, x(stop) + step / 2);
        gapRects.push({ x: x0, w: x1 - x0 });
        start = null;
      }
    });
  }

  /* A ROUND MARK IS A STROKE, NOT A SHAPE. `preserveAspectRatio="none"` lets the
     viewBox fill any box and scales x and y differently, so a <circle> comes out
     an ellipse. A zero-length line with a round cap and a non-scaling stroke is a
     true circle at any scale. */
  const dot = (i: number, v: number, cls: string, key?: string | number) => (
    <line key={key} className={cls} x1={x(i)} y1={y(v)} x2={x(i) + 0.01} y2={y(v)} />
  );

  const step = n > 1 ? (w - pad * 2) / (n - 1) : w;
  const accessible = label ? `${label}: ${series.map((v) => (v == null ? 'no data' : fmt(v))).join(', ')}` : undefined;

  return (
    <svg
      className={cx('jrk-stat__spark', tone !== 'series' && `jrk-spark--${tone}`, size === 'cell' && 'jrk-spark--cell', className)}
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      role={label ? 'img' : undefined}
      aria-label={accessible}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      {gapRects.length > 0 && (
        <>
          <defs>
            <pattern id={patternId} width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <rect className="jrk-spark__gap-ground" width="4" height="4" />
              <line className="jrk-spark__gap-line" x1="0" y1="0" x2="0" y2="4" />
            </pattern>
          </defs>
          {gapRects.map((r, i) => (
            <rect key={`g${i}`} className="jrk-spark__gap" x={r.x} y={0} width={r.w} height={h} fill={`url(#${patternId})`} />
          ))}
        </>
      )}
      {baseline != null && <line className="jrk-spark__base" x1={0} x2={w} y1={y(baseline)} y2={y(baseline)} />}
      {drawArea &&
        runs
          .filter((r) => r.length > 1)
          .map((r, i) => (
            <path
              key={`a${i}`}
              className="jrk-spark-area"
              d={`${path(r)} L${x(r[r.length - 1][0]).toFixed(1)},${h} L${x(r[0][0]).toFixed(1)},${h} Z`}
            />
          ))}
      {runs.map((r, i) => (r.length > 1 ? <path key={`l${i}`} className="jrk-spark__line" d={path(r)} /> : dot(r[0][0], r[0][1], 'jrk-spark__dot', `d${i}`)))}
      {drawEnd && dot(end[0], end[1], 'jrk-spark__end')}
      {labels?.length === n &&
        series.map((v, i) => (
          <rect key={`h${i}`} className="jrk-spark__hit" x={Math.max(0, x(i) - step / 2)} y={0} width={step} height={h}>
            <title>{`${labels[i]}: ${v == null ? 'no data' : fmt(v)}`}</title>
          </rect>
        ))}
    </svg>
  );
}

/** Positional tones for a vivid row, teal first so the band's leading tile and
 *  the vivid topbar's leading stop are the same colour. Period four, so two
 *  ADJACENT tiles never share one. */
const VIVID_ORDER: VividTone[] = ['teal', 'violet', 'blue', 'rose'];

export interface StatRowProps {
  children: ReactNode;
  /** Discrete tiles with a gap, each its own enclosure. */
  split?: boolean;
  tinted?: boolean;
  /** A masthead band of vivid tiles, tone by POSITION. The tone is assigned
   *  here and not at the call site because a tone must never mean the metric —
   *  half the positional pairs collapse under CVD — and there is then no prop
   *  to misuse. Implies `split`: the joined row's `background: none` would
   *  erase every gradient. A `<VividStat>` that names its own tone keeps it
   *  (a semantic row); every other child gets the next position's. */
  vivid?: boolean;
  className?: string;
}

export function StatRow({ children, split, tinted, vivid, className }: StatRowProps) {
  let body: ReactNode = children;
  if (vivid) {
    // toArray drops `false` children, so the position counts tiles that exist.
    body = Children.toArray(children)
      .filter(isValidElement)
      .map((child, i) => {
        const tone = VIVID_ORDER[i % VIVID_ORDER.length];
        const el = child as ReactElement<{ className?: string; tone?: VividStatTone }>;
        if (el.type === VividStat) {
          return el.props.tone ? el : cloneElement(el, { tone });
        }
        return cloneElement(el, {
          className: cx(el.props.className, 'jrk-stat--vivid', `jrk-stat--${tone}`),
        });
      });
  }
  return (
    <div
      className={cx(
        'jrk-stat-row',
        (split || vivid) && 'jrk-stat-row--split',
        tinted && 'jrk-stat-row--tinted',
        vivid && 'jrk-stat-row--vivid',
        className,
      )}
    >
      {body}
    </div>
  );
}

/* ---------- vivid tile ---------- */

/** The four POSITIONAL tones. Pick one by the tile's position in the row, never
 *  by what the metric means.
 *
 *  Half these pairs collapse under simulated CVD — violet and blue are dE 1.9
 *  apart under protanopia, i.e. the same colour — which is unavoidable at the
 *  depth white text requires and is why `label` is required below. The moment
 *  "rose = revenue" becomes a house convention, hue is doing identity work it
 *  measurably cannot do. See $hueIsNotIdentity in tokens.json. */
export type VividTone = 'rose' | 'violet' | 'blue' | 'teal';

/** The three SEMANTIC tones, added 2026-08-20. A different kind of thing from
 *  `VividTone` — these mean what they say, and the rules are close to inverted.
 *  Read $semanticToneNote in tokens.json; the three that matter here:
 *
 *  1. ONE TONE PER ROW, chosen by the row's worst severity. Never mix these with
 *     each other, and never mix them with a positional tone. The CVD collapse
 *     above is unfixed — telling `critical` red from `warning` burnt orange is
 *     exactly the discrimination this palette cannot make — and a uniform row is
 *     what removes that task rather than pretending it was passed.
 *  2. The severity must be in the `label` or the `value` too. The tone is
 *     redundant encoding, never the encoding.
 *  3. A row with nothing wrong in it takes NO tone at all. `good` is for a row
 *     whose subject IS an improvement, not the resting state of a healthy one.
 *
 *  Note also that neither colour is the status colour you may be expecting:
 *  `warning` is a burnt #b45400 and `good` a forest #00813a, because the vivid
 *  tile carries white ink and status.warning.mark is 2.20:1 against white. */
export type SemanticTone = 'critical' | 'warning' | 'good';

/** Every tone a vivid tile accepts. Kept as a union of the two named types
 *  rather than one flat list of seven, so the distinction between "assigned by
 *  position" and "assigned by meaning" survives in the type and not only in a
 *  comment nobody reads at the call site. */
export type VividStatTone = VividTone | SemanticTone;

export interface VividStatProps {
  /** Required, and load-bearing: it is the tile's only identity channel. */
  label: string;
  value: ReactNode;
  unit?: string;
  /** Defaults to the brand blue. A multi-hue row is something you ask for, and
   *  with a `SemanticTone` it is something you must NOT ask for — see the note on
   *  `SemanticTone` for why one tone per row is a hard rule there. */
  tone?: VividStatTone;
  /** The period or scope line — "Jan 1 – Dec 31". Sized down, never dimmed:
   *  a vivid tile has no muted ink to dim it with. */
  caption?: ReactNode;
  delta?: DeltaProps;
  /** Corner action. Give it an accessible name; there is no visible label. */
  action?: { label: string; icon?: string; onClick?: () => void };
  /** Exactly one mini visualisation. All three are decorative by contract —
   *  the number beside them is the accessible value. */
  spark?: number[];
  bars?: number[];
  /** 0–1. Renders a ring with the percentage printed inside it, which is what
   *  makes the low-contrast remainder arc legal. */
  gauge?: number;
  className?: string;
}

/** The saturated gradient KPI tile — a dashboard masthead.
 *
 *  It is the loudest thing this library draws, so use it the way the sheet
 *  banner is used: one band, at the top, leading a page. It is also its own
 *  surface, which is why it takes no `<Button>` of any volume — `--cta` is
 *  filled with the accent anchor, which IS this tile's blue stop. */
export function VividStat({
  label,
  value,
  unit,
  tone = 'blue',
  caption,
  delta,
  action,
  spark,
  bars,
  gauge,
  className,
}: VividStatProps) {
  return (
    <div className={cx('jrk-stat', 'jrk-stat--vivid', `jrk-stat--${tone}`, className)}>
      <span className="jrk-stat__label">{label}</span>
      {action && (
        <button type="button" className="jrk-stat__action" onClick={action.onClick}>
          <Icon name={action.icon ?? 'ellipsis'} />
          <span className="jrk-sr-only">{action.label}</span>
        </button>
      )}
      <span className="jrk-stat__value">
        {value}
        {unit && <span className="jrk-stat__unit">{unit}</span>}
      </span>
      {(caption || delta) && (
        <span className="jrk-stat__caption">
          {delta && <Delta {...delta} />}
          {caption}
        </span>
      )}
      {spark && spark.length > 1 && <Sparkline points={spark} />}
      {bars && bars.length > 0 && <MiniBars values={bars} />}
      {gauge != null && <Gauge value={gauge} />}
    </div>
  );
}

/** Decorative by contract — aria-hidden, like the sparkline. The bars are
 *  `<span>`s inside a flex row, which blockifies them; an inline box would
 *  ignore height and the column would render as nothing. */
export function MiniBars({ values, className }: { values: number[]; className?: string }) {
  const max = Math.max(...values) || 1;
  return (
    <span className={cx('jrk-stat__bars', className)} aria-hidden="true">
      {values.map((v, i) => (
        <span key={i} style={{ height: `${Math.max(6, (v / max) * 100)}%` }} />
      ))}
    </span>
  );
}

/** Ring gauge, 0–1. The percentage is PRINTED inside the ring, and that is what
 *  makes the 1.6:1 remainder arc legal — nothing depends on reading the arc's
 *  extent. `<text>` rather than aria-hidden for the same reason: the figure is
 *  the accessible value here, not decoration.
 *
 *  Which is exactly why the ARC clamps and the LABEL does not. Only the arc has
 *  a reason to stop at 100%: a second lap is indistinguishable from the first
 *  and would read as a smaller number than it is. Printing the clamped figure
 *  too was a bug — at 118% the ring said "100%" beside a tile headline saying
 *  118%, two numbers disagreeing on one tile, and it undercut the one property
 *  the low-contrast arc depends on. The label is the truth; the arc is a capped
 *  picture of it. */
export function Gauge({ value, className }: { value: number; className?: string }) {
  const r = 22;
  const c = 2 * Math.PI * r;
  const pct = Math.min(1, Math.max(0, value));

  return (
    <svg className={cx('jrk-stat__gauge', className)} viewBox="0 0 52 52" focusable="false">
      <circle className="jrk-gauge-track" cx="26" cy="26" r={r} />
      <circle
        className="jrk-gauge-arc"
        cx="26"
        cy="26"
        r={r}
        strokeDasharray={`${(c * pct).toFixed(2)} ${c.toFixed(2)}`}
        // Start at 12 o'clock. Rotating the element rather than the whole SVG
        // keeps the <text> upright.
        transform="rotate(-90 26 26)"
      />
      <text x="26" y="26" textAnchor="middle" dominantBaseline="central">
        {Math.round(value * 100)}%
      </text>
    </svg>
  );
}
