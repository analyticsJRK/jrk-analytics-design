/* Getting a rendered chart out of the browser: a PNG, and a print document for
 * a PDF. Generic — any element, not only an org chart.
 *
 * IT SERIALISES WHAT IS ON SCREEN; IT DOES NOT REDRAW. Every connector in the
 * org chart is derived by CSS from the layout, so redrawing it from data would
 * be a second implementation of the geometry kept in step with this one, and
 * the first divergence would be an export that disagrees with the screen. The
 * element is cloned, the page's own same-origin stylesheets are inlined beside
 * it, and the browser lays it out again.
 *
 * TWO OUTPUTS, TWO MECHANISMS. The PNG is the clone in an SVG <foreignObject>
 * rasterised at 2x. The PDF is the clone in a print document with an `@page`
 * size, printed — vector, selectable, and paginated by the browser, which is
 * what makes "fit the width and run onto a second sheet" a real answer.
 *
 * THE TOKENS NEED HAND-CARRYING INTO THE PNG. Every value in the bundle is a
 * `var(--jrk-…)` resolved against `:root`, and inside a <foreignObject> the
 * root is the SVG, so `:root { … }` matches nothing. They are read off the live
 * document element and written onto the clone's wrapper — which also makes the
 * PNG follow the reader's theme and skin. The PRINT document does the
 * opposite on purpose: it inlines no resolved tokens and stamps
 * `data-theme="light"`, so a reader in dark mode does not spend a cartridge on
 * a near-black page. */

/** Cross-origin stylesheets (Google Fonts) throw on `cssRules` and are skipped,
 *  which costs the typeface. An @font-face the clone cannot load is worse than
 *  none — the metrics differ and text overflows its box — so a real stack is
 *  named instead and the browser measures what it will draw. */
const FONT_FALLBACK = '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif';

const TOKEN_RE = /--jrk-[a-zA-Z0-9_-]+/g;

/** CSS inches are exactly 96px, whatever the printer does. */
const PX_PER_IN = 96;

/** The caption line plus its margin, height-locked so this is a fact. It is
 *  inside the same printable box as the chart, so it is subtracted before
 *  asking whether the chart fits one sheet. */
const CAPTION_H = 30;

export type PageSize = { key: string; label: string; wIn: number; hIn: number };

export const PAGE_SIZES: PageSize[] = [
  { key: 'tabloid', label: 'Tabloid — 11 × 17 in', wIn: 11, hIn: 17 },
  { key: 'letter', label: 'Letter — 8.5 × 11 in', wIn: 8.5, hIn: 11 },
  { key: 'legal', label: 'Legal — 8.5 × 14 in', wIn: 8.5, hIn: 14 },
  { key: 'a3', label: 'A3 — 11.7 × 16.5 in', wIn: 11.69, hIn: 16.54 },
];

export type Orientation = 'portrait' | 'landscape';

/** `page` fits both axes, `width` fits the width and paginates down, `height`
 *  fits the height and tiles across, `across` is "N sheets wide", `actual` is
 *  100%, `custom` takes the two percentages. */
export type FitMode = 'page' | 'width' | 'height' | 'across' | 'actual' | 'custom';

export interface PrintOptions {
  page: PageSize;
  orientation: Orientation;
  /** Margin per side, inches. */
  marginIn: number;
  fit: FitMode;
  /** Whole percents, for `custom`. Two independent axes because a sheet size is
   *  usually chosen for one dimension; both equal is the undistorted default. */
  widthPct?: number;
  heightPct?: number;
  /** Sheets wide, for `across` — the honest unit for "how much wall am I
   *  giving this". Uniform and never enlarging. */
  across?: number;
  /** Printed above the chart, and on every tile: a quarter of a chart with no
   *  title is a sheet nobody can file. */
  caption?: string;
  /** Extra CSS for the print document only — the place for rules about what a
   *  particular chart looks like on paper. Applied after the page's own CSS. */
  extraCss?: string;
}

/* ------------------------------------------------------------------ measuring */

/** An element's size in CSS px with every ancestor's `zoom` divided back out.
 *  Rects inside a zoomed box come back pre-multiplied, and `offsetWidth` is
 *  not consistent across engines under zoom. */
export function naturalSize(el: HTMLElement): { width: number; height: number; zoom: number } {
  let zoom = 1;
  let node: HTMLElement | null = el;
  while (node) {
    const z = parseFloat(getComputedStyle(node).zoom || '1');
    if (Number.isFinite(z) && z > 0) zoom *= z;
    node = node.parentElement;
  }
  const rect = el.getBoundingClientRect();
  return { width: Math.ceil(rect.width / zoom), height: Math.ceil(rect.height / zoom), zoom };
}

