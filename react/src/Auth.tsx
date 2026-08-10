import type { ReactNode } from 'react';
import { cx } from './utils';

/* Auth plane — the one screen with no shell.
 *
 * Every other layout here lives inside `<AppShell>`. A visitor who has not
 * signed in has no rail to navigate and no topbar to act from, so the login
 * screen is a single card centred in the viewport.
 *
 *   <AuthLayout brandName="JRK Analytics" meta="Production · jrk.com">
 *     <SsoButton provider="Microsoft" mark={<MicrosoftMark />} onClick={signIn} />
 *   </AuthLayout>
 *
 * THERE IS NO PASSWORD PROP, AND THERE WILL NOT BE ONE. Under SSO the identity
 * provider collects the credential and this page only hands the visitor off to
 * it. A password field beside "Continue with Microsoft" teaches people that
 * typing a work password into a non-Microsoft form is normal — the exact habit
 * SSO exists to break. A genuine local-login fallback belongs on its own route
 * behind a link, never on this card.
 *
 * This layer is layout only: the card is `Card`, the button is `Button`, an
 * error is `Alert`. See css/components/auth.css for the hairline rule and the
 * brand-mark contract. */

export interface AuthLayoutProps {
  /** Product name in the lockup. The initial becomes the mark unless `mark` is
   *  given — the library ships no brand asset, so this is the default. */
  brandName: string;
  /** Real logo instead of the initial. Fixed-colour artwork, not a `.jrk-icon`. */
  mark?: ReactNode;
  title?: ReactNode;
  subtitle?: ReactNode;
  /** Slot above the providers, for an `<Alert>`: sign-in failed, access denied,
   *  session expired. Use `tone="critical"` for a failure so it announces. */
  notice?: ReactNode;
  /** The provider buttons. */
  children: ReactNode;
  /** Reassurance under the buttons. Defaults to naming the redirect, which is
   *  what makes the absent password field read as deliberate — and what lets
   *  someone notice a page that ISN'T the real one. Pass null to drop it. */
  note?: ReactNode;
  /** Environment and tenant, under the card. On a login screen this is the only
   *  thing distinguishing production from staging before the redirect. */
  meta?: ReactNode;
  /** Help and legal microcopy. */
  footer?: ReactNode;
  className?: string;
}

export function AuthLayout({
  brandName,
  mark,
  title = 'Sign in',
  subtitle,
  notice,
  children,
  note,
  meta,
  footer,
  className,
}: AuthLayoutProps) {
  return (
    <main className={cx('jrk-auth', className)}>
      <div className="jrk-auth__panel">
        <div className="jrk-auth__brand">
          <span className="jrk-auth__mark" aria-hidden="true">
            {mark ?? brandName.trim().charAt(0).toUpperCase()}
          </span>
          <span>{brandName}</span>
        </div>

        <div className="jrk-card">
          <div className="jrk-card__body">
            <h1 className="jrk-auth__title">{title}</h1>
            {subtitle && <p className="jrk-auth__subtitle">{subtitle}</p>}
            {notice}
            <div className="jrk-auth__providers">{children}</div>
            {note !== null && (
              <p className="jrk-auth__note">
                {note ?? 'You will be redirected to your identity provider to sign in. Your password is never sent to this app.'}
              </p>
            )}
          </div>
        </div>

        {meta && <p className="jrk-auth__meta">{meta}</p>}
        {footer && <p className="jrk-auth__footer">{footer}</p>}
      </div>
    </main>
  );
}

export interface SsoButtonProps {
  /** Identity provider name, e.g. "Microsoft". Becomes "Sign in with Microsoft"
   *  — Microsoft's own branded string, and what JRK's existing Entra login
   *  already says, so the two match. Naming the provider is load-bearing, not
   *  decoration: it tells a visitor which credential they are about to use, and
   *  it is what lets someone notice a page that ISN'T the real one. */
  provider: string;
  /** Full label override, for the rare case the default reads wrong. */
  label?: ReactNode;
  /** The provider's logo. **The library deliberately ships none** — a design
   *  system should not carry other companies' trademarks, and their colours are
   *  fixed artwork rather than themed tokens. Pass inline SVG with its own
   *  fills; it renders at 18px and is left unthemed in both modes. Text-only is
   *  a legitimate fallback (Microsoft's own brand guidance allows it). */
  mark?: ReactNode;
  href?: string;
  onClick?: () => void;
  /** Mid-redirect: shows the spinner and blocks a second click, which matters
   *  more here than on an ordinary button because a double submit can start two
   *  auth flows.
   *
   *  ONLY REACHABLE IF YOU INTERCEPT THE CLICK. JRK's Entra flow is a plain
   *  server-side redirect — `<a href={authUrl}>` straight to
   *  `login.microsoftonline.com/{tenant}/oauth2/v2.0/authorize` — and the browser
   *  simply navigates, so there is no moment for a loading state to render. Use
   *  it only if you handle the click in JS and delay the navigation. */
  loading?: boolean;
  disabled?: boolean;
  className?: string;
}

export function SsoButton({
  provider,
  label,
  mark,
  href,
  onClick,
  loading,
  disabled,
  className,
}: SsoButtonProps) {
  const cls = cx(
    'jrk-btn',
    'jrk-btn--secondary',
    'jrk-btn--lg',
    'jrk-btn--block',
    'jrk-auth__provider',
    className,
  );

  const inner = (
    <>
      {mark && <span className="jrk-auth__provider-mark">{mark}</span>}
      <span>{label ?? `Sign in with ${provider}`}</span>
    </>
  );

  /* `--secondary`, not `--cta`. There is only one action on this page, so the
     usual "the CTA is the thing that commits" argument does not apply — nothing
     competes with it. A saturated accent rectangle would also fight the
     provider's own mark, which is the thing the reader is actually looking for,
     and the accent blue sits a hue away from Microsoft's own blue square. */
  if (href) {
    return (
      <a className={cls} href={href} aria-disabled={disabled || undefined}>
        {inner}
      </a>
    );
  }

  return (
    <button
      type="button"
      className={cls}
      onClick={onClick}
      disabled={disabled || loading}
      data-loading={loading || undefined}
      aria-busy={loading || undefined}
    >
      {inner}
    </button>
  );
}
