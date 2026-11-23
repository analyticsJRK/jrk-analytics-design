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
  /** Squared corners and a mono face — for a code or an id (a property code, a
   *  work-order number), whose characters should line up between rows. */
  square?: boolean;
  /** Status tones show an icon by default. Turn it off only where the tone is
   *  decorative (a count chip), never where it carries meaning. A pressable badge
   *  defaults to no icon: its word and its solid-or-dashed edge carry the state. */
  icon?: boolean;
  /** Makes the badge the button that sets it — a HOT flag on a row. Called with
   *  the state a press asks for (`!pressed`). The caller saves and re-renders. */
  onPress?: (next: boolean) => void;
  /** The flag's state when `onPress` is given: `true` draws the tone's pill,
   *  `false` the same word in a dashed grey outline. */
  pressed?: boolean;
  /** A press is saving. Disables the button and marks it busy without changing
   *  its width, so the row does not jump. */
  busy?: boolean;
  /** Hover text — say what pressing will do. */
  title?: string;
  className?: string;
}

export function Badge({
  children,
  tone = 'neutral',
  variant = 'solid',
  size = 'md',
  square,
  icon,
  onPress,
  pressed = false,
  busy = false,
  title,
  className,
}: BadgeProps) {
  const pressable = typeof onPress === 'function';
  const showIcon = (icon ?? !pressable) && tone !== 'accent' && tone !== 'neutral';
  const classes = cx(
    'jrk-badge',
    tone !== 'neutral' && `jrk-badge--${tone}`,
    variant === 'outline' && 'jrk-badge--outline',
    size === 'sm' && 'jrk-badge--sm',
    square && 'jrk-badge--square',
    pressable && 'jrk-badge--toggle',
    className,
  );
  const content = (
    <>
      {busy ? (
        <span className="jrk-spinner jrk-spinner--em jrk-spinner--now" aria-hidden="true">
          <span className="jrk-spinner__ring" />
        </span>
      ) : (
        showIcon && <Icon name={STATUS_ICON[tone as StatusTone]} />
      )}
      {children}
    </>
  );

  /* `aria-pressed` is the state AND the style hook, so what is announced and what
     is drawn cannot disagree. */
  if (pressable) {
    return (
      <button
        type="button"
        className={classes}
        aria-pressed={pressed}
        aria-busy={busy || undefined}
        disabled={busy}
        title={title}
        onClick={() => onPress(!pressed)}
      >
        {content}
      </button>
    );
  }

  return (
    <span className={classes} title={title}>
      {content}
    </span>
  );
}

export interface AvatarProps {
  /** One or two letters. */
  initials: string;
  size?: 'sm' | 'md' | 'lg';
  /** The solid accent fill, for a vivid bar where the wash draws no circle. */
  solid?: boolean;
  /** The person's name. Given, the avatar is an image with that name; omitted, it
   *  is decoration beside a name already in the text. */
  label?: string;
  className?: string;
}

/** A person's initials in a circle. A mark, not a control. */
export function Avatar({ initials, size = 'md', solid, label, className }: AvatarProps) {
  return (
    <span
      className={cx('jrk-avatar', size !== 'md' && `jrk-avatar--${size}`, solid && 'jrk-avatar--solid', className)}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {initials.slice(0, 2).toUpperCase()}
    </span>
  );
}

export interface CountBadgeProps {
  count: number;
  /** Above this the badge reads `99+`. A four-digit count in a corner chip is
   *  noise; the exact figure belongs on the screen it opens. */
  max?: number;
  /** `critical` for something waiting on the reader (a bell), `accent` for a
   *  plain tally, `inverse` for a count inside a solid accent button. */
  tone?: 'critical' | 'accent' | 'inverse';
  /** Hang it off the top-right corner of the control it counts. */
  overlay?: boolean;
  /** Spoken after the number — "unread". The control's own name should already
   *  say what is being counted. */
  label?: string;
  className?: string;
}

/** The number on a bell or a Tasks button. Renders nothing at zero: an empty
 *  chip says "nothing" louder than no chip. */
export function CountBadge({ count, max = 99, tone = 'critical', overlay, label, className }: CountBadgeProps) {
  if (!(count > 0)) return null;
  const shown = count > max ? `${max}+` : String(count);
  return (
    <span
      className={cx(
        'jrk-count',
        tone !== 'critical' && `jrk-count--${tone}`,
        overlay && 'jrk-count--overlay',
        className,
      )}
    >
      {shown}
      {label && <span className="jrk-sr-only"> {label}</span>}
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
