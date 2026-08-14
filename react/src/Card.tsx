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
  className,
}: CardProps) {
  return (
    <section className={cx('jrk-card', raised && 'jrk-card--raised', className)}>
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
 *  and should name the panel with `aria-describedby`. Opening on hover alone
 *  makes the figures reachable only with a pointer, which is the difference
 *  between a disclosure and a decoration.
 *
 *  Watch for clipping: the panel escapes its anchor, so any ancestor with
 *  `overflow: hidden` cuts it off. In this library that is the joined
 *  `.jrk-stat-row` (the split row is fine), `.jrk-expander`, and
 *  `.jrk-table-wrap`. */
export function HoverCard({
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
