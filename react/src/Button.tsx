import { forwardRef } from 'react';
import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  ElementType,
  MouseEvent as ReactMouseEvent,
  ReactElement,
  ReactNode,
  Ref,
  RefAttributes,
} from 'react';
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
  /** The filled green and amber outcomes beside `danger-solid` — approve and
   *  send back — so the three read as one set. Each fills with its status
   *  family's `solid` and labels with its `onSolid`. */
  | 'good-solid'
  | 'warning-solid'
  | 'danger-quiet'
  | 'link';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonOwnProps {
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

export interface ButtonProps extends ButtonOwnProps, Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'> {
  href?: undefined;
}

/** The LINK form: `href` renders `<a class="jrk-btn …">`. A control that GOES
 *  somewhere is a link — it can be opened in a tab, bookmarked and read out as a
 *  link — and the library had no way to say so, so a consumer hand-wrote the
 *  class string around its router's Link. */
export interface ButtonLinkProps extends ButtonOwnProps, Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'className'> {
  href: string;
  /** Renders without `href` and with `aria-disabled`, so it is neither followed
   *  nor focused. A link has no native disabled state. */
  disabled?: boolean;
  /** The element to render instead of `a` — a router's Link. The library ships no
   *  router; this is the seam. It receives `href`, `className`, `ref` and the
   *  anchor attributes. */
  linkAs?: ElementType;
}

type ButtonComponent = {
  (props: ButtonProps & RefAttributes<HTMLButtonElement>): ReactElement | null;
  (props: ButtonLinkProps & RefAttributes<HTMLAnchorElement>): ReactElement | null;
  displayName?: string;
};

const ButtonImpl = forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps | ButtonLinkProps>(function Button(
  props,
  ref,
) {
  const {
    variant = 'secondary',
    size = 'md',
    loading = false,
    iconOnly = false,
    block = false,
    leadingIcon,
    trailingIcon,
    children,
    className,
    ...rest
  } = props;

  if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production' && iconOnly && !rest['aria-label']) {
    console.warn('[jrk] <Button iconOnly> needs an aria-label — the icon is its only content.');
  }

  const cls = cx(
    'jrk-btn',
    `jrk-btn--${variant}`,
    size !== 'md' && `jrk-btn--${size}`,
    iconOnly && 'jrk-btn--icon',
    block && 'jrk-btn--block',
    className,
  );
  const content = (
    <>
      {leadingIcon}
      {children != null && <span>{children}</span>}
      {trailingIcon}
    </>
  );

  if (typeof props.href === 'string') {
    const { href, disabled, linkAs, onClick, tabIndex, ...anchor } = rest as Omit<ButtonLinkProps, keyof ButtonOwnProps | 'children'>;
    const off = !!disabled || loading;
    const Link: ElementType = linkAs ?? 'a';
    return (
      <Link
        {...anchor}
        ref={ref as Ref<HTMLAnchorElement>}
        /* No href while off: an `<a>` without one is not followed and not in the
           Tab order. role="link" keeps it announced as the link it is. */
        href={off ? undefined : href}
        role={off ? 'link' : anchor.role}
        tabIndex={off ? -1 : tabIndex}
        aria-disabled={off || undefined}
        data-loading={loading || undefined}
        aria-busy={loading || undefined}
        className={cls}
        onClick={off ? (e: ReactMouseEvent<HTMLAnchorElement>) => e.preventDefault() : onClick}
      >
        {content}
      </Link>
    );
  }

  const { disabled, type = 'button', ...button } = rest as Omit<ButtonProps, keyof ButtonOwnProps | 'children'>;
  return (
    <button
      {...button}
      ref={ref as Ref<HTMLButtonElement>}
      type={type}
      disabled={disabled || loading}
      data-loading={loading || undefined}
      aria-busy={loading || undefined}
      className={cls}
    >
      {content}
    </button>
  );
});

export const Button = ButtonImpl as ButtonComponent;
Button.displayName = 'Button';

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
