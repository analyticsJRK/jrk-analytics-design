import { useCallback, useEffect, useRef, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { SKIN_LAYERS, SKIN_NAMES, VARIANT_ATTRS, VARIANT_AXES, currentMode } from '../../dist/tokens';
import type { Mode, SkinName, VariantAttr, VariantAxis } from '../../dist/tokens';
import { Icon } from './Icon';
import { Menu, MenuLabel, MenuSeparator } from './Menu';
import { cx } from './utils';

/* Appearance: theme x skin x hue, as three controls, one menu and the helpers that
 * stamp them on <html>.
 *
 * THREE AXES THAT CROSS, NOT ONE LIST. A skin carries its own light and dark
 * halves, so the real state is data-skin CROSSED WITH data-theme, and a merged row
 * of "Light / Dark / Industry / Midgard" would claim that picking a skin discards
 * the reader's dark preference. The hue is a third attribute whose NAME depends on
 * the layer — accent, hazard, inlay, tint — and every value of it, and every label,
 * comes from SKIN_LAYERS in dist/tokens.ts, which the build generates from the
 * token files. Nothing here transcribes a palette.
 *
 * EVERY DEFAULT IS THE ABSENCE OF ITS ATTRIBUTE. System removes data-theme (so the
 * token CSS's prefers-color-scheme branch keeps tracking the OS), Standard removes
 * data-skin, and a layer's default hue removes its hue attribute. Stamping the
 * default would look identical and then survive as a lie on <html>.
 *
 * STORAGE IS OPT-IN PER CALL. The apply* helpers persist only when given a
 * `storagePrefix`; the keys are `<prefix>-theme`, `<prefix>-skin` and
 * `<prefix>-<attr>`, one per ATTRIBUTE rather than per skin, so Industry's `red`
 * and Vitrine's `magenta` never share a slot and switching skins and back returns
 * the reader to the hue they chose on each. `themeScript()` and
 * `readStoredAppearance()` read the same keys.
 */

/* The generated axis data, re-exported so a consumer importing the controls has
   the table they are driven by from the same place. Also at `@jrk/design/tokens`. */
export { SKIN_LAYERS, SKIN_NAMES, VARIANT_ATTRS, VARIANT_AXES } from '../../dist/tokens';
export type { SkinLayer, SkinName, VariantAttr, VariantAxis, VariantRestriction } from '../../dist/tokens';

export type ThemePref = 'light' | 'dark' | 'system';

/** The chosen hue for every attribute, not just the active one: the preference
 *  has to survive a skin whose layer does not use it. */
export type HueState = Record<VariantAttr, string>;

export interface AppearanceState {
  theme: ThemePref;
  skin: SkinName;
  hues: HueState;
}

export interface AppearanceStorage {
  /** Key prefix. Default `jrk`, giving `jrk-theme`, `jrk-skin`, `jrk-hazard`… */
  storagePrefix?: string;
}

/** Each attribute on its layer's default — the state that stamps nothing. */
export const DEFAULT_HUES: HueState = Object.fromEntries(
  Object.values(VARIANT_AXES)
    .filter((a): a is VariantAxis => a !== null)
    .map((a) => [a.attr, a.default]),
) as HueState;

export const DEFAULT_APPEARANCE: AppearanceState = { theme: 'system', skin: 'standard', hues: DEFAULT_HUES };

/** The id of the one injected skin-font <link>. The pre-paint script and
 *  applySkin both find it by this id, so a bfcache restore or a second call moves
 *  the element instead of stacking a second face request. */
export const SKIN_FONT_LINK_ID = 'jrk-skin-font';

const THEMES: { value: ThemePref; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
];

const DEFAULT_PREFIX = 'jrk';
const key = (prefix: string, name: string) => `${prefix}-${name}`;

function store(prefix: string | undefined, name: string, value: string) {
  if (prefix === undefined) return;
  try {
    localStorage.setItem(key(prefix, name), value);
  } catch {
    /* private mode: the stamp still applies for this session */
  }
}

function axisForAttr(attr: VariantAttr): VariantAxis | null {
  for (const a of Object.values(VARIANT_AXES)) if (a && a.attr === attr) return a;
  return null;
}

/** True when `value` is a hue of the axis that stamps `attr`. Validating against
 *  the union instead would let Vitrine's `amber` be restored as a hazard, where it
 *  matches no rule and reads as a broken skin rather than a stale preference. */
export function isHue(attr: VariantAttr, value: string | null | undefined): value is string {
  const a = axisForAttr(attr);
  return !!a && typeof value === 'string' && a.values.some((v) => v.value === value);
}

export function isSkinName(v: unknown): v is SkinName {
  return typeof v === 'string' && (SKIN_NAMES as readonly string[]).includes(v);
}

const root = () => document.documentElement;

/** Stamp the theme. `system` REMOVES data-theme, which is what keeps the page
 *  following the OS live rather than snapshotting it at load. */
export function applyTheme(pref: ThemePref, opts: AppearanceStorage = {}): void {
  if (pref === 'system') delete root().dataset.theme;
  else root().dataset.theme = pref;
  /* `system` is STORED rather than cleared: absence means system only until the
     default changes, and then every reader who chose it would move with it. */
  store(opts.storagePrefix, 'theme', pref);
}

/** Stamp the skin and swap its typeface. The face is requested per ACTIVE skin
 *  from SKIN_LAYERS[skin].font — the URL the skin's own stylesheet imports — so a
 *  reader who never picks a skin never fetches one, and a bundler that drops the
 *  stylesheet's url() import still gets the face. */
export function applySkin(skin: SkinName, opts: AppearanceStorage = {}): void {
  const layer = SKIN_LAYERS[skin] ?? SKIN_LAYERS.standard;
  if (layer.stamp) root().dataset.skin = layer.stamp;
  else delete root().dataset.skin;

  let link = document.getElementById(SKIN_FONT_LINK_ID) as HTMLLinkElement | null;
  if (layer.font) {
    if (!link) {
      link = document.createElement('link');
      link.id = SKIN_FONT_LINK_ID;
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
    if (link.getAttribute('href') !== layer.font) link.setAttribute('href', layer.font);
  } else if (link) {
    link.remove();
  }
  store(opts.storagePrefix, 'skin', layer.skin);
}

/** Stamp the hue the ACTIVE layer uses and take every other hue attribute off.
 *
 *  Clearing is not redundant: this runs on every skin change, and the attribute
 *  the previous layer stamped is still on <html>. Under a skin that includes the
 *  base `data-accent`, which the generated blocks already ignore there
 *  (`:root:not([data-skin])`) — an attribute matching no rule is still the kind of
 *  thing that gets read back as state later. Picking a layer's default stamps
 *  nothing.
 *
 *  With a `storagePrefix`, every hue in `hues` that is valid for its own axis is
 *  persisted. Pass only the one the reader picked: a skin change re-stamps without
 *  the reader choosing anything, and should not write storage. */
export function applyVariant(skin: SkinName, hues: Partial<HueState>, opts: AppearanceStorage = {}): void {
  const r = root();
  for (const attr of VARIANT_ATTRS) r.removeAttribute(`data-${attr}`);
  const axis = VARIANT_AXES[skin] ?? null;
  if (axis) {
    const h = hues[axis.attr];
    if (isHue(axis.attr, h) && h !== axis.default) r.setAttribute(`data-${axis.attr}`, h);
  }
  for (const [attr, value] of Object.entries(hues) as [VariantAttr, string | undefined][]) {
    if (isHue(attr, value)) store(opts.storagePrefix, attr, value);
  }
}

/** All three at once, e.g. after a controlled AppearanceMenu reports a change. */
export function applyAppearance(state: AppearanceState, opts: AppearanceStorage = {}): void {
  applyTheme(state.theme, opts);
  applySkin(state.skin, opts);
  applyVariant(state.skin, state.hues, opts);
}

/** The stored preference, each axis validated on its own and defaulted. Reads
 *  storage only: data-theme is absent under `system` AND absent when the pre-paint
 *  script did not run, and those are different facts. */
export function readStoredAppearance({ storagePrefix = DEFAULT_PREFIX }: AppearanceStorage = {}): AppearanceState {
  const read = (name: string): string | null => {
    try {
      return localStorage.getItem(key(storagePrefix, name));
    } catch {
      return null;
    }
  };
  const t = read('theme');
  const s = read('skin');
  const hues = { ...DEFAULT_HUES };
  for (const attr of VARIANT_ATTRS) {
    const h = read(attr);
    if (isHue(attr, h)) hues[attr] = h;
  }
  return {
    theme: t === 'light' || t === 'dark' || t === 'system' ? t : 'system',
    skin: isSkinName(s) ? s : 'standard',
    hues,
  };
}

/** The pre-paint script, as a string for an inline <script> in <head>, before any
 *  markup. React cannot do this: every hook runs after the first paint, so a
 *  stored preference that disagrees with the OS would flash.
 *
 *  ONE SCRIPT, A SEPARATE try/catch PER AXIS. localStorage throws outright in some
 *  private modes, and a throw in one read must not cost the reader the others. It
 *  is idempotent — it reuses the font <link> by id and removes stale stamps —
 *  because it runs again on a bfcache restore against a document that may already
 *  carry the previous choice. Every table in it is generated from SKIN_LAYERS. */
export function themeScript({ storagePrefix = DEFAULT_PREFIX }: AppearanceStorage = {}): string {
  const K = (n: string) => JSON.stringify(key(storagePrefix, n));
  const skins = Object.fromEntries(
    SKIN_NAMES.filter((n) => SKIN_LAYERS[n].stamp).map((n) => [n, SKIN_LAYERS[n].font ?? '']),
  );
  const axes = Object.fromEntries(
    SKIN_NAMES.map((n) => {
      const a = SKIN_LAYERS[n].axis;
      return [n, a ? [a.attr, a.values.map((v) => v.value).filter((v) => v !== a.default)] : null];
    }),
  );
  return (
    '(function(){var d=document.documentElement,s=null;' +
    `try{var t=localStorage.getItem(${K('theme')});if(t==="light"||t==="dark"){d.setAttribute("data-theme",t)}else{d.removeAttribute("data-theme")}}catch(e){}` +
    `try{var F=${JSON.stringify(skins)};s=localStorage.getItem(${K('skin')});if(!Object.prototype.hasOwnProperty.call(F,s)){s=null}` +
    'if(s){d.setAttribute("data-skin",s)}else{d.removeAttribute("data-skin")}' +
    `var l=document.getElementById(${JSON.stringify(SKIN_FONT_LINK_ID)}),u=s?F[s]:"";` +
    `if(u){if(!l){l=document.createElement("link");l.id=${JSON.stringify(SKIN_FONT_LINK_ID)};l.rel="stylesheet";document.head.appendChild(l)}if(l.getAttribute("href")!==u){l.setAttribute("href",u)}}else if(l){l.parentNode.removeChild(l)}}catch(e){}` +
    `try{var A=${JSON.stringify(axes)},k;for(k in A){if(A[k]){d.removeAttribute("data-"+A[k][0])}}` +
    `var a=A[s||${JSON.stringify('standard')}];if(a){var h=localStorage.getItem(${JSON.stringify(storagePrefix + '-')}+a[0]);if(a[1].indexOf(h)>-1){d.setAttribute("data-"+a[0],h)}}}catch(e){}` +
    '})()'
  );
}

/* ─────────────────────────────── controls ─────────────────────────────── */

export interface ThemeControlProps {
  value: ThemePref;
  onChange: (next: ThemePref) => void;
  /** Names the group for assistive tech. */
  label?: string;
  size?: 'sm' | 'md';
  className?: string;
}

/** Light / Dark / System as the toolbar segmented control. Three named segments
 *  because the setting is three-valued: a sun-or-moon toggle cannot express
 *  System, and the reader who wants to follow their machine has no way back. */
export function ThemeControl({ value, onChange, label = 'Theme', size = 'sm', className }: ThemeControlProps) {
  return (
    <div className={cx('jrk-btn-group', className)} role="group" aria-label={label}>
      {THEMES.map((t) => (
        <button
          key={t.value}
          type="button"
          className={cx('jrk-btn', size === 'sm' && 'jrk-btn--sm')}
          aria-pressed={value === t.value}
          onClick={() => onChange(t.value)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

export interface SkinControlProps {
  value: SkinName;
  onChange: (next: SkinName) => void;
  /** The layers to offer, in order. Defaults to every layer the build knows. */
  skins?: readonly SkinName[];
  label?: string;
  size?: 'sm' | 'md';
  className?: string;
}

/** Standard / Industry / Midgard / Vitrine. A SEPARATE control from the theme,
 *  because the two cross. "Standard" rather than "None": the base look is a
 *  design, and "None" offers an off switch for something nobody turned on. */
export function SkinControl({ value, onChange, skins = SKIN_NAMES, label = 'Skin', size = 'sm', className }: SkinControlProps) {
  return (
    <div className={cx('jrk-btn-group', className)} role="group" aria-label={label}>
      {skins.map((s) => (
        <button
          key={s}
          type="button"
          className={cx('jrk-btn', size === 'sm' && 'jrk-btn--sm')}
          aria-pressed={value === s}
          onClick={() => onChange(s)}
        >
          {SKIN_LAYERS[s]?.label ?? s}
        </button>
      ))}
    </div>
  );
}

/** The resolved mode, kept current: an explicit stamp, or the OS under `system`. */
function useMode(): Mode {
  const [mode, setMode] = useState<Mode>('light');
  useEffect(() => {
    const sync = () => setMode(currentMode());
    sync();
    const mo = new MutationObserver(sync);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)');
    mq?.addEventListener?.('change', sync);
    return () => {
      mo.disconnect();
      mq?.removeEventListener?.('change', sync);
    };
  }, []);
  return mode;
}

export interface HueSwatchesProps {
  /** The ACTIVE layer's axis — VARIANT_AXES[skin]. Another layer's axis samples
   *  wrong, because its blocks do not apply under the current stamp. */
  axis: VariantAxis;
  value: string;
  onChange: (next: string) => void;
  /** Defaults to the axis's own heading. */
  label?: string;
  /** Render the axis's restriction note while a restricted hue is chosen. On by
   *  default: it changes what a screen has to DO, which the swatch cannot show. */
  showRestriction?: boolean;
  className?: string;
}

/** One swatch per hue, as a radiogroup: arrow keys walk it, a roving tabindex
 *  keeps it one Tab stop, focus follows selection.
 *
 *  THE FILLS ARE SAMPLED, NOT STAMPED. Every generated hue block is anchored at
 *  :root, so a button carrying its own data-hazard matches none of them and would
 *  inherit the root's accent — six swatches of the current hue. So each hue is
 *  stamped on the ROOT for one synchronous read of --jrk-accent-solid and the root
 *  is put back; nothing paints between the reads. Re-sampled when the theme or
 *  skin changes, because each hue has a light and a dark value. The CSS fallback
 *  is the current accent, so a swatch is never a hole before this runs. */
export function HueSwatches({ axis, value, onChange, label, showRestriction = true, className }: HueSwatchesProps) {
  const [fills, setFills] = useState<Record<string, string>>({});
  const group = useRef<HTMLDivElement>(null);
  const mode = useMode();

  const sample = useCallback(() => {
    const r = document.documentElement;
    const attr = `data-${axis.attr}`;
    const held = r.getAttribute(attr);
    const out: Record<string, string> = {};
    for (const { value: v } of axis.values) {
      if (v === axis.default) r.removeAttribute(attr);
      else r.setAttribute(attr, v);
      out[v] = getComputedStyle(r).getPropertyValue('--jrk-accent-solid').trim();
    }
    if (held === null) r.removeAttribute(attr);
    else r.setAttribute(attr, held);
    setFills(out);
  }, [axis]);

  useEffect(() => {
    sample();
    /* Theme and skin only: the hue attribute is excluded, or the sampler's own
       writes (and every pick) would re-enter it. */
    const mo = new MutationObserver(sample);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'data-skin'] });
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)');
    mq?.addEventListener?.('change', sample);
    return () => {
      mo.disconnect();
      mq?.removeEventListener?.('change', sample);
    };
  }, [sample]);

  const values = axis.values;
  const step = (delta: number) => {
    const at = (Math.max(0, values.findIndex((v) => v.value === value)) + delta + values.length) % values.length;
    onChange(values[at].value);
    group.current?.querySelectorAll<HTMLButtonElement>('[role="radio"]')[at]?.focus();
  };

  const restriction = showRestriction
    ? axis.restrictions.find((r) => r.value === value && r.modes.includes(mode))
    : undefined;

  return (
    <>
      <div
        ref={group}
        className={cx('jrk-appearance__hues', className)}
        role="radiogroup"
        aria-label={label ?? axis.label}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); step(1); }
          if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); step(-1); }
        }}
      >
        {values.map((v) => (
          <button
            key={v.value}
            type="button"
            role="radio"
            className="jrk-appearance__swatch"
            data-hue={v.value}
            aria-checked={value === v.value}
            tabIndex={value === v.value ? 0 : -1}
            aria-label={v.label}
            title={v.label}
            /* A custom property, not `background`: the fill is painted by ::before
               so that Industry can chamfer it without clipping the outline that
               marks the selection. */
            style={fills[v.value] ? ({ '--jrk-swatch': fills[v.value] } as CSSProperties) : undefined}
            onClick={() => onChange(v.value)}
          />
        ))}
      </div>
      {restriction && <p className="jrk-appearance__note">{restriction.note}</p>}
    </>
  );
}

