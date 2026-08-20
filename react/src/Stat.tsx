import type { ReactNode } from 'react';
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

/** Decorative by contract — aria-hidden, because the number beside it is the
 *  accessible value. */
export function Sparkline({ points, className }: { points: number[]; className?: string }) {
  const w = 96;
  const h = 40;
  const pad = 3;
  const min = Math.min(...points);
  const max = Math.max(...points);
  // A flat series would divide by zero; render it as a centered line instead.
  const span = max - min || 1;
  const x = (i: number) => pad + (i * (w - pad * 2)) / (points.length - 1);
  const y = (v: number) => h - pad - ((v - min) / span) * (h - pad * 2);

  const line = points.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const area = `${line} L${x(points.length - 1).toFixed(1)},${h} L${x(0).toFixed(1)},${h} Z`;

  return (
    <svg
      className={cx('jrk-stat__spark', className)}
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      <path className="jrk-spark-area" d={area} />
      <path d={line} />
    </svg>
  );
}

export function StatRow({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx('jrk-stat-row', className)}>{children}</div>;
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