/* ------------------------------------------------------------------ the cascade */

function harvest(): { css: string; vars: Record<string, string> } {
  const chunks: string[] = [];
  for (const sheet of Array.from(document.styleSheets)) {
    let rules: CSSRuleList | null = null;
    try {
      rules = sheet.cssRules;
    } catch {
      continue; // cross-origin — see FONT_FALLBACK
    }
    if (!rules) continue;
    for (const rule of Array.from(rules)) {
      if (rule instanceof CSSFontFaceRule) continue;
      /* The page's own print rules are about the page's SCREEN, not this
         document. Harvested, an app's `@page { size: landscape }` competes with
         the one written below and wins or loses on source order — silently.
         Only a media list of exactly `print` goes; `screen, print` also applies
         on screen and dropping it would change the clone. */
      if (typeof CSSPageRule !== 'undefined' && rule instanceof CSSPageRule) continue;
      if (rule instanceof CSSMediaRule && rule.media.mediaText.trim() === 'print') continue;
      chunks.push(rule.cssText);
    }
  }
  /* Every external url() comes out. An SVG drawn as an image cannot fetch, and an
     unfulfilled external reference TAINTS the canvas, after which `toBlob`
     throws. `url(data:…)` and `url(#…)` are self-contained and stay. */
  const css = chunks.join('\n').replace(/url\((['"]?)(?:https?:)?\/\/[^)]*\)/g, 'none');
  const root = getComputedStyle(document.documentElement);
  const vars: Record<string, string> = {};
  for (const name of new Set(css.match(TOKEN_RE) ?? [])) {
    const value = root.getPropertyValue(name);
    if (value) vars[name] = value.trim();
  }
  return { css, vars };
}

/** The page's own ground. A transparent PNG looks right in a browser and lands
 *  black-on-black in a dark deck. */
function pageBackground(): string {
  const body = getComputedStyle(document.body).backgroundColor;
  if (body && body !== 'rgba(0, 0, 0, 0)' && body !== 'transparent') return body;
  return getComputedStyle(document.documentElement).backgroundColor || 'white';
}

const escapeAttr = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/* ------------------------------------------------------------------ PNG */

export interface PngOptions {
  /** Multiplies the raster only — layout happens once at natural size, so 2x
   *  is a sharper picture of the same chart, not a different one. */
  scale?: number;
  /** Defaults to the page's own background. */
  background?: string;
}

/** The rendered element as a PNG blob. */
export async function chartToPng(el: HTMLElement, { scale = 2, background }: PngOptions = {}): Promise<Blob> {
  const { width, height } = naturalSize(el);
  const { css, vars } = harvest();
  const ground = background ?? pageBackground();
  const wrapper =
    `${Object.entries(vars).map(([k, v]) => `${k}:${v}`).join(';')};` +
    `width:${width}px;height:${height}px;background:${ground};color-scheme:normal;font-family:${FONT_FALLBACK};`;

  /* XMLSerializer, not outerHTML: the SVG is parsed as XML, and an unclosed void
     element is a parse error that comes back as a blank image. */
  const clone = el.cloneNode(true) as HTMLElement;
  // The zoom is the reader's session, not the document's.
  clone.style.removeProperty('zoom');
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">` +
    `<foreignObject x="0" y="0" width="${width}" height="${height}">` +
    `<div xmlns="http://www.w3.org/1999/xhtml" style="${escapeAttr(wrapper)}">` +
    // CDATA: selectors contain `>` and `&`, parse errors in XML character data.
    `<style><![CDATA[\n${css}\n]]></style>` +
    new XMLSerializer().serializeToString(clone) +
    `</div></foreignObject></svg>`;

  /* A DATA URI, NOT A BLOB URL. A blob URL reads as tidier and Chrome refuses to
     export the canvas it produces ("Tainted canvases may not be exported"); a
     data: URI carries no origin to compare. */
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = () => reject(new Error('The browser could not rasterise the chart. Try the print export.'));
    i.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  });
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('This browser gave no 2D canvas context.');
  ctx.scale(scale, scale);
  ctx.fillStyle = ground;
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0, width, height);
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('The canvas produced no image.'))), 'image/png');
  });
}

/* ------------------------------------------------------------------ print maths */