/* ─────────────────────────────── the menu ─────────────────────────────── */

export type AppearanceChange = 'theme' | 'skin' | 'hue';

export interface AppearanceMenuProps extends AppearanceStorage {
  /** Controlled state. Omit it and the menu owns the state: it reads storage on
   *  mount, stamps <html> and persists under `storagePrefix` on every change. */
  value?: AppearanceState;
  /** Called with the next state. In controlled use, apply it — applyAppearance
   *  does all three — or the menu shows a choice the page does not. */
  onChange?: (next: AppearanceState, changed: AppearanceChange) => void;
  /** The layers the Skin row offers. Default every layer; `['standard']` hides
   *  the row, leaving theme and the base accent. */
  skins?: readonly SkinName[];
  /** The trigger label, which also names the panel. */
  label?: string;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  align?: 'start' | 'end';
  className?: string;
  defaultOpen?: boolean;
}

/** Theme, skin and the active layer's hue in one disclosure. Built on <Menu>, so
 *  Escape, outside-press dismissal, aria-expanded and focus return come with it.
 *
 *  A DISCLOSURE, not a row of controls on the bar: a topbar is a nowrap flex line,
 *  so a third inline well squeezes the account block out. "Appearance" rather than
 *  "Theme" because it holds settings that cross rather than one with a sub-setting.
 *  The hue row is present where the layer declares an axis and ABSENT where it does
 *  not — a disabled row would claim the setting exists everywhere. */
