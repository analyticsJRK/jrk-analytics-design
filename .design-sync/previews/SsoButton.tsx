import { AuthLayout, SsoButton } from '@jrk/design';

/* Provider logos are NOT library assets — a design system should not carry other
   companies' trademarks, and a brand mark's colours are fixed artwork that must
   survive both themes unchanged, which is the opposite of a token. Pass inline
   SVG with its own fills. It renders at 18px, unthemed.

   The label reads "Sign in with Microsoft" — Microsoft's own branded string, and
   what JRK's existing Entra login already says, so the two match. */
const MicrosoftMark = () => (
  <svg viewBox="0 0 21 21" aria-hidden="true">
    <rect x="1" y="1" width="9" height="9" fill="#f25022" />
    <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
    <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
    <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
  </svg>
);

const GoogleMark = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#4285f4" d="M23 12.2c0-.8-.1-1.6-.2-2.3H12v4.5h6.2a5.4 5.4 0 0 1-2.3 3.5v2.9h3.7A11.2 11.2 0 0 0 23 12.2z" />
    <path fill="#34a853" d="M12 23.5c3 0 5.6-1 7.5-2.7l-3.7-2.9c-1 .7-2.3 1.1-3.8 1.1a6.7 6.7 0 0 1-6.3-4.6H1.9v3A11.5 11.5 0 0 0 12 23.5z" />
    <path fill="#fbbc05" d="M5.7 14.4a6.9 6.9 0 0 1 0-4.4v-3H1.9a11.5 11.5 0 0 0 0 10.4l3.8-3z" />
    <path fill="#ea4335" d="M12 5.4c1.7 0 3.2.6 4.3 1.7l3.3-3.3A11.5 11.5 0 0 0 1.9 7l3.8 3A6.7 6.7 0 0 1 12 5.4z" />
  </svg>
);

/* One provider is the common case, and it gets `--secondary`, not `--cta`. The
   usual "the CTA is the thing that commits" argument does not apply when nothing
   competes with it — and a saturated accent rectangle would fight the provider's
   own mark, which is the thing the reader is actually looking for. */
export const Default = () => (
  <AuthLayout brandName="JRK Portfolio Manager" subtitle="Sign in with your organization account.">
    <SsoButton provider="Microsoft" mark={<MicrosoftMark />} href="#" />
  </AuthLayout>
);

/* Several providers, for the shape of it — JRK is single-provider today (one
   Entra app registration shared with forms.jrkanalytics.com). The marks sit in a
   straight column because the mark is
   pinned to the leading edge while the label stays centred — "which one is mine"
   is a scanning task and a ragged edge slows it down. */
export const MultipleProviders = () => (
  <AuthLayout
    brandName="JRK Portfolio Manager"
    subtitle="Choose the account you use for work."
    note="You will be redirected to your provider to sign in. Your password is never sent to this app."
  >
    <SsoButton provider="Microsoft" mark={<MicrosoftMark />} href="#" />
    <SsoButton provider="Google" mark={<GoogleMark />} href="#" />
  </AuthLayout>
);

/* Text-only is legitimate — Microsoft's own brand guidance allows it, and it
   avoids shipping a trademark you do not want to maintain. Naming the provider
   is the part that is load-bearing: it tells the visitor which credential they
   are about to use, and it is what lets someone notice a page that ISN'T real. */
export const WithoutAMark = () => (
  <AuthLayout brandName="JRK Portfolio Manager" subtitle="Sign in with your organization account.">
    <SsoButton provider="Microsoft" href="#" />
  </AuthLayout>
);

/* `loading` shows the spinner and blocks a second click — a double submit can
   start two auth flows. Button content goes to opacity 0 by library convention
   so the control cannot resize, which is why the words live in `note`.

   JRK'S OWN ENTRA FLOW NEVER REACHES THIS STATE. It is a plain server-side
   redirect — an <a> straight to the Entra authorize endpoint — so the browser
   just navigates. Only reachable if you intercept the click in JS. */
export const Redirecting = () => (
  <AuthLayout
    brandName="JRK Portfolio Manager"
    subtitle="Sign in with your organization account."
    note="Taking you to Microsoft…"
  >
    <SsoButton provider="Microsoft" mark={<MicrosoftMark />} loading />
  </AuthLayout>
);
