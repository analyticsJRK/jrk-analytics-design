import { cx } from './utils';

/* Funnel — ordered stages, one hue, monotone steps.
 *
 * The rules this encodes are in css/components/funnel.css. The two that shape
 * the API:
 *
 *   - The stages are ORDINAL, so they take chart.sequential by position and
 *     there is no way to hand one a colour. Swapping two stages of a funnel
 *     changes what it says; that is the test charts.md gives for ordinal.
 *   - Six stages, because the ordinal ramp's legal window is six steps wide
 *     against the surfaces this library actually ships. Past that the component
 *     throws rather than reusing a step. */

/** Six, and it is a measurement rather than a taste — see the window derivation
 *  in funnel.css. A seventh stage folds into the tail, or the funnel splits at
 *  the point where the audience changes. */
export const MAX_FUNNEL_STAGES = 6;

export interface FunnelStage {
  /** Names the stage in the chart and in the table view. */
  label: string;
  value: number;
  /** Replaces the derived "N dropped" for this stage's inbound step. Use it
   *  when the loss has a name — "expired", "disqualified" — and not to restate
   *  a number the component already prints. */
  note?: string;
  /** The stage has NO SOURCE in this window — not zero, absent. It keeps its
   *  slot as a dashed outline at the width above it, prints "—", and states no
   *  rate into or out of it, because a rate against a number nobody measured
   *  is invented. */
  unfed?: boolean;
}

export interface FunnelProps {
  stages: FunnelStage[];
  format?: (n: number) => string;
  /** Baseline for the band widths. Defaults to the entry stage, which is what
   *  makes the first band full width. Pass an explicit max when two funnels
   *  must be read against each other. */
  max?: number;
  /** Step conversion at or below this fraction takes the alert tone. The tone
   *  is redundant: the rate is printed either way. */
  alertBelow?: number;
  /** Smallest band width, as a fraction of `max`. A stage under it is drawn AT
   *  it and tagged "not to scale" — a band of 0.3% would otherwise vanish, and
   *  a floor that is not said is a misdrawn number. Off by default. */
  minWidth?: number;
  /** Tighter rows and a thinner band, for two funnels side by side. */
  compact?: boolean;
  className?: string;
}

/** Ordered stages with the step conversion stated between them.
 *
 *  Bands are centred, which is what produces the funnel silhouette — but value
 *  stays on LENGTH, and every band prints its count and its share of entry,
 *  because two centred bars share no datum to compare against. */
export function Funnel({ stages, format, max, alertBelow, minWidth, compact, className }: FunnelProps) {
  if (stages.length > MAX_FUNNEL_STAGES) {
    throw new RangeError(
      `${stages.length} stages exceeds the ${MAX_FUNNEL_STAGES}-step ordinal ramp. The ramp is not ` +
        'extended and not cycled — a seventh step falls outside the window that clears 2:1 against ' +
        'both the light and the dark card. Fold the tail into one stage, or split the funnel where ' +
        'the audience changes.',
    );
  }

  if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
    const climb = stages.findIndex((s, i) => i > 0 && !s.unfed && !stages[i - 1].unfed && s.value > stages[i - 1].value);
    if (climb > 0) {
      console.warn(
        `[jrk] <Funnel> stage "${stages[climb].label}" is larger than the stage before it. A funnel ` +
          'is monotone by construction, and that is the assumption the centred bands rest on — the ' +
          'taper reads as a taper because it only ever narrows. If the counts really do grow, this ' +
          'is a stacked or grouped comparison, not a funnel.',
      );
    }
  }

  const entry = stages[0] && !stages[0].unfed ? stages[0].value : 0;
  const peak = max ?? Math.max(entry, ...stages.filter((s) => !s.unfed).map((s) => s.value));
  const fmt = format ?? ((n: number) => n.toLocaleString());

  // Band widths, as fractions of the peak. An unfed stage keeps the width above
  // it so its slot holds the silhouette instead of collapsing it.
  const widths: number[] = [];
  const floored: boolean[] = [];
  stages.forEach((s, i) => {
    if (s.unfed) {
      widths.push(i > 0 ? widths[i - 1] : 1);
      floored.push(false);
      return;
    }
    const raw = peak > 0 ? Math.max(0, s.value) / peak : 0;
    const under = minWidth !== undefined && raw < minWidth;
    widths.push(under ? minWidth : raw);
    floored.push(under);
  });

  return (
    <ol className={cx('jrk-funnel', compact && 'jrk-funnel--compact', className)} role="list">
      {stages.map((stage, i) => {
        const prev = i > 0 ? stages[i - 1] : undefined;
        const measured = prev && !prev.unfed && !stage.unfed;
        const rate = measured && prev.value > 0 ? stage.value / prev.value : undefined;
        const lost = measured ? prev.value - stage.value : 0;
        const alert = alertBelow !== undefined && rate !== undefined && rate <= alertBelow;

        return (
          <li className={cx('jrk-funnel__stage', stage.unfed && 'jrk-funnel__stage--unfed')} key={stage.label}>
            {prev && (
              <p className={cx('jrk-funnel__step', alert && 'jrk-funnel__step--alert')}>
                <span className="jrk-funnel__step-rate">
                  {rate === undefined ? '—' : `${pct(rate)} continue`}
                </span>
                <span className="jrk-funnel__step-loss">
                  {!measured ? 'no rate across an unfed stage' : stage.note ?? `${fmt(lost)} dropped`}
                </span>
              </p>
            )}

            {/* The count is the relief channel a centred band needs, and the
                share is the cumulative read the step rates do not give — a
                reader should never have to multiply four percentages. */}
            <span className="jrk-funnel__head">
              <span className="jrk-funnel__label" title={stage.label}>
                {stage.label}
              </span>
              {(stage.unfed || floored[i]) && (
                <span className="jrk-funnel__tag">{stage.unfed ? 'not fed' : 'not to scale'}</span>
              )}
              <span className="jrk-funnel__value">{stage.unfed ? '—' : fmt(stage.value)}</span>
              <span className="jrk-funnel__share">
                {stage.unfed || !(entry > 0) ? '—' : pct(stage.value / entry)}
              </span>
            </span>

            <span className="jrk-funnel__track">
              <span
                className={cx('jrk-funnel__fill', stage.unfed && 'jrk-funnel__fill--unfed')}
                style={cssVar('--jrk-funnel-width', `${widths[i] * 100}%`)}
              />
            </span>
          </li>
        );
      })}
    </ol>
  );
}

/* ================================= helpers ================================= */

/** Custom properties are not in React's CSSProperties, and the cast is confined
 *  to one place rather than repeated at every call site. */
function cssVar(name: string, value: string): React.CSSProperties {
  return { [name]: value } as React.CSSProperties;
}

/** One decimal below 10%, none above — a funnel's tail is where the precision
 *  is wanted, and "0.4%" and "62%" are both the number a reader would say. */
function pct(fraction: number) {
  const n = fraction * 100;
  return `${n < 10 ? n.toFixed(1) : Math.round(n)}%`;
}
