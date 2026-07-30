import type { ReactNode } from 'react';
import { cx } from './utils';

/* Inset grouped list — the Apple pattern.
 *
 * The shape iOS Settings and macOS System Settings are built from, and the one
 * that most makes an interface read as Apple. Use it for settings surfaces,
 * detail panels, and key/value summaries. Keep the stacked-label <Input> form
 * for genuine data entry with several free-text fields. */

export interface ListProps {
  /** Sentence case, secondary ink — NOT an uppercase tracked overline, which is
   *  a Material convention and one of the loudest non-Apple tells. */
  header?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  /** Roomier rows, for a settings surface rather than a dense data panel. */
  comfortable?: boolean;
  className?: string;
}

export function List({ header, footer, children, comfortable, className }: ListProps) {
  return (
    <div className={cx('jrk-list', comfortable && 'jrk-list--comfortable', className)}>
      {header && <div className="jrk-list__header">{header}</div>}
      <ul className="jrk-list__group">{children}</ul>
      {footer && <p className="jrk-list__footer">{footer}</p>}
    </div>
  );
}

export interface ListRowProps {
  label: ReactNode;
  /** Trailing value. Recessive by design — the label is what you scan. */
  value?: ReactNode;
  /** Secondary line under the label, for a row that needs explaining. */
  detail?: ReactNode;
  icon?: ReactNode;
  /** Makes the row navigate. Renders the chevron — Apple never uses a button
   *  here, the chevron IS the affordance. */
  href?: string;
  onClick?: () => void;
  selected?: boolean;
  /** The trailing element is a control rather than a value. Inside a grouped
   *  list Apple's fields have no chrome; the row itself is the field. */
  control?: ReactNode;
  className?: string;
}

export function ListRow({
  label, value, detail, icon, href, onClick, selected, control, className,
}: ListRowProps) {
  const interactive = Boolean(href || onClick);
  const inner = (
    <>
      {icon && <span className="jrk-list__icon">{icon}</span>}
      <span className="jrk-list__label">
        {label}
        {detail && <span className="jrk-list__detail">{detail}</span>}
      </span>
      {control ?? (value != null && <span className="jrk-list__value">{value}</span>)}
    </>
  );

  const cls = cx(
    'jrk-list__row',
    Boolean(icon) && 'jrk-list__row--icon',
    interactive && 'jrk-list__row--link',
    Boolean(control) && 'jrk-list__row--control',
    className,
  );

  if (href) {
    return <li><a className={cls} href={href} aria-selected={selected || undefined}>{inner}</a></li>;
  }
  if (onClick) {
    return <li><button type="button" className={cls} onClick={onClick} aria-selected={selected || undefined}>{inner}</button></li>;
  }
  return <li className={cls} aria-selected={selected || undefined}>{inner}</li>;
}