/** The printable box in CSS px, orientation applied. `contentHeight` is what is
 *  left for the chart once the caption has its line — every fit measures
 *  against it, or a chart that fits by a hair lands on two sheets. */
export function printableBox(page: PageSize, orientation: Orientation, marginIn: number) {
  const [w, h] = orientation === 'landscape' ? [page.hIn, page.wIn] : [page.wIn, page.hIn];
  const height = Math.max(1, (h - marginIn * 2) * PX_PER_IN);
  return {
    wIn: w,
    hIn: h,
    width: Math.max(1, (w - marginIn * 2) * PX_PER_IN),
    height,
    contentHeight: Math.max(1, height - CAPTION_H),
  };
}

/** The uniform fits. `width` deliberately does not clamp the height: overflowing
 *  downward is what makes the browser paginate. Never enlarges past 100%. */
export function fitScales(
  natural: { width: number; height: number },
  box: { width: number; height: number },
  mode: Exclude<FitMode, 'custom' | 'across'>,
): { scaleX: number; scaleY: number } {
  const fx = box.width / Math.max(1, natural.width);
  const fy = box.height / Math.max(1, natural.height);
  const k = mode === 'page' ? Math.min(fx, fy, 1) : mode === 'width' ? Math.min(fx, 1) : mode === 'height' ? Math.min(fy, 1) : 1;
  return { scaleX: k, scaleY: k };
}

export function scalesFor(
  opts: Pick<PrintOptions, 'fit' | 'widthPct' | 'heightPct' | 'across'>,
  natural: { width: number; height: number },
  box: { width: number; height: number },
): { scaleX: number; scaleY: number } {
  if (opts.fit === 'custom') return { scaleX: (opts.widthPct ?? 100) / 100, scaleY: (opts.heightPct ?? 100) / 100 };
  if (opts.fit === 'across') {
    const n = Math.max(1, Math.round(opts.across ?? 1));
    const k = Math.min((box.width * n) / Math.max(1, natural.width), 1);
    return { scaleX: k, scaleY: k };
  }
  return fitScales(natural, box, opts.fit);
}

/** How many sheets a scale produces — what an export dialog quotes before the
 *  reader commits. */
export function sheetCount(
  natural: { width: number; height: number },
  scale: { scaleX: number; scaleY: number },
  box: { width: number; height: number },
): { across: number; down: number } {
  const w = Math.ceil(natural.width * scale.scaleX);
  const h = Math.ceil(natural.height * scale.scaleY);
  if (w <= box.width && h + CAPTION_H <= box.height) return { across: 1, down: 1 };
  return {
    across: Math.max(1, Math.ceil(w / Math.floor(box.width))),
    down: Math.max(1, Math.ceil(h / (Math.floor(box.height) - CAPTION_H))),
  };
}

/* ------------------------------------------------------------------ print document */

function writePrintDoc(doc: Document, el: HTMLElement, opts: PrintOptions): void {
  const { css } = harvest();
  const sheet = printableBox(opts.page, opts.orientation, opts.marginIn);
  doc.open();
  doc.write(
    '<!doctype html><html data-theme="light"><head><meta charset="utf-8">' +
      `<title>${escapeHtml(opts.caption ?? 'Chart')}</title>` +
      `<style>\n${css}\n</style><style>` +
      /* ORIENTATION IS THE ORDER OF THE TWO LENGTHS, never a keyword beside
         them. `size` takes `<length>{1,2}` OR `<page-size> || orientation`, and
         the grammars do not mix: `11in 17in landscape` is invalid, dropped, and
         the browser falls back to ITS paper. Lengths only. */
      `@page { size: ${sheet.wIn}in ${sheet.hIn}in; margin: ${opts.marginIn}in; }` +
      'html, body { margin: 0; padding: 0; background: var(--jrk-surface-default, white); ' +
      `font-family: ${FONT_FALLBACK}; -webkit-print-color-adjust: exact; print-color-adjust: exact; }` +
      /* Each axis is centred only once it is known to fit: centring content
         WIDER than the page crops its leading edge unreachably. */
      '.jrk-print__sheet { display: flex; flex-direction: column; align-items: flex-start; }' +
      '.jrk-print--cx .jrk-print__sheet { align-items: center; }' +
      '.jrk-print--cy .jrk-print__sheet { justify-content: center; }' +
      `.jrk-print__cap { margin: 0 0 8px; height: ${CAPTION_H - 8}px; font-size: 11px; line-height: 1.4; ` +
      'color: var(--jrk-text-secondary, gray); }' +
      '.jrk-print__box { overflow: hidden; }' +
      '.jrk-print__in { transform-origin: 0 0; }' +
      // A screen's scroll ports have no meaning on paper.
      '.jrk-org-scroll, .jrk-org-canvas__view { overflow: visible !important; max-height: none !important; }' +
      (opts.extraCss ?? '') +
      '</style></head><body>' +
      '<div class="jrk-print__sheet">' +
      (opts.caption ? `<p class="jrk-print__cap">${escapeHtml(opts.caption)}</p>` : '') +
      '<div class="jrk-print__box" id="jrk-print-box"><div class="jrk-print__in" id="jrk-print-slot"></div></div>' +
      '</div></body></html>',
  );
  doc.close();
  const slot = doc.getElementById('jrk-print-slot');
  if (slot) {
    const clone = doc.importNode(el, true) as HTMLElement;
    clone.style.removeProperty('zoom');
    slot.appendChild(clone);
  }
}

