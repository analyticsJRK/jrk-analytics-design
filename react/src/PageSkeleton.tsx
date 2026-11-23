import type { CSSProperties, ReactNode } from 'react';
import { ScreenSpinner } from './Card';
import { cx } from './utils';

export interface PageSkeletonProps {
  /** Rendered for REAL. A route's name is not data, and showing it on the first
   *  frame tells the reader which page opened — a mistaken click is obvious at
   *  once instead of a second later. Omit it where the heading comes from the
   *  payload (a property's own name): a title that paints one string and swaps to
   *  another is worse than one that arrives once. */
  title?: ReactNode;
  /** The sr-only status line. Defaults to "Loading <title>…". */
  announce?: string;
  /** Real, interactive chrome between the header and the shimmer — a section
   *  strip, so a reader who opened the wrong section can leave before it loads. */
  nav?: ReactNode;
  /** Stat tiles in a band above the content. */
  tiles?: number;
  /** Table rows, and their column count. */
  rows?: number;
  cols?: number;
  /** Stacked card blocks instead of a table — the shape of a detail screen. */
  cards?: number;
  /** The centred ring over the shimmer. On by default: the shimmer stops the
   *  content jumping when it lands, the ring says the page is working, and a
   *  route's loading state is where the wait actually is. */
  spinner?: boolean;
  className?: string;
}

/* Deterministic width variation, NOT random: this renders on the server and again
   on the client, and `Math.random()` would hydrate as a mismatch. */
const LEAD = ['64%', '78%', '52%', '71%', '58%', '82%', '46%', '68%'];

/* `.jrk-skeleton` is a block, so a heading holding only one takes its height from
   the 0.75em bar instead of its own line box — about half — and everything under
   it jumps when the real text lands. Centring the bar in a min-height keeps the
   element's real line height and the bar's slim look at once. */
const BAR_LINE: CSSProperties = { display: 'flex', alignItems: 'center', minHeight: '1.45em' };

/** The loading state for a whole screen: the real title, a shimmer in the shape
 *  of what will land, and one status line.
 *
 *  GEOMETRY, NOT DECORATION. The counts exist so the skeleton occupies roughly the
 *  space its screen will. They need to be the right order of magnitude, not exact.
 *
 *  All the shimmer is `aria-hidden`: a screen reader gets one `role="status"`
 *  line naming the page instead of forty empty spans, and the region carries
 *  `aria-busy`. */
export function PageSkeleton({
  title,
  announce,
  nav,
  tiles = 0,
  rows = 0,
  cols = 6,
  cards = 0,
  spinner = true,
  className,
}: PageSkeletonProps) {
  const named = typeof title === 'string' ? title : undefined;
  return (
    <div className={cx('jrk-stack', className)} aria-busy="true">
      <p className="jrk-sr-only" role="status">
        {announce ?? (named ? `Loading ${named}…` : 'Loading…')}
      </p>

      {spinner && <ScreenSpinner />}

      <div className="jrk-page-header">
        <div>
          {title ? (
            <h1 className="jrk-page-header__title">{title}</h1>
          ) : (
            <h1 className="jrk-page-header__title" style={BAR_LINE}>
              <span className="jrk-skeleton" style={{ width: '13rem' }} aria-hidden="true" />
            </h1>
          )}
          <p className="jrk-page-header__desc" style={BAR_LINE}>
            <span className="jrk-skeleton" style={{ width: '22rem', maxWidth: '100%' }} aria-hidden="true" />
          </p>
        </div>
      </div>

      {nav}

      {tiles > 0 && (
        <div className="jrk-stat-row jrk-stat-row--split" aria-hidden="true">
          {Array.from({ length: tiles }, (_, i) => (
            <div className="jrk-stat" key={i}>
              <span className="jrk-stat__label">
                <span className="jrk-skeleton" style={{ width: '62%' }} />
              </span>
              <span className="jrk-stat__value">
                <span className="jrk-skeleton" style={{ width: '48%' }} />
              </span>
            </div>
          ))}
        </div>
      )}

      {rows > 0 && (
        /* No <thead>: column names are per screen and threading them through here
           buys nothing a reader can use, so the table is decorative and hidden. */
        <section className="jrk-card jrk-card--flush" aria-hidden="true">
          <div className="jrk-card__body jrk-card__body--flush">
            <div className="jrk-table-wrap">
              <table className="jrk-table jrk-table--compact">
                <tbody>
                  {Array.from({ length: rows }, (_, r) => (
                    <tr className="jrk-table__skeleton" key={r}>
                      {Array.from({ length: cols }, (_, c) => (
                        <td key={c}>
                          <span
                            className="jrk-skeleton"
                            style={{ width: c === 0 ? LEAD[r % LEAD.length] : '42%' }}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {Array.from({ length: cards }, (_, i) => (
        <section className="jrk-card" key={i} aria-hidden="true">
          <header className="jrk-card__header">
            <div>
              <h3 className="jrk-card__title" style={BAR_LINE}>
                <span className="jrk-skeleton" style={{ width: '9rem' }} />
              </h3>
            </div>
          </header>
          <div className="jrk-card__body jrk-stack" style={{ gap: 'var(--jrk-space-2_5)' }}>
            <span className="jrk-skeleton" style={{ width: '92%' }} />
            <span className="jrk-skeleton" style={{ width: '78%' }} />
            <span className="jrk-skeleton" style={{ width: '85%' }} />
          </div>
        </section>
      ))}
    </div>
  );
}
