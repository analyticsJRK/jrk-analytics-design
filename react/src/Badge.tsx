import type { ReactNode } from 'react';
import { cx } from './utils';

export type StatusTone = 'good' | 'warning' | 'serious' | 'critical' | 'neutral';

/* Status icons are part of the contract, not decoration: on the light surface
   `warning` and `serious` sit below 3:1, and the icon + label pairing is the
   documented mitigation. A Badge with a tone always renders one. */
const ICONS: Record<StatusTone, ReactNode> = {
  good: <path d="M2.5 6.5L5 9l4.5-5" />,
  warning: <path d="M6 1.5L11 10.5H1L6 1.5zM6 5v2.5M6 9h.01" />,
  serious: <path d="M6 1.5v6M6 9.5h.01M6 1a5 5 0 100 10A5 5 0 006 1z" />,
  critical: <path d="M3 3l6 6M9 3l-6 6" />,
  neutral: <path d="M6 5.5V9M6 3.5h.01" />,
};

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
      {showIcon && (
        <svg viewBox="0 0 12 12" aria-hidden="true" strokeLinecap="round" strokeLinejoin="round">
          {ICONS[tone as StatusTone]}
        </svg>
      )}
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
          <svg viewBox="0 0 10 10" aria-hidden="true" strokeLinecap="round">
            <path d="M2 2l6 6M8 2l-6 6" />
          </svg>
        </button>
      )}
    </span>
  );
}