/** Two frames, not a timer: the document has to have laid out before anything
 *  measures or prints it, and a sleep is either a stall or a race. */
const settled = () => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));

async function measureIn(doc: Document): Promise<{ width: number; height: number }> {
  await settled();
  const el = doc.getElementById('jrk-print-slot')?.firstElementChild as HTMLElement | null;
  if (!el) return { width: 1, height: 1 };
  const rect = el.getBoundingClientRect();
  return { width: Math.ceil(rect.width) || 1, height: Math.ceil(rect.height) || 1 };
}

function applyScale(
  doc: Document,
  natural: { width: number; height: number },
  { scaleX, scaleY }: { scaleX: number; scaleY: number },
  box: { width: number; height: number },
): void {
  const w = Math.ceil(natural.width * scaleX);
  const h = Math.ceil(natural.height * scaleY);
  const outer = doc.getElementById('jrk-print-box');
  const inner = doc.getElementById('jrk-print-slot');
  /* The OUTER box states the scaled size because a transform does not affect
     layout and the browser needs a real box to count sheets. `zoom` would get
     that free and cannot express two axes. */
  if (outer) {
    outer.style.width = `${w}px`;
    outer.style.height = `${h}px`;
  }
  if (inner) {
    inner.style.width = `${natural.width}px`;
    inner.style.height = `${natural.height}px`;
    inner.style.transform = `scale(${scaleX}, ${scaleY})`;
  }
  const sheet = doc.querySelector<HTMLElement>('.jrk-print__sheet');
  const fitsDown = h + CAPTION_H <= box.height;
  // Measured in px rather than `100vh`: whether vh includes the @page margins
  // differs by engine, and being wrong pushes a one-page chart onto two.
  if (sheet) sheet.style.minHeight = fitsDown ? `${Math.floor(box.height)}px` : '';
  doc.documentElement.classList.toggle('jrk-print--cx', w <= box.width);
  doc.documentElement.classList.toggle('jrk-print--cy', fitsDown);
  tile(doc, w, h, box);
}

/* TILING, because print layout paginates in the BLOCK direction only — inline
 * overflow is clipped in every engine, and no property asks for column pages.
 * So a chart wider than the sheet is cut into real page-sized windows, both
 * axes, each one positioned by hand: the count a dialog quotes is then the
 * count that comes out of the printer. It clones, and the cost is real (an
 * N x M tiling is N x M copies); one node cannot appear on six pages.
 * Every tile carries the caption with its position ("sheet 2/3 across"), and
 * the sheet's own caption is hidden so page one does not print it twice.
 * Idempotent: rebuilt from the original box on every scale change. */
