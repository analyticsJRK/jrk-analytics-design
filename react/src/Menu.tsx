import { createContext, useCallback, useContext, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Button } from './Button';
import type { ButtonProps } from './Button';
import { cx } from './utils';

/* Lets an item dismiss the panel it is in without the consumer threading a
 * close handler down. Defaults to a no-op so a <MenuItem> rendered outside a
 * <Menu> is inert rather than a crash. */
const MenuClose = createContext<() => void>(() => {});

/* A button that opens a panel beside itself.
 *
 * WHY THIS EXISTS WHEN <NavMenu> ALREADY DOES. NavMenu is the sidebar rail's
 * second level: `position: fixed`, measured against `.jrk-sidebar`, and useless
 * anywhere else. `.jrk-menu` in feedback.css is only a SURFACE — a fill, a
 * border, a shadow and no position at all — so every consumer that wanted a
 * dropdown in a card header was writing the same forty lines: a trigger with
 * aria-expanded, an absolutely-positioned `.jrk-menu`, a pointerdown-outside
 * listener, an Escape handler, and a guess at which edge to anchor to. Written
 * twice, that is two chances to get the dismissal contract subtly different;
 * written on eight screens it is not a component library.
 *
 * IT IS A DISCLOSURE, NOT role="menu" — the same call NavMenu documents at
 * length. `role="menu"` promises a roving tabindex, type-ahead and a full
 * arrow-key contract, and a claimed menu that ignores arrow keys is worse for a
 * screen-reader user than the labelled group of buttons they already know how
 * to Tab through. So: `aria-haspopup` + `aria-expanded` on the trigger, a
 * labelled group for the panel, Tab to walk it, Escape to dismiss.
 *
 * `pointerdown` rather than `click` for the outside dismissal, deliberately: a
 * press that starts outside should dismiss on the press, not wait for the
 * release. A menu that closes only after a full click feels stuck to the cursor.
 *
 * The panel is free-form. <MenuItem> is for an actionable row, but a filter menu
 * of checkboxes or a block of prose is equally valid inside it — the contract is
 * the surface and the dismissal, not the contents.
 *
 * THE PANEL FLOATS IN THE TOP LAYER (2026-11-11), because `.jrk-card` clips.
 * The card took `overflow: clip` with its rounded corners, so an absolutely-
 * positioned panel inside one was cut off at the card's bottom edge. A roster
 * filtered to four rows opened a filter list with its lower half missing. The
 * panel is `popover="manual"` and shown with `showPopover()`, so it paints
 * above every ancestor's clip, and `place()` writes its viewport coordinates.
 *
 * Why not plain `position: fixed`: a fixed element is still clipped when an
 * ancestor has `transform`, `filter` or `backdrop-filter`, and the frosted card
 * has the last. Why not a portal: it would move the panel to the end of
 * <body>, so Tab from the trigger would skip it, and the outside-press check
 * would need a second ref. A popover keeps its place in the DOM, so Tab order,
 * `contains()` and inherited styles behave as before.
 *
 * `manual`, not `auto`: an `auto` popover closes itself on Escape and on an
 * outside press, without React knowing. `open` would stay true with nothing on
 * screen. The dismissal stays here, where it always was.
 */

/* Viewport geometry for the floating panel. GAP is --jrk-space-1, the distance
   the anchored rule hangs the panel from its trigger. EDGE keeps the panel off
   the viewport's own edge, where its shadow would be cut. */
const GAP = 4;
const EDGE = 8;

/* Places `panel` against `trigger` in viewport coordinates, through the custom
   properties `.jrk-menu--floating` reads. Below the trigger unless the panel
   does not fit there and there is more room above, and never taller than the
   room on the side it opens to: a fixed panel has no page scroll to reveal its
   bottom.

   Returns false when the trigger has scrolled out of view, so the caller can
   close the panel. A panel left behind by its trigger looks like it belongs to
   whatever is under it now. */
