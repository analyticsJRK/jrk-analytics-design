/* GENERATED GROUP COLOURS FOR THE ORG CHART — an explicit, opt-in exception.
 *
 * THIS BREAKS A LIBRARY RULE ON PURPOSE, AND ONLY HERE. Everywhere else the
 * eight-slot palette is never cycled and never extended (`seriesColor(8)`
 * throws), because there colour is the identity channel. The org chart's
 * default (`palette="cycled"`) keeps that discipline in its own form: eight
 * slots, texture as the second channel, and group 9 identical to group 1.
 *
 * A chart coloured by regional manager has seventeen groups, so five managers
 * wore a card byte-identical to someone else's — a failure visible to EVERYONE.
 * Directed: "so no two managers share a card". `<OrgChart palette="generated">`
 * hands every `group={n}` a hue of its own instead.
 *
 * WHAT IS PROMISED: no two groups get the same colour, at any count, and one
 * group keeps one colour everywhere it appears.
 *
 * WHAT IS NOT PROMISED: that seventeen hues are tellable apart by anyone. The
 * palette's measured all-pairs CVD cap is three, and that is a fact about human
 * vision, not about a palette. This fixes the identical-card failure and does
 * not pretend to fix the CVD one, so the colouring keeps exactly the standing
 * the org chart already gives it: an ACCELERATOR over a tree that draws the
 * grouping and labels every card. No legend-by-colour, no unlabelled card.
 *
 * HOW THE HUES ARE PLACED. Golden-angle rotation at one OKLCH lightness and
 * chroma — hue_i = 259° + (i - 1) x 137.508°, L 0.63, C 0.18, chroma backed off
 * (never clipped) where sRGB cannot hold it, which keeps hue and lightness
 * exact. Consecutive groups are 137.5° apart, the largest separation a
 * sequential assignment can have, and `assignGroups` numbers groups in READING
 * order — so the pair a reader compares is the most separated, the same
 * objective the eight-slot order was searched for, met here by construction.
 * The cost: the closest pair tightens as groups are added (12.4° at 17).
 * Texture is re-derived as `(slot - 1) % 4`, so consecutive groups differ in
 * both channels; at 17 groups every pair under 15° apart is split by texture.
 *
 * CONTRAST IS CHECKED, NOT ASSUMED. The solid fill is the hue multiplied by
 * 0.67 in gamma space (what `color-mix(in srgb, X 67%, black)` paints), and the
 * lightness is walked DOWN until white clears 4.5:1 on that fill — measured
 * 6.37:1 to 7.29:1 across the first twenty, so the loop is a backstop for a
 * constant somebody may revisit. The undeepened mark is the keyline: against a
 * white card it measures 3.28:1 to 3.86:1, clear of the 3:1 graphical floor.
 *
 * THESE ARE INLINE STYLES, NOT CSS, so `check-css` never sees them and the token
 * layer's hex discipline is unaffected. They are computed values on a
 * per-render basis — the one place in the library a colour is not a token. */

const GOLDEN_ANGLE = 137.508;
/** `chart-1` sits at ~259°, so group 1 stays the blue the chart opens on. */
const START_HUE = 259;
const LIGHTNESS = 0.63;
const CHROMA = 0.18;
/** What the solid fill keeps of the hue, in gamma space. */
const DEEPEN = 0.67;
/** WCAG body text — the name and role on a filled card. */
const MIN_CONTRAST = 4.5;

type Rgb = [number, number, number];

/** OKLCH -> LINEAR sRGB. Unclamped: a component outside [0,1] is the
 *  out-of-gamut signal. */
function oklchToLinear(l: number, c: number, hDeg: number): Rgb {
  const h = (hDeg * Math.PI) / 180;
  const a = c * Math.cos(h);
  const b = c * Math.sin(h);
  const lp = l + 0.3963377774 * a + 0.2158037573 * b;
  const mp = l - 0.1055613458 * a - 0.0638541728 * b;
  const sp = l - 0.0894841775 * a - 1.291485548 * b;
  const L = lp ** 3;
  const M = mp ** 3;
  const S = sp ** 3;
  return [
    4.0767416621 * L - 3.3077115913 * M + 0.2309699292 * S,
    -1.2684380046 * L + 2.6097574011 * M - 0.3413193965 * S,
    -0.0041960863 * L - 0.7034186147 * M + 1.707614701 * S,
  ];
}

const encode = (v: number) => (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055);
const decode = (v: number) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);

/** OKLCH -> sRGB bytes, REDUCING CHROMA rather than clipping channels — a
 *  per-channel clip shifts the HUE, which is the only thing carrying identity. */
