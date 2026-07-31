/**
 * Colorblind separation math, vendored so the gate cannot silently not run.
 *
 * This used to live only in the dataviz skill, reached through JRK_DATAVIZ. If
 * that variable was unset — which it is on a fresh clone — `npm run validate`
 * printed two warnings and exited 0, so `npm test` passed without ever checking
 * the property the palette exists to have. A gate that is off by default is not
 * a gate. The band / chroma / normal-vision checks still come from the skill;
 * only CVD separation is duplicated here, because only this one is load-bearing
 * enough that a silent skip is dangerous.
 *
 * Method: Machado, Oliveira & Fernandes (2009) severity-1.0 matrices applied to
 * linear RGB, then CIEDE2000 in CIELAB. Machado over the older Viénot/Brettel
 * because it is the model the same paper's severity ramp is built from, so
 * partial severities can be added later without changing the full-severity
 * numbers.
 */

/** deltaE below this and two hues are not separate identities. */
export const CVD_FLOOR = 10;

export const CVD_KINDS = ['protanopia', 'deuteranopia', 'tritanopia'];

const M = {
  normal:       [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
  protanopia:   [[0.152286, 1.052583, -0.204868], [0.114503, 0.786281, 0.099216], [-0.003882, -0.048116, 1.051998]],
  deuteranopia: [[0.367322, 0.860646, -0.227968], [0.280085, 0.672501, 0.047413], [-0.011820, 0.042940, 0.968881]],
  tritanopia:   [[1.255528, -0.076749, -0.178779], [-0.078411, 0.930809, 0.147602], [0.004733, 0.691367, 0.303900]],
};

const hex2rgb = (h) => {
  const v = h.replace('#', '');
  const n = v.length === 3 ? v.split('').map((c) => c + c).join('') : v;
  return [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16) / 255);
};
const toLin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const toSrgb = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);
const clamp01 = (x) => Math.min(1, Math.max(0, x));

/** Simulate a hex under one CVD type. Returns sRGB in 0..1. */
export function simulate(hex, kind) {
  const lin = hex2rgb(hex).map(toLin);
  return M[kind].map((row) => clamp01(row[0] * lin[0] + row[1] * lin[1] + row[2] * lin[2])).map(toSrgb);
}

function rgb2lab(rgb) {
  const [r, g, b] = rgb.map(toLin);
  const f = (t) => (t > 216 / 24389 ? Math.cbrt(t) : (24389 / 27 * t + 16) / 116);
  const x = f((0.4124564 * r + 0.3575761 * g + 0.1804375 * b) / 0.95047);
  const y = f((0.2126729 * r + 0.7151522 * g + 0.0721750 * b) / 1.0);
  const z = f((0.0193339 * r + 0.1191920 * g + 0.9503041 * b) / 1.08883);
  return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
}

export function ciede2000([L1, a1, b1], [L2, a2, b2]) {
  const rad = Math.PI / 180, deg = 180 / Math.PI;
  const C1 = Math.hypot(a1, b1), C2 = Math.hypot(a2, b2);
  const Cb = (C1 + C2) / 2;
  const G = 0.5 * (1 - Math.sqrt(Cb ** 7 / (Cb ** 7 + 25 ** 7)));
  const ap1 = (1 + G) * a1, ap2 = (1 + G) * a2;
  const Cp1 = Math.hypot(ap1, b1), Cp2 = Math.hypot(ap2, b2);
  const hp = (b, a) => { if (b === 0 && a === 0) return 0; const h = Math.atan2(b, a) * deg; return h < 0 ? h + 360 : h; };
  const hp1 = hp(b1, ap1), hp2 = hp(b2, ap2);
  const dL = L2 - L1, dC = Cp2 - Cp1;
  let dhp = 0;
  if (Cp1 * Cp2 !== 0) { dhp = hp2 - hp1; if (dhp > 180) dhp -= 360; else if (dhp < -180) dhp += 360; }
  const dH = 2 * Math.sqrt(Cp1 * Cp2) * Math.sin((dhp / 2) * rad);
  const Lb = (L1 + L2) / 2, Cpb = (Cp1 + Cp2) / 2;
  let hpb;
  if (Cp1 * Cp2 === 0) hpb = hp1 + hp2;
  else { hpb = (hp1 + hp2) / 2; if (Math.abs(hp1 - hp2) > 180) hpb += hp1 + hp2 < 360 ? 180 : -180; }
  const Tt = 1 - 0.17 * Math.cos((hpb - 30) * rad) + 0.24 * Math.cos(2 * hpb * rad)
           + 0.32 * Math.cos((3 * hpb + 6) * rad) - 0.20 * Math.cos((4 * hpb - 63) * rad);
  const dTh = 30 * Math.exp(-(((hpb - 275) / 25) ** 2));
  const Rc = 2 * Math.sqrt(Cpb ** 7 / (Cpb ** 7 + 25 ** 7));
  const Sl = 1 + (0.015 * (Lb - 50) ** 2) / Math.sqrt(20 + (Lb - 50) ** 2);
  const Sc = 1 + 0.045 * Cpb;
  const Sh = 1 + 0.015 * Cpb * Tt;
  const Rt = -Math.sin(2 * dTh * rad) * Rc;
  return Math.sqrt((dL / Sl) ** 2 + (dC / Sc) ** 2 + (dH / Sh) ** 2 + Rt * (dC / Sc) * (dH / Sh));
}

/** Worst separation between two hexes across all three CVD types. */
export function worstSeparation(hexA, hexB) {
  let worst = { deltaE: Infinity, kind: null };
  for (const kind of CVD_KINDS) {
    const d = ciede2000(rgb2lab(simulate(hexA, kind)), rgb2lab(simulate(hexB, kind)));
    if (d < worst.deltaE) worst = { deltaE: d, kind };
  }
  return worst;
}

/** Worst adjacent pair in a slot list — what touches in a stack or line chart. */
export function worstAdjacent(hexes) {
  let worst = { deltaE: Infinity };
  for (let i = 0; i < hexes.length - 1; i++) {
    const w = worstSeparation(hexes[i], hexes[i + 1]);
    if (w.deltaE < worst.deltaE) worst = { ...w, i, j: i + 1 };
  }
  return worst;
}

/** Largest N where every pair among the first N clears the floor. */
export function allPairsSafeCap(hexes, floor = CVD_FLOOR) {
  let cap = 1;
  for (let n = 2; n <= hexes.length; n++) {
    let ok = true;
    for (let i = 0; i < n && ok; i++) {
      for (let j = i + 1; j < n && ok; j++) {
        if (worstSeparation(hexes[i], hexes[j]).deltaE < floor) ok = false;
      }
    }
    if (!ok) break;
    cap = n;
  }
  return cap;
}
