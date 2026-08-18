import type { ReactNode } from 'react';
import { cx } from './utils';

export interface CardProps {
  title?: ReactNode;
  subtitle?: ReactNode;
  /** Right-hand slot in the header — a menu, a toggle, a time-range control. */
  actions?: ReactNode;
  footer?: ReactNode;
  children?: ReactNode;
  /** Elevation is opt-in. A dashboard of many tiles reads calmer flat. */
  raised?: boolean;
  /** Removes body padding — for a table or chart that should meet the edges. */
  flush?: boolean;
  /** The topbar's vibrancy material on a tile — a 72% fill over a saturated blur.
   *
   *  ONLY for a card with content BEHIND it: a sticky summary over a scrolling
   *  body, a panel laid on the vivid gradient band, a tile over an image. Over the
   *  plain page there is nothing to blur and the mix composites to a 1.03:1 step,
   *  so it is a normal card that has given up its fill for no visible effect.
   *
   *  It re-inks muted text to `text.secondary` on its own, because muted lands at
   *  3.4:1 once a saturated ground shows through. A LINK is still not safe there
   *  (`accent.text` falls to 3.45:1) and cannot be fixed by re-inking — the anchor
   *  is already the shallowest passing step on the hue. Read the modifier's header
   *  in card.css for the full hand-measured table; nothing gates a colour that is
   *  composited at runtime. */
  frosted?: boolean;
  className?: string;
}

export function Card({
  title,
  subtitle,
  actions,
  footer,
  children,
  raised,
  flush,
  frosted,
  className,
}: CardProps) {
  return (
    <section
      className={cx(
        'jrk-card',
        raised && 'jrk-card--raised',
        frosted && 'jrk-card--frosted',
        className,
      )}
    >
      {(title || actions) && (
        <header className="jrk-card__header">
          <div>
            {title && <h3 className="jrk-card__title">{title}</h3>}
            {subtitle && <p className="jrk-card__subtitle">{subtitle}</p>}
          </div>
          {actions && <div className="jrk-card__actions">{actions}</div>}
        </header>
      )}
      {children != null && (
        <div className={cx('jrk-card__body', flush && 'jrk-card__body--flush')}>{children}</div>
      )}
      {footer && <footer className="jrk-card__footer">{footer}</footer>}
    </section>
  );
}

export interface EmptyProps {
  title: string;
  /** Say what would appear here. An empty surface with no explanation reads
   *  as a bug. */
  description?: string;
  /** The action that produces the missing data. */
  action?: ReactNode;
  icon?: ReactNode;
  inline?: boolean;
  className?: string;
}

export function Empty({ title, description, action, icon, inline, className }: EmptyProps) {
  return (
    <div className={cx('jrk-empty', inline && 'jrk-empty--inline', className)}>
      {icon && <span className="jrk-empty__icon">{icon}</span>}
      <p className="jrk-empty__title">{title}</p>
      {description && <p className="jrk-empty__text">{description}</p>}
      {action && <div className="jrk-empty__actions">{action}</div>}
    </div>
  );
}

export interface AlertProps {
  tone?: 'good' | 'warning' | 'serious' | 'critical' | 'accent' | 'neutral';
  title?: ReactNode;
  children?: ReactNode;
  icon?: ReactNode;
  className?: string;
}

export function Alert({ tone = 'neutral', title, children, icon, className }: AlertProps) {
  // Critical messages interrupt; everything else is announced politely.
  const role = tone === 'critical' ? 'alert' : 'status';
  return (
    <div className={cx('jrk-alert', tone !== 'neutral' && `jrk-alert--${tone}`, className)} role={role}>
      {icon && <span className="jrk-alert__icon">{icon}</span>}
      <div className="jrk-alert__body">
        {title && <p className="jrk-alert__title">{title}</p>}
        {children && <div className="jrk-alert__text">{children}</div>}
      </div>
    </div>
  );
}

export interface HoverCardRow {
  label: ReactNode;
  value: ReactNode;
}

export interface HoverCardProps {
  /** The panel's id, and the target of the trigger's `aria-describedby`.
   *
   *  Optional only in the type. Without it the association the plain-CSS contract
   *  requires cannot be expressed from React at all — which is what this
   *  component's own preview did before the prop existed, pointing
   *  `aria-describedby` at nothing. That failure is silent in the worst way: the
   *  panel still opens on focus, so it looks reachable, and announces nothing. */
  id?: string;
  /** Names what the rows break down — usually the tile's own metric. */
  header?: ReactNode;
  rows?: HoverCardRow[];
  /** A closing line: the denominator, the as-of date. */
  note?: ReactNode;
  /** Free-form panel content instead of `rows`. */
  children?: ReactNode;
  /** Which corner the panel hangs from. There is no auto-flip — a measured
   *  position goes stale the moment anything reflows under it — so an author who
   *  knows the tile is at the end of a row or the foot of a page says so. */
  align?: 'start' | 'end';
  side?: 'below' | 'above';
  className?: string;
}

/** The breakdown behind a headline number, revealed on hover **and on focus**.
 *
 *  The trigger must be focusable — a `<button>` or a link, never a bare `<div>` —
 *  and must name the panel with `aria-describedby`, which means passing `id`
 *  here. Opening on hover alone makes the figures reachable only with a pointer,
 *  which is the difference between a disclosure and a decoration.
 *
 *  Watch for clipping: the panel escapes its anchor, so any ancestor with
 *  `overflow: hidden` cuts it off. In this library that is the joined
 *  `.jrk-stat-row` (the split row is fine), `.jrk-expander`, and
 *  `.jrk-table-wrap`. */
export function HoverCard({
  id,
  header,
  rows,
  note,
  children,
  align = 'start',
  side = 'below',
  className,
}: HoverCardProps) {
  return (
    <div
      id={id}
      className={cx(
        'jrk-hovercard',
        align === 'end' && 'jrk-hovercard--end',
        side === 'above' && 'jrk-hovercard--above',
        className,
      )}
      role="tooltip"
    >
      {header && <p className="jrk-hovercard__header">{header}</p>}
      {rows?.map((r, i) => (
        <p className="jrk-hovercard__row" key={i}>
          <span className="jrk-hovercard__label">{r.label}</span>
          <span className="jrk-hovercard__value">{r.value}</span>
        </p>
      ))}
      {children}
      {note && <p className="jrk-hovercard__note">{note}</p>}
    </div>
  );
}

/** Wraps a tile and its <HoverCard>. Block, not inline-flex: it holds a tile that
 *  has to keep filling its grid track. */
export function HoverCardAnchor({ children, className }: { children?: ReactNode; className?: string }) {
  return <div className={cx('jrk-hovercard-anchor', className)}>{children}</div>;
}

export function Spinner({ size = 'md', label = 'Loading' }: { size?: 'sm' | 'md' | 'lg'; label?: string }) {
  return (
    <>
      <span className={cx('jrk-spinner', size !== 'md' && `jrk-spinner--${size}`)} aria-hidden="true" />
      {/* A spinner alone announces nothing. */}
      <span className="jrk-sr-only" role="status">
        {label}
      </span>
    </>
  );
}
