/* Gallery chrome: theme toggle, shared nav, icon hydration. Not part of the library. */

import { OUTLINE, FILLED } from '../dist/icons.js';

const PAGES = [
  ['index.html', 'Overview'],
  ['foundations.html', 'Foundations'],
  ['components.html', 'Components'],
  ['charts.html', 'Charts'],
  ['report.html', 'Report'],
  ['auth.html', 'Sign in'],
  ['dashboard.html', 'Dashboard'],
];

const STORAGE_KEY = 'jrk-preview-theme';

/** Explicit choice beats the OS setting in both directions, which is exactly
 *  what the token CSS is written to support. */
export function applyTheme(mode) {
  if (mode === 'system') {
    delete document.documentElement.dataset.theme;
    localStorage.removeItem(STORAGE_KEY);
  } else {
    document.documentElement.dataset.theme = mode;
    localStorage.setItem(STORAGE_KEY, mode);
  }
  document.querySelectorAll('[data-theme-btn]').forEach((b) => {
    b.setAttribute('aria-pressed', String(b.dataset.themeBtn === (mode ?? 'system')));
  });
}

export function initChrome() {
  const here = location.pathname.split('/').pop() || 'index.html';

  const nav = document.createElement('nav');
  nav.className = 'gal-nav';
  nav.innerHTML = `
    <span class="gal-nav__brand"><span class="gal-nav__mark">J</span> Analytics Design</span>
    <div class="gal-nav__links">
      ${PAGES.map(([href, label]) =>
        `<a href="${href}"${href === here ? ' aria-current="page"' : ''}>${label}</a>`,
      ).join('')}
    </div>
    <span class="jrk-spacer"></span>
    <div class="jrk-tabs jrk-tabs--pills" role="group" aria-label="Theme">
      <button class="jrk-tab" data-theme-btn="light" type="button">Light</button>
      <button class="jrk-tab" data-theme-btn="dark" type="button">Dark</button>
      <button class="jrk-tab" data-theme-btn="system" type="button">System</button>
    </div>`;

  document.body.prepend(nav);

  nav.querySelectorAll('[data-theme-btn]').forEach((b) => {
    // The pill tabs style off aria-selected; keep it in step with aria-pressed.
    b.addEventListener('click', () => {
      applyTheme(b.dataset.themeBtn);
      nav.querySelectorAll('[data-theme-btn]').forEach((o) =>
        o.setAttribute('aria-selected', String(o === b)),
      );
    });
  });

  /* `?theme=dark` beats the stored choice, because every UI change here has to be
     checked in both themes and a headless screenshot can reach neither localStorage
     nor the OS setting.
     applyTheme persists whatever it is given, so the reader's own choice is read
     first and written back afterwards — restored, not removed. Clearing the key
     instead would silently reset a reader who had picked Light or Dark back to
     System the next time they opened the gallery. */
  const param = new URLSearchParams(location.search).get('theme');
  const stored = localStorage.getItem(STORAGE_KEY);
  const active = param ?? stored ?? 'system';
  applyTheme(active);
  if (param) {
    stored === null ? localStorage.removeItem(STORAGE_KEY)
                    : localStorage.setItem(STORAGE_KEY, stored);
  }
  nav.querySelectorAll('[data-theme-btn]').forEach((o) =>
    o.setAttribute('aria-selected', String(o.dataset.themeBtn === active)),
  );
}

/** Contrast, for the swatch cards. Same formula the validator uses. */
export function contrast(a, b) {
  const lum = (h) => {
    const v = h.replace('#', '');
    const n = v.length === 3 ? v.split('').map((c) => c + c).join('') : v;
    const [r, g, bl] = [0, 2, 4]
      .map((i) => parseInt(n.slice(i, i + 2), 16) / 255)
      .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
}

/** Resolve a live token value off the cascade, so swatches follow the theme. */
export function tokenValue(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

/* Fill in every <svg data-icon="name"> from the generated glyph source, so the
   preview pages carry a name instead of a duplicated path. A MutationObserver
   covers the pages that build their markup with JS after load. */
export function hydrateIcons(root = document) {
  for (const el of root.querySelectorAll('svg[data-icon]:empty')) {
    const n = el.dataset.icon;
    const fill = FILLED[n];
    const d = fill ?? OUTLINE[n];
    if (!d) { console.warn(`[preview] unknown icon "${n}"`); continue; }
    if (fill) {
      el.classList.add('jrk-icon--fill');
      el.setAttribute('data-fill', 'true');
    }
    el.innerHTML = `<path d="${d}"${fill ? ' fill-rule="evenodd"' : ''}/>`;
  }
}

new MutationObserver(() => hydrateIcons()).observe(document.documentElement, {
  childList: true,
  subtree: true,
});

initChrome();
hydrateIcons();
