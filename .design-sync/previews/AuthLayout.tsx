import { AuthLayout, SsoButton, Alert } from '@jrk/design';

/* Microsoft's four-square mark. The library deliberately ships no provider
   logos — a design system should not carry other companies' trademarks, and a
   brand mark's colours are fixed artwork rather than themed tokens, so they must
   survive both themes unchanged. Copy this into your app. */
const MicrosoftMark = () => (
  <svg viewBox="0 0 21 21" aria-hidden="true">
    <rect x="1" y="1" width="9" height="9" fill="#f25022" />
    <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
    <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
    <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
  </svg>
);

/* One note for every state: on a card showing six states of the SAME app, five
   saying "your identity provider" while one says "Microsoft Entra ID" reads as
   an oversight. Naming the provider is also the part that lets someone notice a
   page that ISN'T the real one. */
const NOTE = 'You will be redirected to Microsoft Entra ID to sign in. Your password is never sent to this app.';

const AlertIcon = () => (
  <svg viewBox="0 0 20 20" aria-hidden="true" strokeLinecap="round">
    <circle cx="10" cy="10" r="8" />
    <path d="M10 6v5M10 13.5h.01" />
  </svg>
);

/* The one screen with no shell. Every other layout here lives inside
   <AppShell>; a visitor who has not signed in has no rail to navigate and no
   topbar to act from, so this is a single card centred in the viewport.

   THE STATES BELOW ARE THE ONES JRK'S ENTRA FLOW ACTUALLY PRODUCES, read off
   `app/auth.py` and `app/main.py` in jrk-portfolio-manager rather than invented:
   a pure OAuth2 auth-code flow (no MSAL) against
   `login.microsoftonline.com/{tenant}`, a 7-day signed session cookie, a domain
   whitelist, and a per-request user-record re-check.

   `subtitle` says "organization account", not "your JRK account", and that is
   deliberate: the whitelist is `jrk.com` AND `twocoastliving.com`, so two
   organisations sign in here. Naming only one is wrong for half the users.

   THERE IS NO PASSWORD FIELD AND NO PROP FOR ONE. Under SSO the identity
   provider collects the credential and this page only hands the visitor off to
   it. A password box beside "Sign in with Microsoft" teaches people that typing
   a work password into a non-Microsoft form is normal — the exact habit SSO
   exists to break.

   `meta` is not decoration: before the redirect it is the only thing that
   distinguishes signing into production from staging. */
export const Default = () => (
  <AuthLayout
    brandName="JRK Portfolio Manager"
    subtitle="Sign in with your organization account."
    note={NOTE}
    meta="Production · portfolio.jrkanalytics.com"
    footer={<>Trouble signing in? <a href="#">Contact IT</a></>}
  >
    <SsoButton provider="Microsoft" mark={<MicrosoftMark />} href="#" />
  </AuthLayout>
);

/* Entra returned an `error` on the callback, or the code-for-token exchange
   failed. `tone="critical"` so `Alert` announces it — the visitor was thrown
   back here by a redirect and never saw it appear. Say what to do next; "an
   error occurred" is an apology, not a state. */
export const SignInFailed = () => (
  <AuthLayout
    brandName="JRK Portfolio Manager"
    subtitle="Sign in with your organization account."
    note={NOTE}
    meta="Production · portfolio.jrkanalytics.com"
    notice={
      <Alert tone="critical" title="Sign-in failed" icon={<AlertIcon />}>
        Microsoft could not complete the sign-in. Try again, or contact IT if it keeps happening.
      </Alert>
    }
  >
    <SsoButton provider="Microsoft" mark={<MicrosoftMark />} href="#" />
  </AuthLayout>
);

/* Authenticated but not authorised — a different fact from a failed sign-in, and
   the one most often collapsed into "login error". The Microsoft account is
   perfectly valid; its DOMAIN is not on the whitelist. So the title changes, the
   rejected domain is echoed back (guessing why you were refused is the worst
   part of this screen), and the remedy names a person rather than a mechanism. */
export const DomainNotPermitted = () => (
  <AuthLayout
    brandName="JRK Portfolio Manager"
    title="Access denied"
    subtitle="That Microsoft account signed in, but it is not from an authorized organization."
    note={NOTE}
    meta="Production · portfolio.jrkanalytics.com"
    notice={
      <Alert tone="serious" title="@contoso.com is not permitted" icon={<AlertIcon />}>
        Access is limited to JRK and Two Coast Living accounts. Sign in with your work account, or
        ask IT to add your organization.
      </Alert>
    }
  >
    <SsoButton provider="Microsoft" mark={<MicrosoftMark />} href="#" />
  </AuthLayout>
);

/* The 7-day signed cookie ran out. It is an ABSOLUTE window from the moment of
   sign-in, not an idle timeout, so do not write "after 7 days of inactivity" —
   that would be a lie a returning daily user could catch. `warning`, not
   `critical`: this is routine, not broken. */
export const SessionExpired = () => (
  <AuthLayout
    brandName="JRK Portfolio Manager"
    subtitle="Sign in with your organization account."
    note={NOTE}
    meta="Production · portfolio.jrkanalytics.com"
    notice={
      <Alert tone="warning" title="Your session expired" icon={<AlertIcon />}>
        Sessions last 7 days. Sign in again to pick up where you left off.
      </Alert>
    }
  >
    <SsoButton provider="Microsoft" mark={<MicrosoftMark />} href="#" />
  </AuthLayout>
);

/* A real state that is easy to miss: the user record is re-checked on every
   request, so an account disabled by an admin loses access immediately even
   though its 7-day cookie is still cryptographically valid. Signing in again
   will not fix it, so this state must NOT imply that it will — it is the one
   case where offering the button as the remedy would be a lie. It stays only
   because switching to a different account is legitimate. */
export const AccountDisabled = () => (
  <AuthLayout
    brandName="JRK Portfolio Manager"
    title="Account disabled"
    subtitle="Your access to Portfolio Manager has been turned off."
    note={NOTE}
    meta="Production · portfolio.jrkanalytics.com"
    notice={
      <Alert tone="serious" title="Signing in again will not restore access" icon={<AlertIcon />}>
        An administrator disabled this account. Contact IT to have it re-enabled.
      </Alert>
    }
    footer={<><a href="#">Contact IT</a> · Signed in with a different account? Use the button above.</>}
  >
    <SsoButton provider="Microsoft" mark={<MicrosoftMark />} href="#" />
  </AuthLayout>
);

/* Where Entra's logout lands: `post_logout_redirect_uri` points back at /login,
   so a deliberate sign-out and an expiry arrive at the same screen. Distinguish
   them — telling someone their session expired when they chose to leave reads as
   a system that is not paying attention. `good`, because nothing went wrong. */
export const SignedOut = () => (
  <AuthLayout
    brandName="JRK Portfolio Manager"
    subtitle="Sign in with your organization account."
    note={NOTE}
    meta="Production · portfolio.jrkanalytics.com"
    notice={
      <Alert tone="good" title="You are signed out" icon={<AlertIcon />}>
        Your Microsoft session was ended too. Sign in again whenever you are ready.
      </Alert>
    }
  >
    <SsoButton provider="Microsoft" mark={<MicrosoftMark />} href="#" />
  </AuthLayout>
);