function place(trigger: HTMLElement, panel: HTMLElement, align: 'start' | 'end'): boolean {
  const r = trigger.getBoundingClientRect();
  const vw = document.documentElement.clientWidth;
  const vh = document.documentElement.clientHeight;
  if (!shown(trigger, r, vw, vh)) return false;

  const below = vh - r.bottom - GAP - EDGE;
  const above = r.top - GAP - EDGE;
  // scrollHeight is the content's full height even while max-height caps the
  // box; the difference of the other two adds the borders back.
  const natural = panel.scrollHeight + panel.offsetHeight - panel.clientHeight;
  const up = natural > below && above > below;
  panel.dataset.side = up ? 'top' : 'bottom';
  panel.style.setProperty('--jrk-menu-y', `${up ? vh - r.top + GAP : r.bottom + GAP}px`);
  panel.style.setProperty('--jrk-menu-room', `${Math.max(0, up ? above : below)}px`);

  // Measure the width at x = 0. A shrink-to-fit panel measured where it last
  // sat near the right edge comes back narrower than it is.
  panel.style.setProperty('--jrk-menu-x', '0px');
  const w = panel.offsetWidth;
  // `start` is the left edge in LTR and the right edge in RTL.
  const leftEdge = (align === 'start') !== (getComputedStyle(trigger).direction === 'rtl');
  const x = leftEdge ? r.left : r.right - w;
  panel.style.setProperty('--jrk-menu-x', `${Math.max(EDGE, Math.min(x, vw - w - EDGE))}px`);
  return true;
}

/* Whether any of the trigger is still visible: inside the viewport AND inside
   every ancestor that clips or scrolls. The viewport alone is not enough. A
   menu in a table cell scrolls out of `.jrk-table-wrap` long before it leaves
   the screen, and the panel would then float over the sticky header. The
   absolute panel never had this problem, because the wrap clipped it too. */
function shown(trigger: HTMLElement, r: DOMRect, vw: number, vh: number): boolean {
  let top = 0;
  let left = 0;
  let bottom = vh;
  let right = vw;
  for (let a = trigger.parentElement; a && a !== document.body; a = a.parentElement) {
    const s = getComputedStyle(a);
    if (s.overflowX === 'visible' && s.overflowY === 'visible') continue;
    const b = a.getBoundingClientRect();
    top = Math.max(top, b.top);
    left = Math.max(left, b.left);
    bottom = Math.min(bottom, b.bottom);
    right = Math.min(right, b.right);
  }
  return r.bottom > top && r.top < bottom && r.right > left && r.left < right;
}

/* The same SSR swap Shell.tsx and Chart.tsx use: a client component is still
   server-rendered for the first HTML, and useLayoutEffect warns there. */
const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

export interface MenuProps {
  /** The trigger's label. Also names the panel, so the two cannot drift. */
  label: ReactNode;
  children: ReactNode;
  /** Which edge the panel lines up with. `end` (the default) is right for a
   *  control in a header's action row, where a start-anchored panel opens off
   *  the viewport. */
  align?: 'start' | 'end';
  /** Panel width. Defaults to the surface's own `min-width`. */
  width?: string;
  variant?: ButtonProps['variant'];
  size?: ButtonProps['size'];
  leadingIcon?: ReactNode;
  /** Shown after the label — a count, a state. Part of the trigger, so "what is
   *  this set to" does not require opening the thing that answers it. */
  trailingIcon?: ReactNode;
  disabled?: boolean;
  className?: string;
  /** Panel class, for a consumer that needs to size or scroll it. */
  menuClassName?: string;
  /** Start open. Uncontrolled — the component still owns the state after the
   *  first render, so this is an initial value and not a way to drive it.
   *
   *  It exists for the same reason `NavMenu.defaultOpen` does: a menu is a
   *  disclosure, so every static capture of one is a picture of a closed
   *  button, and the panel is the whole component. The design-system cards and
   *  the docs previews need it to show anything at all. In an app it is
   *  usually the wrong prop — a panel that is open before the reader asked
   *  covers content nobody chose to have covered. */
  defaultOpen?: boolean;
}

