import type { ReactNode } from 'react';
import { cx } from './utils';

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
