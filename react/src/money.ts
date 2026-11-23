/* NEGATIVE MONEY READS ($1,000) — the accounting form — and is painted red.
 *
 * Upstreamed from the portal 2026-11-23, where it is a standing rule on every screen
 * (directed 2026-11-11: "a hardcoded rule"). Two halves, and neither is per screen:
 *
 *  - THE TEXT. Every money formatter returns `usd(...)` / `usdShort(...)`, or passes a
 *    string it did not build through `paren(...)`, so a negative dollar figure never
 *    reads -$1,000 or $-1,000. A positive delta keeps its "+".
 *  - THE RED. `<NegativeHighlight />` colours every `NEGATIVE_MONEY` token on the page
 *    through the CSS Custom Highlight API (`::highlight(jrk-negative)` in base.css). It
 *    also catches a stray -$1,000 some formatter or API string still builds, so a miss
 *    shows as the wrong punctuation, never as a black negative.
 *
 * MONEY ONLY. Percentages, counts and scores keep their minus — a pest score below zero
 * is healthy, and parenthesising it would read as a loss. */

const AMOUNT = String.raw`\d[\d,]*(?:\.\d+)?[KMB]?`;

/** A negative dollar amount as it may appear on screen: ($1,000) · ($1.2M) · -$1,000 · −$4K · $-1,000. */
export const NEGATIVE_MONEY = new RegExp(
  String.raw`\(\$${AMOUNT}\)|(?<![\w$.])[-−]\s?\$${AMOUNT}|\$[-−]${AMOUNT}`,
  'g',
);

const MINUS_FORM = new RegExp(String.raw`(?<![\w$.])[-−]\s?\$(${AMOUNT})|\$[-−](${AMOUNT})`, 'g');

/** Rewrites every minus-signed dollar amount in a string as ($…): "-$1,000" → "($1,000)",
 *  "$-12.50/ton" → "($12.50)/ton". A string with none is returned unchanged. */
export function paren(s: string): string;
export function paren(s: string | null): string | null;
export function paren(s: string | null | undefined): string | null | undefined;
export function paren(s: string | null | undefined): string | null | undefined {
  if (!s || s.indexOf('$') < 0) return s;
  return s.replace(MINUS_FORM, (_m, a: string | undefined, b: string | undefined) => `($${a ?? b})`);
}

/** Dollars, accounting style: $1,000 and ($1,000). A value that rounds to zero is $0, never ($0). */
export function usd(n: number, dp = 0, locale = 'en-US'): string {
  const s = `$${Math.abs(n).toLocaleString(locale, { minimumFractionDigits: dp, maximumFractionDigits: dp })}`;
  return n < 0 && Math.abs(n) >= 0.5 * 10 ** -dp ? `(${s})` : s;
}

/** The same as `usd`, compact: $1.2M · ($850K) · $940. `dp` is the decimals on M and K. */
export function usdShort(n: number, dp = 1): string {
  const a = Math.abs(n);
  const s =
    a >= 1e6
      ? `$${(a / 1e6).toFixed(dp)}M`
      : a >= 1e3
        ? `$${(a / 1e3).toFixed(a >= 1e4 ? 0 : dp)}K`
        : `$${Math.round(a)}`;
  return n < 0 && (a >= 1e3 || Math.round(a) > 0) ? `(${s})` : s;
}