export function AppearanceMenu({
  value,
  onChange,
  storagePrefix = DEFAULT_PREFIX,
  skins = SKIN_NAMES,
  label = 'Appearance',
  leadingIcon = <Icon name="gear" />,
  trailingIcon = <Icon name="chevronDown" />,
  align = 'end',
  className,
  defaultOpen,
}: AppearanceMenuProps) {
  const controlled = value !== undefined;
  const [own, setOwn] = useState<AppearanceState>(DEFAULT_APPEARANCE);
  /* Storage is read after mount, not during render, so the server's HTML and the
     first client render agree. The pre-paint script has already stamped <html>;
     this only brings the controls into line with it. */
  useEffect(() => {
    if (!controlled) setOwn(readStoredAppearance({ storagePrefix }));
  }, [controlled, storagePrefix]);

  const state = controlled ? value : own;

  const commit = (next: AppearanceState, changed: AppearanceChange) => {
    if (!controlled) {
      setOwn(next);
      const opts = { storagePrefix };
      if (changed === 'theme') applyTheme(next.theme, opts);
      if (changed === 'skin') {
        applySkin(next.skin, opts);
        applyVariant(next.skin, next.hues);
      }
      if (changed === 'hue') {
        const axis = VARIANT_AXES[next.skin];
        if (axis) applyVariant(next.skin, { [axis.attr]: next.hues[axis.attr] }, opts);
      }
    }
    onChange?.(next, changed);
  };

  const axis = VARIANT_AXES[state.skin] ?? null;
  const showSkins = skins.length > 1;

  return (
    <Menu
      label={label}
      className={cx('jrk-appearance', className)}
      leadingIcon={leadingIcon}
      trailingIcon={trailingIcon}
      align={align}
      defaultOpen={defaultOpen}
    >
      <MenuLabel>Theme</MenuLabel>
      <div className="jrk-appearance__row">
        <ThemeControl value={state.theme} onChange={(theme) => commit({ ...state, theme }, 'theme')} />
      </div>

      {showSkins && (
        <>
          <MenuSeparator />
          <MenuLabel>Skin</MenuLabel>
          <div className="jrk-appearance__row">
            <SkinControl value={state.skin} skins={skins} onChange={(skin) => commit({ ...state, skin }, 'skin')} />
          </div>
        </>
      )}

      {axis && (
        <>
          <MenuSeparator />
          <MenuLabel>{axis.label}</MenuLabel>
          <div className="jrk-appearance__row">
            <HueSwatches
              axis={axis}
              value={state.hues[axis.attr]}
              onChange={(h) => commit({ ...state, hues: { ...state.hues, [axis.attr]: h } }, 'hue')}
            />
          </div>
        </>
      )}
    </Menu>
  );
}
