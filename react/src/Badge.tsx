import type { ReactNode } from 'react';
import { Icon, STATUS_ICON } from './Icon';
import { cx } from './utils';

export type StatusTone = 'good' | 'warning' | 'serious' | 'critical' | 'neutral';

/* Status icons are part of the contract, not decoration: on the light surface
   `warning` and `serious` sit below 3:1, and the icon + label pairing is the
   documented mitigation. Badge renders the FILLED glyph — SF uses filled
   symbols for status, and the punched-out mark lets it sit on the badge wash
   without knowing the wash colour. */

export interface BadgeProps {
  children: ReactNode;
  tone?: StatusTone | 'accent';
  variant?: 'solid' | 'outline';
  size?: 'sm' | 'md';
  /** Status tones show an icon by default. Turn it off only where the tone is
   *  decorative (a count chip), never where it carries meaning. */
  icon?: boolean;
  className?: string;
}

export function Badge({
  children,
  tone = 'neutral',
  variant = 'solid',
  size = 'md',
  icon = true,
  className,
}: BadgeProps) {
  const showIcon = icon && tone !== 'accent' && tone !== 'neutral';

  return (
    <span
      className={cx(
        'jrk-badge',
        tone !== 'neutral' && `jrk-badge--${tone}`,
        variant === 'outline' && 'jrk-badge--outline',
        size === 'sm' && 'jrk-badge--sm',
        className,
      )}
    >
      {showIcon && <Icon name={STATUS_ICON[tone as StatusTone]} />}
      {children}
    </span>
  );
}

export interface StatusProps {
  tone: StatusTone;
  children: ReactNode;
  /** Live-updating indicator (a running job, an open connection). */
  pulse?: boolean;
  className?: string;
}

/** Dot + text label. The dot is never rendered alone — a bare color is
 *  unreadable to a screen reader and to a colorblind reader both. */
export function Status({ tone, children, pulse, className }: StatusProps) {
  return (
    <span className={cx('jrk-status', className)}>
      <span
        className={cx('jrk-dot', `jrk-dot--${tone}`, pulse && 'jrk-dot--pulse')}
        aria-hidden="true"
      />
      {children}
    </span>
  );
}

export interface TagProps {
  children: ReactNode;
  onRemove?: () => void;
  /** Names the tag for the remove button's label, e.g. 'Remove filter Region'. */
  removeLabel?: string;
  className?: string;
}

export function Tag({ children, onRemove, removeLabel, className }: TagProps) {
  return (
    <span className={cx('jrk-tag', className)}>
      {children}
      {onRemove && (
        <button
          type="button"
          className="jrk-tag__remove"
          onClick={onRemove}
          aria-label={removeLabel ?? `Remove ${typeof children === 'string' ? children : 'tag'}`}
        >
          <Icon name="close" weight="semibold" />
        </button>
      )}
    </span>
  );
}