export function Menu({
  label,
  children,
  align = 'end',
  width,
  variant = 'secondary',
  size = 'sm',
  leadingIcon,
  trailingIcon,
  disabled,
  className,
  menuClassName,
  defaultOpen = false,
}: MenuProps) {
  const uid = useId();
  const panelId = `${uid}-panel`;
  const [open, setOpen] = useState(defaultOpen);
  const box = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);

  /* Into the top layer, then placed, before the first paint, so the panel never
     shows a frame at the CSS fallback position. Without the Popover API the
     panel is an ordinary fixed element and the same placement still applies. */
  useIsoLayoutEffect(() => {
    if (!open) return;
    const t = trigger.current;
    const p = panel.current;
    if (!t || !p) return;
    if (typeof p.showPopover === 'function' && !p.matches(':popover-open')) p.showPopover();
    if (!place(t, p, align)) {
      setOpen(false);
      return;
    }

    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (!place(t, p, align)) setOpen(false);
      });
    };
    // Capture, because a scroll inside the table wrap or the rail does not
    // bubble to window, and those are the scrolls that move the trigger. The
    // panel's own list scrolling moves nothing, so it is skipped.
    const onScroll = (e: Event) => {
      if (e.target instanceof Node && p.contains(e.target)) return;
      update();
    };
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', update);
    // The trigger can move without a scroll (a toolbar re-wrapping), and the
    // panel changes height as a filter box narrows its list, which can change
    // the side it fits on.
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(update) : undefined;
    observer?.observe(t);
    observer?.observe(p);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', update);
      observer?.disconnect();
    };
  }, [open, align]);

  const dismiss = useCallback(() => {
    setOpen(false);
    trigger.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => {
      // Escape refocuses the trigger; an outside pointer press does not, because
      // the reader has already chosen where to put their attention.
      if (e.key === 'Escape') dismiss();
    };
    document.addEventListener('pointerdown', away);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('pointerdown', away);
      document.removeEventListener('keydown', esc);
    };
  }, [open, dismiss]);

  return (
    <div className={cx('jrk-menu-anchor', className)} ref={box}>
      <Button
        ref={trigger}
        variant={variant}
        size={size}
        disabled={disabled}
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        leadingIcon={leadingIcon}
        trailingIcon={trailingIcon}
        onClick={() => setOpen((v) => !v)}
      >
        {label}
      </Button>

      {open && (
        <div
          ref={panel}
          id={panelId}
          role="group"
          popover="manual"
          aria-label={typeof label === 'string' ? label : undefined}
          className={cx(
            'jrk-menu',
            'jrk-menu--anchored',
            'jrk-menu--floating',
            align === 'start' && 'jrk-menu--start',
            menuClassName,
          )}
          style={width ? { width } : undefined}
        >
          <MenuClose.Provider value={dismiss}>{children}</MenuClose.Provider>
        </div>
      )}
    </div>
  );
}

export interface MenuItemProps {
  children: ReactNode;
  onSelect?: () => void;
  icon?: ReactNode;
  disabled?: boolean;
  danger?: boolean;
  /** Keep the panel open after selecting. Off by default — an item is a command
   *  and a menu that stays open after one has run reads as not having listened.
   *  Turn it on for a row that toggles part of a set the reader is still
   *  adjusting, where dismissing after each change makes the control unusable. */
  keepOpen?: boolean;
  className?: string;
}

/** One actionable row. Dismisses the menu after `onSelect` unless `keepOpen`. */
export function MenuItem({
  children, onSelect, icon, disabled, danger, keepOpen, className,
}: MenuItemProps) {
  const close = useContext(MenuClose);
  return (
    <button
      type="button"
      className={cx('jrk-menu__item', danger && 'jrk-menu__item--danger', className)}
      disabled={disabled}
      onClick={() => {
        onSelect?.();
        // Focus returns to the trigger, or the reader is left at the top of the
        // document with nothing saying what they just dismissed.
        if (!keepOpen) close();
      }}
    >
      {icon}
      <span>{children}</span>
    </button>
  );
}

/** A section caption inside the panel. Not a heading — it labels a group of
 *  controls rather than starting a document section. */
export function MenuLabel({ children }: { children: ReactNode }) {
  return <p className="jrk-menu__label">{children}</p>;
}

export function MenuSeparator() {
  return <hr className="jrk-menu__separator" />;
}