function tile(doc: Document, w: number, h: number, box: { width: number; height: number }): void {
  const sheet = doc.querySelector<HTMLElement>('.jrk-print__sheet');
  const box0 = doc.getElementById('jrk-print-box');
  if (!sheet || !box0) return;
  for (const extra of Array.from(doc.querySelectorAll('.jrk-print__tile'))) {
    if (!extra.contains(box0)) extra.remove();
  }
  const host = box0.closest('.jrk-print__tile');
  if (host) host.replaceWith(box0);
  box0.style.transform = '';
  const cap = sheet.querySelector<HTMLElement>(':scope > .jrk-print__cap');
  if (cap) cap.style.display = '';

  const pageW = Math.floor(box.width);
  const pageH = Math.floor(box.height) - CAPTION_H;
  if (pageW <= 0 || pageH <= 0) return;
  const cols = Math.max(1, Math.ceil(w / pageW));
  const rows = Math.max(1, Math.ceil(h / pageH));
  if (cols === 1 && rows === 1) return;

  const tiles: HTMLElement[] = [];
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const t = doc.createElement('div');
      t.className = 'jrk-print__tile';
      if (cap) {
        const c2 = cap.cloneNode(true) as HTMLElement;
        c2.style.display = '';
        c2.textContent = `${cap.textContent ?? ''}  ·  sheet ${c + 1}/${cols} across, ${r + 1}/${rows} down`;
        t.appendChild(c2);
      }
      const win = doc.createElement('div');
      win.className = 'jrk-print__window';
      win.style.cssText = `width:${pageW}px;height:${pageH}px;overflow:hidden;position:relative;`;
      const first = r === 0 && c === 0;
      const copy: HTMLElement = first ? box0 : (box0.cloneNode(true) as HTMLElement);
      if (!first) {
        copy.removeAttribute('id');
        copy.querySelectorAll<HTMLElement>('[id]').forEach((n) => n.removeAttribute('id'));
      }
      copy.style.transform = `translate(${-c * pageW}px, ${-r * pageH}px)`;
      win.appendChild(copy);
      t.appendChild(win);
      tiles.push(t);
    }
  }
  if (cap) cap.style.display = 'none';
  tiles.forEach((t, i) => {
    // No break after the last: a trailing forced break is a blank final sheet.
    if (i < tiles.length - 1) t.style.cssText = 'break-after:page;page-break-after:always;';
    sheet.appendChild(t);
  });
}

function hiddenFrame(): HTMLIFrameElement {
  const frame = document.createElement('iframe');
  frame.setAttribute('aria-hidden', 'true');
  frame.tabIndex = -1;
  /* SIZED, not 0x0: a zero-width frame lays every flex row out at its minimum
     and the measured size comes back meaningless. */
  frame.style.cssText = 'position:fixed;left:-10000px;top:0;width:1200px;height:900px;border:0;opacity:0;pointer-events:none;';
  document.body.appendChild(frame);
  return frame;
}

/** What the print document would measure, without printing — so a dialog can
 *  quote scale and sheet count. The screen's size is the wrong answer once the
 *  print CSS reshapes anything. */
export async function measurePrint(el: HTMLElement, opts: PrintOptions): Promise<{ width: number; height: number }> {
  const frame = hiddenFrame();
  try {
    const doc = frame.contentDocument;
    if (!doc) return naturalSize(el);
    writePrintDoc(doc, el, opts);
    return await measureIn(doc);
  } finally {
    frame.remove();
  }
}

/** Lay the element out in a print document and open the print dialog.
 *
 *  A HIDDEN IFRAME, not `window.open`: no popup blocker, no orphaned tab on
 *  cancel, and `@page` is honoured from the frame's own document. Resolves once
 *  the dialog has been ASKED for — whether the reader saves, prints or cancels is
 *  not observable, and a success message for a cancelled print is a lie. */
export async function printElement(el: HTMLElement, opts: PrintOptions): Promise<void> {
  const box = printableBox(opts.page, opts.orientation, opts.marginIn);
  const frame = hiddenFrame();
  const doc = frame.contentDocument;
  const win = frame.contentWindow;
  if (!doc || !win) {
    frame.remove();
    throw new Error('This browser would not open a print document.');
  }
  writePrintDoc(doc, el, opts);
  const natural = await measureIn(doc);
  const scale = scalesFor(opts, natural, { width: box.width, height: box.contentHeight });
  applyScale(doc, natural, scale, box);
  await settled();
  try {
    win.focus();
    win.print();
  } finally {
    // Left a beat: Chrome tears the preview down with the frame, so removing it
    // synchronously after print() returns can cancel the dialog it just opened.
    window.setTimeout(() => frame.remove(), 60_000);
  }
}

/* ------------------------------------------------------------------ saving */

/** Hand a blob to the reader as a file. */
export function download(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Chrome needs the URL alive until the download has started.
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/** Dated and named for what it shows, so two exports are two documents rather
 *  than "(1)". Characters no filesystem accepts are dropped. */
export function exportName(
  parts: string[],
  ext: string,
  { prefix = 'Chart', stamp = new Date() }: { prefix?: string; stamp?: Date } = {},
): string {
  const date = stamp.toISOString().slice(0, 10);
  const body = parts.join(' - ').replace(/[\\/:*?"<>|]/g, '').trim();
  return `${prefix}${body ? ` ${body}` : ''} ${date}.${ext.replace(/^\./, '')}`;
}
