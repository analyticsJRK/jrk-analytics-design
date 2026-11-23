/* Type-to-select over navigation: the rail's rows, a page's tab strip, its section row.
 *
 * File Explorer's gesture. Typing a name moves focus to the first item that starts with it,
 * the same letter again moves on to the next one, and a pause starts a new search. Enter
 * opens the item, and <NavTypeahead> then puts focus on the next level down, so a reader can
 * keep typing their way in the way they would through folders.
 *
 * THIS FILE IS THE RULES AND NOTHING ELSE. No DOM, so the matching and the search order can
 * be pinned by a test without a browser. NavTypeahead.tsx reads the page and calls these. */

/** A pause longer than this starts a new search, as Explorer does. */
export const TYPEAHEAD_RESET_MS = 1000;

/** Case- and spacing-insensitive form of a label, which is what every match compares. */
export function normalizeTypeaheadLabel(text: string): string {
  return text.replace(/\s+/g, ' ').trim().toLowerCase();
}

/** "ppp" — the same key pressed again, which means "the next one", not a name with three p's. */
export function isTypeaheadRepeat(buffer: string): boolean {
  return buffer.length > 0 && [...buffer].every((c) => c === buffer[0]);
}

/* A LATER word of the label starts with the text: "comps" finds "Market Comps". Only a
   fallback — see typeaheadMatch — so it can never take a hit away from a label that starts with
   what was typed. */
function wordStarts(label: string, text: string): boolean {
  return label
    .split(/[\s&/,·:()\-–—]+/)
    .slice(1)
    .some((w) => w.startsWith(text));
}

/**
 * Which candidate to land on, or -1 for none.
 *
 * `labels` are normalised and already in search order (see `typeaheadOrder`). `from` is where
 * focus is in that list, or -1 when it is on none of them.
 *
 * A REPEATED key starts AFTER the current item, so pressing "p" again moves on and wraps. A
 * LONGER search starts ON it, so typing "po" while on "Portfolio" stays put rather than
 * jumping to the next "po".
 *
 * TWO PASSES, NOT ONE. Every label is tried as a prefix the whole way round first, and only
 * then as a word inside the label. One pass accepting either lets a word match that sits
 * earlier in the list beat a name that starts with the text — "con" would land on "Pest
 * Control" before "Contracts". Typing the start of a name always gets that name.
 */
export function typeaheadMatch(labels: readonly string[], buffer: string, from: number): number {
  const n = labels.length;
  if (!buffer || n === 0) return -1;
  const repeat = isTypeaheadRepeat(buffer);
  /* "ppp" searches for "p". Something that genuinely starts with the repeated text ("aa…")
     is cycled through by one letter as well. */
  const text = repeat ? buffer[0] : buffer;
  const start = repeat ? from + 1 : Math.max(from, 0);
  const tests = [(l: string) => l.startsWith(text), (l: string) => wordStarts(l, text)];
  for (const test of tests) {
    for (let step = 0; step < n; step++) {
      const k = (((start + step) % n) + n) % n;
      if (test(labels[k])) return k;
    }
  }
  return -1;
}

/**
 * One flat list to search, built from the levels on screen.
 *
 * `levels[0]` is the rail and `levels[1..]` are the page's strips top to bottom, so a higher
 * index is a DEEPER level. `focused` is the level holding focus (-1 for none) and `current`
 * is the focused item's index inside it.
 *
 * NOTHING FOCUSED: deepest first, rail last. That is the "current folder" — on a module page
 * the section row is what a reader is choosing between, and a name that is not there falls
 * through to the tabs and then to the rail. So "admin" finds the Admin tab and "snow" finds
 * the Snow module from the same place, with no mode to switch.
 *
 * SOMETHING FOCUSED: that level first, ROTATED so the current item leads, then the levels
 * below it nearest first, then the ones above. Without the rotation an item earlier in the
 * same strip would be found only after the whole rail had been searched.
 *
 * Build this ONCE PER BURST and keep it until the pause. Rebuilt on every key it re-centres
 * on wherever the last key landed, and a repeated letter then bounces between the two nearest
 * matches forever instead of going round every one.
 */
export function typeaheadOrder<T>(
  levels: readonly (readonly T[])[],
  focused: number,
  current: number,
): T[] {
  if (focused < 0 || focused >= levels.length) {
    const out: T[] = [];
    for (let d = levels.length - 1; d >= 0; d--) out.push(...levels[d]);
    return out;
  }
  const own = levels[focused];
  const at = current >= 0 && current < own.length ? current : 0;
  const out: T[] = [...own.slice(at), ...own.slice(0, at)];
  for (let d = focused + 1; d < levels.length; d++) out.push(...levels[d]);
  for (let d = focused - 1; d >= 0; d--) out.push(...levels[d]);
  return out;
}
