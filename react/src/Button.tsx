import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cx } from './utils';

/** `primary` is the tinted everyday button. `cta` is the solid accent, reserved
 *  for the one committing action on a view — see the note in button.css. */
export type ButtonVariant =
  | 'primary'
  | 'cta'
  | 'secondary'
  | 'ghost'
  | 'danger'
  /** The filled red confirm inside a destructive dialog. Present in the CSS
   *  since it was written but missing from this union, so React callers could
   *  not reach it without a raw className. */
  | 'danger-solid'
  | 'danger-quiet'
  | 'link';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Renders the spinner and blocks interaction. Width is held steady so the
   *  button does not resize mid-action. */
  loading?: boolean;
  /** Square icon-only button. Requires `aria-label` — the icon is the only
   *  content, so nothing else names the control. */
  iconOnly?: boolean;
  block?: boolean;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  className?: string;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'secondary',
    size = 'md',
    loading = false,
    iconOnly = false,
    block = false,
    leadingIcon,
    trailingIcon,
    disabled,
    children,
    className,
    type = 'button',
    ...rest
  },
  ref,
) {
  if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production' && iconOnly && !rest['aria-label']) {
    console.warn('[jrk] <Button iconOnly> needs an aria-label — the icon is its only content.');
  }

  return (
    <button
      {...rest}
      ref={ref}
      type={type}
      disabled={disabled || loading}
      data-loading={loading || undefined}
      aria-busy={loading || undefined}
      className={cx(
        'jrk-btn',
        `jrk-btn--${variant}`,
        size !== 'md' && `jrk-btn--${size}`,
        iconOnly && 'jrk-btn--icon',
        block && 'jrk-btn--block',
        className,
      )}
    >
      {leadingIcon}
      {children != null && <span>{children}</span>}
      {trailingIcon}
    </button>
  );
});

export interface ButtonGroupProps {
  children: ReactNode;
  /** Set when the group is a set of view toggles rather than a toolbar, so
   *  assistive tech announces it as one control. */
  label?: string;
  className?: string;
}

export function ButtonGroup({ children, label, className }: ButtonGroupProps) {
  return (
    <div role="group" aria-label={label} className={cx('jrk-btn-group', className)}>
      {children}
    </div>
  );
}