function oklch(l: number, chroma: number, hue: number): Rgb {
  let c = chroma;
  let lin = oklchToLinear(l, c, hue);
  const inGamut = (v: Rgb) => v.every((x) => x >= -0.0005 && x <= 1.0005);
  while (!inGamut(lin) && c > 0) {
    c = Math.max(0, c - 0.002);
    lin = oklchToLinear(l, c, hue);
  }
  return lin.map((v) => Math.round(Math.min(1, Math.max(0, encode(v))) * 255)) as Rgb;
}

const luminance = ([r, g, b]: Rgb) => 0.2126 * decode(r / 255) + 0.7152 * decode(g / 255) + 0.0722 * decode(b / 255);
const contrastWithWhite = (rgb: Rgb) => 1.05 / (luminance(rgb) + 0.05);
const deepen = (rgb: Rgb) => rgb.map((v) => Math.round(v * DEEPEN)) as Rgb;
const hex = (rgb: Rgb) => `#${rgb.map((v) => v.toString(16).padStart(2, '0')).join('')}`;

export interface GeneratedGroupColor {
  /** The mark: keyline, hairline, a group box's edge. */
  mark: string;
  /** The solid fill, deepened until white type clears 4.5:1. */
  solid: string;
  /** White-on-`solid` contrast, as measured — never below 4.5 unless the
   *  lightness floor was hit, in which case the card is still the darkest
   *  legal value. */
  contrast: number;
}

const cache = new Map<number, GeneratedGroupColor>();

/** The colours for group `slot`, 1-based. Never repeats: `slot` is not reduced
 *  modulo anything. Memoised — a chart re-renders on every control. */
export function generatedGroupColor(slot: number): GeneratedGroupColor {
  const hit = cache.get(slot);
  if (hit) return hit;
  const hue = (((START_HUE + (slot - 1) * GOLDEN_ANGLE) % 360) + 360) % 360;
  let l = LIGHTNESS;
  let rgb = oklch(l, CHROMA, hue);
  // Bounded twice, so an unreachable target degrades to a dark card rather
  // than to a hung render.
  for (let i = 0; i < 60 && l > 0.2 && contrastWithWhite(deepen(rgb)) < MIN_CONTRAST; i++) {
    l -= 0.01;
    rgb = oklch(l, CHROMA, hue);
  }
  const solid = deepen(rgb);
  const value = { mark: hex(rgb), solid: hex(solid), contrast: Math.round(contrastWithWhite(solid) * 100) / 100 };
  cache.set(slot, value);
  return value;
}

const TEXTURES = ['solid', 'dash', 'dot', 'rail'] as const;

/** The keyline paint for group `slot`, or `undefined` where it is plain solid
 *  and the keyline's own fallback to `--jrk-org-group` already paints it.
 *  Written out with the colour IN it rather than as `var(--jrk-org-tex-*)`:
 *  those resolve against the element they are declared on, so the reference
 *  only works from the `<li>` and silently paints solid from anywhere else.
 *  Same rhythms as org.css — one channel, not a second. */
export function groupTexture(slot: number): string | undefined {
  const c = generatedGroupColor(slot).mark;
  switch (TEXTURES[(slot - 1) % TEXTURES.length]) {
    case 'dash':
      return `repeating-linear-gradient(to bottom, ${c} 0 6px, transparent 6px 10px)`;
    case 'dot':
      return `repeating-linear-gradient(to bottom, ${c} 0 2px, transparent 2px 6px)`;
    case 'rail':
      return `linear-gradient(to right, ${c} 0 1px, transparent 1px 3px, ${c} 3px 4px)`;
    default:
      return undefined;
  }
}

/** Every custom property a grouped node reads, for group `slot`. Put it on the
 *  NODE (`<li>`) so the subtree inherits it, exactly as a slot class would be.
 *  The tint for `groupFill` is mixed toward the card plane itself, so it follows
 *  the theme without a second value per theme. */
export function generatedGroupStyle(slot: number): Record<string, string> {
  const { mark, solid } = generatedGroupColor(slot);
  const texture = groupTexture(slot);
  const style: Record<string, string> = {
    '--jrk-org-group': mark,
    '--jrk-org-group-solid': solid,
    '--jrk-org-solid-ink': 'var(--jrk-chart-deep-ink)',
    '--jrk-org-group-fill': `color-mix(in oklab, ${mark} 22%, var(--jrk-surface-default))`,
  };
  // `initial` rather than omitted: a grouped node under another grouped node
  // would otherwise inherit its ancestor's gradient, colour and all.
  style['--jrk-org-group-texture'] = texture ?? 'initial';
  return style;
}
