import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import type {
  ElementType,
  FocusEvent as ReactFocusEvent,
  MouseEventHandler,
  PointerEvent as ReactPointerEvent,
  ReactNode,
} from 'react';
import { cx } from './utils';
import { Icon } from './Icon';

/* App shell. Layout only — routing and active-state logic stay in the app. */

/** The props a nav link is rendered with. Narrow on purpose: anything accepting these — a
 *  plain `a`, Next's `Link`, a `Link` that carries a pending marker — can be `linkAs`. */
export interface NavLinkProps {
  href: string;
  className?: string;
  title?: string;
  'aria-current'?: 'page' | 'location';
  'aria-busy'?: boolean;
  'aria-label'?: string;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
  children?: ReactNode;
}

/** Routing goes through this rather than through an import: the library ships no router. */
export type NavLinkAs = ElementType<NavLinkProps>;

export interface AppShellProps {
  children: ReactNode;
  /** A full-width bar ABOVE the rail and the content, instead of a topbar inside the content
   *  column. Pass a `<Topbar masthead>`: the rail and the page height are offset by its
   *  sibling, so anything else here would not be measured for. */
  masthead?: ReactNode;
  className?: string;
}

export function AppShell({ children, masthead, className }: AppShellProps) {
  const app = <div className={cx('jrk-app', className)}>{children}</div>;
  if (!masthead) return app;
  return (
    <>
      {masthead}
      {app}
    </>
  );
}

export interface SidebarProps {
  /** Wordmark row at the top of the rail. Omit it when a `<Topbar masthead>` carries the
   *  brand — printing the product name on both axes says it twice. */
  brand?: ReactNode;
  children: ReactNode;
  /** Icon-only verbs above the nav hairline — Home, Create, Search. Destinations
   *  belong in `children`; this row is for things you DO. */
  actions?: ReactNode;
  /** A search field at the top of the rows. It scrolls with them and keeps its height in
   *  the collapsed rail, so nothing below it moves when the rail opens. */
  search?: ReactNode;
  footer?: ReactNode;
  collapsed?: boolean;
  /** A COLLAPSED rail opens while the mouse is over it, or while keyboard focus is inside
   *  it, and closes on leave. It overlays the page rather than reflowing it, and it is a
   *  peek, not a choice — `collapsed` is untouched. */
  peek?: boolean;
  /** The narrow-viewport drawer is showing. Always the whole rail: a drawer with its labels
   *  stripped is the only nav a reader at that width has. */
  open?: boolean;
  /** `nav` (default) makes the rail itself the landmark. `aside` puts the landmark on the
   *  row list, for a rail that also holds things that are not navigation. */
  as?: 'nav' | 'aside';
  /** Landmark name. Default "Main". */
  label?: string;
  className?: string;
}

/* Long enough that a pointer crossing the rail on its way to the page does not flash it
   open; the same 120ms as --jrk-duration-fast. */
const PEEK_DELAY_MS = 120;

function focusVisible(el: EventTarget): boolean {
  try {
    return el instanceof Element && el.matches(':focus-visible');
  } catch {
    return true;
  }
}

export function Sidebar({
  brand,
  children,
  actions,
  search,
  footer,
  collapsed,
  peek,
  open,
  as = 'nav',
  label = 'Main',
  className,
}: SidebarProps) {
  const [hover, setHover] = useState(false);
  const [focus, setFocus] = useState(false);
  const timer = useRef<number | null>(null);
  const clear = () => {
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = null;
  };

  /* A change of `collapsed` ends any peek. Pressing "Collapse" under the pointer would
     otherwise leave the rail held open by a hover that never sees a fresh enter. */
  useEffect(() => {
    clear();
    setHover(false);
    setFocus(false);
  }, [collapsed]);
  useEffect(() => clear, []);

  const peeking = !!peek && !!collapsed && !open && (hover || focus);
  const shut = !!collapsed && !open && !peeking;

  /* MOUSE ONLY for hover: a tap fires pointerenter too, and a touch reader would get a rail
     that opens under their finger and never receives a leave. FOCUS-VISIBLE only for focus:
     a mouse click on a row also focuses it, and must not hold the rail open after the
     pointer has gone — a keyboard reader tabbing in gets the labels the ring lands on. */
  const peekHandlers = peek
    ? {
        onPointerEnter: (e: ReactPointerEvent<HTMLElement>) => {
          if (e.pointerType !== 'mouse' || !collapsed || open) return;
          clear();
          timer.current = window.setTimeout(() => setHover(true), PEEK_DELAY_MS);
        },
        onPointerLeave: () => {
          clear();
          setHover(false);
        },
        onFocus: (e: ReactFocusEvent<HTMLElement>) => {
          if (focusVisible(e.target)) setFocus(true);
        },
        onBlur: (e: ReactFocusEvent<HTMLElement>) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocus(false);
        },
      }
    : {};

  const rows = (
    <>
      {search && <div className="jrk-sidebar__search">{search}</div>}
      {children}
    </>
  );

  const Root = as;
  return (
    <Root
      className={cx('jrk-sidebar', className)}
      /* 'false' only where it means something — a peek or a drawer must stay open under the
         1024px auto-collapse. Absent otherwise, so that auto-collapse still applies. */
      data-collapsed={shut ? 'true' : peeking || open ? 'false' : undefined}
      data-peek={peeking ? 'true' : undefined}
      data-open={open ? 'true' : undefined}
      aria-label={as === 'nav' ? label : undefined}
      {...peekHandlers}
    >
      {brand && <div className="jrk-sidebar__brand">{brand}</div>}
      {actions && <div className="jrk-sidebar__actions">{actions}</div>}
      {as === 'nav' ? (
        <div className="jrk-sidebar__nav">{rows}</div>
      ) : (
        <nav className="jrk-sidebar__nav" aria-label={label}>
          {rows}
        </nav>
      )}
      {footer && <div className="jrk-sidebar__footer">{footer}</div>}
    </Root>
  );
}

export interface SidebarToggleProps {
  collapsed: boolean;
  onToggle: () => void;
  /** Default "Expand" / "Collapse". */
  expandLabel?: string;
  collapseLabel?: string;
  className?: string;
}

/** The rail's collapse control, for its footer. The label is CLIPPED in the collapsed rail,
 *  not removed — `display: none` there would leave an unnamed button. */
export function SidebarToggle({
  collapsed,
  onToggle,
  expandLabel = 'Expand',
  collapseLabel = 'Collapse',
  className,
}: SidebarToggleProps) {
  return (
    <button
      type="button"
      className={cx(
        'jrk-btn jrk-btn--ghost jrk-btn--sm jrk-btn--block jrk-sidebar__toggle',
        collapsed && 'jrk-sidebar__toggle--collapsed',
        className,
      )}
      onClick={onToggle}
    >
      <Icon name="chevronRight" />
      <span className="jrk-sidebar__toggle-label">{collapsed ? expandLabel : collapseLabel}</span>
    </button>
  );
}

export interface SidebarActionProps {
  icon: ReactNode;
  /** Required, and it is the whole point of this component existing: an
   *  icon-only control has to carry an accessible name and a tooltip, so `label`
   *  feeds both aria-label and title. There is no way to render a nameless one. */
  label: string;
  href?: string;
  onClick?: () => void;
  /** Marks this as the current page — same accent pill the nav rows use. */
  active?: boolean;
  className?: string;
}

export function SidebarAction({ icon, label, href, onClick, active, className }: SidebarActionProps) {
  const shared = {
    className: cx('jrk-sidebar__action', className),
    'aria-label': label,
    title: label,
    'aria-current': active ? ('page' as const) : undefined,
  };
  return href ? (
    <a href={href} {...shared} onClick={onClick}>
      {icon}
    </a>
  ) : (
    <button type="button" {...shared} onClick={onClick}>
      {icon}
    </button>
  );
}

export interface NavItemProps {
  href: string;
  icon?: ReactNode;
  /** An emoji or single character in the icon slot, boxed to the icon's size so a glyph row
   *  and an icon row start their labels on the same pixel. Wins over `icon`. */
  glyph?: ReactNode;
  children: ReactNode;
  /** Drives both the styling and aria-current, so the visual and the
   *  accessible state can never disagree. */
  active?: boolean;
  badge?: ReactNode;
  /** A quiet trailing number — muted, tabular. `badge` is for a count with a tone. */
  count?: ReactNode;
  /** Trailing controls beside the row — a pin, a caret. SIBLINGS of the link, never inside
   *  it: a button inside an anchor is two controls claiming one click. */
  actions?: ReactNode;
  /** Navigation to this row is in flight. The icon slot becomes a ring and the row takes a
   *  wash, after a short delay, so a prefetched route that commits in a frame shows nothing. */
  pending?: boolean;
  /** Drawn, dimmed, and not a link — a destination that exists and cannot be opened yet.
   *  Put the reason in `title`. Hide the row instead when the reader may not see it at all. */
  disabled?: boolean;
  /** A second-level row: indented under the row that owns it, one step quieter. */
  sub?: boolean;
  title?: string;
  linkAs?: NavLinkAs;
  className?: string;
}

export function NavItem({
  href,
  icon,
  glyph,
  children,
  active,
  badge,
  count,
  actions,
  pending,
  disabled,
  sub,
  title,
  linkAs,
  className,
}: NavItemProps) {
  const mark = pending ? (
    <span className="jrk-nav-item__pending" aria-hidden="true" />
  ) : glyph != null ? (
    <span className="jrk-nav-item__glyph" aria-hidden="true">
      {glyph}
    </span>
  ) : (
    icon
  );
  const inner = (
    <>
      {mark}
      <span className="jrk-nav-item__label">{children}</span>
      {count != null && <span className="jrk-nav-item__count">{count}</span>}
      {badge && <span className="jrk-nav-item__badge">{badge}</span>}
      {pending && <span className="jrk-sr-only">Loading</span>}
    </>
  );
  const cls = cx('jrk-nav-item', sub && 'jrk-nav-item--sub', className);
  const Link = linkAs ?? 'a';
  const row = disabled ? (
    <span className={cls} aria-disabled="true" title={title}>
      {inner}
    </span>
  ) : (
    <Link
      href={href}
      className={cls}
      title={title}
      aria-current={active ? 'page' : undefined}
      aria-busy={pending || undefined}
    >
      {inner}
    </Link>
  );
  if (!actions) return row;
  return (
    <div className="jrk-nav-row">
      {row}
      <span className="jrk-nav-row__actions">{actions}</span>
    </div>
  );
}

export interface NavDisclosureProps {
  href: string;
  label: ReactNode;
  /** Names the caret — "Show sections in {name}". Defaults to `label` when that is a string;
   *  a rail of eight carets otherwise announces eight identical buttons. */
  name?: string;
  icon?: ReactNode;
  glyph?: ReactNode;
  active?: boolean;
  /** Controlled. Leave it unset and the row opens on its own while `active`, until the
   *  reader touches the caret — after which their choice wins and keeps winning. */
  open?: boolean;
  defaultOpen?: boolean;
  onToggle?: (open: boolean) => void;
  /** Controls before the caret — a `<NavPinButton>`. */
  actions?: ReactNode;
  pending?: boolean;
  title?: string;
  linkAs?: NavLinkAs;
  /** The second level: `<NavItem sub>` rows. Unmounted while closed, so a closed row's
   *  sections are never in the tab order behind a caret that says they are not there. */
  children: ReactNode;
  className?: string;
}

/* A rail row that NAVIGATES, with a separate caret that DISCLOSES its sections inline.
 *
 * Two controls on purpose. <NavMenu> bakes label, icon and caret into one <button>, so a
 * module with sections cannot be clicked to reach its own landing page, middle-clicked or
 * bookmarked. Splitting that trigger would mean re-deriving the flyout's controller — the
 * fixed position measured into custom properties, re-placed on capture-phase scroll and
 * through a ResizeObserver on the rail. An inline list needs none of it: it is in flow, so
 * there is nothing to place and nothing to clip, and nothing covered means nothing to
 * dismiss.
 *
 * The caret ROTATES on open, where <NavMenu>'s does not: that panel appears beside the row,
 * this one below it, so here the accordion gesture is the honest one. */
export function NavDisclosure({
  href,
  label,
  name,
  icon,
  glyph,
  active,
  open,
  defaultOpen,
  onToggle,
  actions,
  pending,
  title,
  linkAs,
  children,
  className,
}: NavDisclosureProps) {
  const listId = `${useId()}-sections`;
  const [choice, setChoice] = useState<boolean | null>(null);
  const isOpen = open ?? choice ?? defaultOpen ?? !!active;
  const who = name ?? (typeof label === 'string' ? label : 'this item');

  const toggle = () => {
    const next = !isOpen;
    if (open === undefined) setChoice(next);
    onToggle?.(next);
  };

  return (
    <>
      <NavItem
        href={href}
        icon={icon}
        glyph={glyph}
        active={active}
        pending={pending}
        title={title}
        linkAs={linkAs}
        className={className}
        actions={
          <>
            {actions}
            <button
              type="button"
              className="jrk-nav-row__control jrk-nav-disclosure__caret"
              aria-expanded={isOpen}
              aria-controls={isOpen ? listId : undefined}
              aria-label={`${isOpen ? 'Hide' : 'Show'} sections in ${who}`}
              title={`${isOpen ? 'Hide' : 'Show'} sections`}
              onClick={toggle}
            >
              <Icon name="chevronRight" />
            </button>
          </>
        }
      >
        {label}
      </NavItem>
      {isOpen && (
        <div className="jrk-nav-disclosure__sections" id={listId}>
          {children}
        </div>
      )}
    </>
  );
}

export interface NavPinButtonProps {
  pinned?: boolean;
  onToggle: () => void;
  /** What is being pinned — the button's name is "Pin {label}". */
  label: string;
  /** The control on a row that is already IN the pinned list: a cross that removes it. */
  remove?: boolean;
  className?: string;
}

/* Hidden until its row is hovered or the button is focused — by opacity and width, never
 * display:none, so it stays in the tab order. A pinned row keeps it lit: "is this already up
 * top" is worth reading without hunting for it.
 *
 * The name stays "Pin X" in both states and aria-pressed carries the state. Swapping the name
 * to "Unpin X" as well announces the state twice, and pressed it reads as an instruction to do
 * the opposite of what the button shows. */
export function NavPinButton({ pinned = false, onToggle, label, remove, className }: NavPinButtonProps) {
  if (remove) {
    return (
      <button
        type="button"
        className={cx('jrk-nav-row__control jrk-nav-pin jrk-nav-pin--remove', className)}
        aria-label={`Unpin ${label}`}
        title={`Unpin ${label}`}
        onClick={onToggle}
      >
        <Icon name="close" />
      </button>
    );
  }
  return (
    <button
      type="button"
      className={cx('jrk-nav-row__control jrk-nav-pin', className)}
      aria-pressed={pinned}
      aria-label={`Pin ${label}`}
      title={pinned ? 'Pinned — click to unpin' : 'Pin to the top of the sidebar'}
      onClick={onToggle}
    >
      <Icon name={pinned ? 'pinFill' : 'pin'} />
    </button>
  );
}

export function NavGroup({ children }: { children: ReactNode }) {
  return <div className="jrk-sidebar__group">{children}</div>;
}

/* ============================ second nav level ============================ */

/* Every open flyout parks its own closer here so opening one closes the others.
   A module-level Set rather than a context: there is exactly one rail on screen,
   and the invariant (never two overlapping panels) has to hold even if a consumer
   renders two <Sidebar> trees. */
const openFlyouts = new Set<() => void>();

export interface NavMenuProps {
  /** Names the row AND the panel, so the two cannot drift. Required — in the
   *  collapsed rail this label is the only thing identifying the panel. */
  label: string;
  /** The panel body: <NavMenuItem>s and <NavMenuSeparator>s. */
  children: ReactNode;
  icon?: ReactNode;
  badge?: ReactNode;
  /** Marks the section as the one you are in — keeps the accent pill while the
   *  panel is open, which is why the CSS orders aria-expanded above aria-current. */
  active?: boolean;
  /** Open on mount. For an app that lands inside a section and should show that
   *  section's panel without a click. Uncontrolled after that — the first
   *  dismissal is the reader's and the component does not reopen itself. */
  defaultOpen?: boolean;
  className?: string;
}

/* A nav row that opens a second level beside the rail.
 *
 * This is a DISCLOSURE, not a `role="menu"`. The distinction is not pedantry:
 * role="menu" declares application-mode semantics and obliges a roving tabindex,
 * type-ahead, and a full arrow-key contract, and it makes a screen reader
 * announce a set of destinations as if they were commands. These are links to
 * places, so the panel is a labelled group of links, Tab walks them, and Escape
 * dismisses. That is both less code and more correct.
 *
 * Hover does NOT open. Snowsight's rail opens on hover, and it is the one part
 * worth leaving behind — a panel that appears because the pointer crossed a row
 * on its way somewhere else covers content nobody asked to have covered. Click,
 * Enter, Space, ArrowRight and ArrowDown all open it; nothing opens by accident. */
export function NavMenu({ label, children, icon, badge, active, defaultOpen, className }: NavMenuProps) {
  const uid = useId();
  const panelId = `${uid}-panel`;
  const titleId = `${uid}-title`;
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(defaultOpen ?? false);

  const dismiss = useCallback((refocus?: boolean) => {
    setOpen(false);
    if (refocus) btnRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;
    // Close the others first. Deleting from the Set during iteration is safe,
    // and each closer's own cleanup does the removal on its next render.
    for (const other of openFlyouts) other();
    const self = () => setOpen(false);
    openFlyouts.add(self);
    return () => {
      openFlyouts.delete(self);
    };
  }, [open]);

  /* The panel is position: fixed (see .jrk-nav-flyout for why it has to be), so
     both offsets are viewport coordinates and neither can come from CSS. Measure
     the row for the top and the RAIL for the inline offset — the row is inset by
     the nav's padding, and the panel abuts the rail's edge, not the row's.
   *
   * A layout effect, so the panel's first paint is already placed rather than
   * flashing at the CSS fallback position — and the same SSR swap Chart.tsx uses,
   * because a client component still gets server-rendered for the initial HTML
   * and useLayoutEffect warns there. */
  const useIso = typeof window === 'undefined' ? useEffect : useLayoutEffect;
  useIso(() => {
    if (!open) return;
    const place = () => {
      const btn = btnRef.current;
      const panel = panelRef.current;
      if (!btn || !panel) return;

      const margin = 8;
      const wanted = btn.getBoundingClientRect().top;
      const lowest = window.innerHeight - panel.offsetHeight - margin;
      panel.style.setProperty('--jrk-nav-flyout-top', `${Math.max(margin, Math.min(wanted, lowest))}px`);

      const rail = (btn.closest('.jrk-sidebar') ?? btn).getBoundingClientRect();
      // inset-inline-start is logical, so under RTL it is measured from the right
      // edge of the viewport and the rail's near edge is its LEFT one.
      const rtl = getComputedStyle(btn).direction === 'rtl';
      const inset = rtl ? document.documentElement.clientWidth - rail.left : rail.right;
      panel.style.setProperty('--jrk-nav-flyout-inset', `${inset}px`);
    };
    place();
    window.addEventListener('resize', place);
    // capture: true — a scroll inside .jrk-sidebar__nav does not bubble to
    // window, and that is exactly the scroll that moves the anchor row.
    window.addEventListener('scroll', place, true);

    /* Collapsing the rail with a panel open is the case a resize listener misses
       entirely: the rail animates its width over 200ms and the window never
       resizes, so a one-shot measurement taken at click time lands the panel
       wherever the rail happened to be that frame and leaves it there. Observing
       the rail re-places it on every frame of the transition instead. */
    const rail = btnRef.current?.closest('.jrk-sidebar');
    const observer = rail && typeof ResizeObserver !== 'undefined' ? new ResizeObserver(place) : undefined;
    if (rail && observer) observer.observe(rail);

    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
      observer?.disconnect();
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const outside = (t: EventTarget | null) =>
      !btnRef.current?.contains(t as Node) && !panelRef.current?.contains(t as Node);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismiss(true);
    };
    const onPointerDown = (e: PointerEvent) => {
      if (outside(e.target)) setOpen(false);
    };
    // Covers tabbing out of the last link, which no pointer listener sees.
    const onFocusIn = (e: FocusEvent) => {
      if (outside(e.target)) setOpen(false);
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('focusin', onFocusIn);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('focusin', onFocusIn);
    };
  }, [open, dismiss]);

  function onButtonKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      // The panel is hidden until this render commits, so the focus target does
      // not exist yet — hand it to the frame after paint.
      requestAnimationFrame(() => panelRef.current?.querySelector<HTMLElement>('a, button')?.focus());
    } else if (e.key === 'ArrowLeft') {
      setOpen(false);
    }
  }

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        className={cx('jrk-nav-item', className)}
        aria-expanded={open}
        aria-controls={panelId}
        aria-current={active ? 'page' : undefined}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={onButtonKeyDown}
      >
        {icon}
        <span className="jrk-nav-item__label">{label}</span>
        {badge && <span className="jrk-nav-item__badge">{badge}</span>}
        <Icon name="chevronRight" className="jrk-nav-item__caret" />
      </button>
      <div
        ref={panelRef}
        id={panelId}
        className="jrk-menu jrk-nav-flyout"
        role="group"
        aria-labelledby={titleId}
        hidden={!open}
      >
        <div className="jrk-nav-flyout__title" id={titleId}>
          {label}
        </div>
        {children}
      </div>
    </>
  );
}

/** One destination inside a NavMenu panel. Reuses `.jrk-menu__item`, so the
 *  second nav level and the app's other menus are the same surface. */
export function NavMenuItem({
  href,
  children,
  active,
  className,
}: {
  href: string;
  children: ReactNode;
  active?: boolean;
  className?: string;
}) {
  return (
    <a
      href={href}
      className={cx('jrk-menu__item', className)}
      aria-current={active ? 'page' : undefined}
    >
      {children}
    </a>
  );
}

/** Groups items inside a panel — Snowsight's rule between "Templates" and
 *  "Legacy Notebooks". Presentational, so it is never announced. */
export function NavMenuSeparator() {
  return <hr className="jrk-menu__separator" />;
}

export function Main({ children }: { children: ReactNode }) {
  return <div className="jrk-main">{children}</div>;
}

export interface TopbarProps {
  children: ReactNode;
  /** Gradient masthead bar — a teal/blue/violet sweep built from the same
   *  white-safe stops as `<VividStat>`. Everything inked for white chrome flips
   *  to white; the search field and a `--secondary` button are left alone,
   *  because each is measured against its own fill. */
  vivid?: boolean;
  /** Ramp for a `vivid` bar. Omitted is the three-hue ribbon; `'blue'` is the
   *  brand anchor deepening across the bar and nothing else, which is what to
   *  use when the bar sits above a row of blue `<VividStat>`s — it is literally
   *  the same ramp, so the two read as one masthead. `'brand'` is the product
   *  masthead — a pale ramp under dark ink in light, a saturated one under white
   *  in dark. Ignored unless `vivid`. */
  tone?: 'blue' | 'brand';
  /** A full-width bar above the rail — pass it as `<AppShell masthead>`. */
  masthead?: boolean;
  className?: string;
}

export function Topbar({ children, vivid, tone, masthead, className }: TopbarProps) {
  return (
    <header
      className={cx(
        'jrk-topbar',
        vivid && 'jrk-topbar--vivid',
        vivid && tone && `jrk-topbar--${tone}`,
        masthead && 'jrk-topbar--masthead',
        className,
      )}
    >
      {children}
    </header>
  );
}

export interface BrandMarkProps {
  /** The wordmark. Clipped, never removed, at phone width — it is the link's name. */
  name: ReactNode;
  /** The square: a letter or an SVG. */
  mark: ReactNode;
  /** A wordmark that does not go home breaks a convention for nothing. */
  href?: string;
  linkAs?: NavLinkAs;
  className?: string;
}

/** Product mark and wordmark, for a topbar or the rail's brand row. The mark takes the bar's
 *  own ink as its fill, so it is the inverse of the text beside it on whatever bar it sits. */
export function BrandMark({ name, mark, href, linkAs, className }: BrandMarkProps) {
  /* The mark is a div, not a span: `.jrk-sidebar__brand span` is hidden in the collapsed
     rail, and a span-wrapped mark would vanish with the wordmark. */
  const inner = (
    <>
      <div className="jrk-brand__mark" aria-hidden="true">
        {mark}
      </div>
      <span className="jrk-brand__text">{name}</span>
    </>
  );
  if (!href) return <div className={cx('jrk-brand', className)}>{inner}</div>;
  const Link = linkAs ?? 'a';
  return (
    <Link href={href} className={cx('jrk-brand', className)}>
      {inner}
    </Link>
  );
}

export function Content({ children }: { children: ReactNode }) {
  return (
    <main className="jrk-content" id="main">
      <div className="jrk-content__inner">{children}</div>
    </main>
  );
}

export interface PageHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  breadcrumbs?: Array<{ label: string; href?: string }>;
}

export function PageHeader({ title, description, actions, breadcrumbs }: PageHeaderProps) {
  return (
    <div>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb">
          <ol className="jrk-breadcrumbs">
            {breadcrumbs.map((b, i) => {
              const last = i === breadcrumbs.length - 1;
              return (
                <li key={b.label}>
                  {b.href && !last ? (
                    <a href={b.href}>{b.label}</a>
                  ) : (
                    <span aria-current={last ? 'page' : undefined}>{b.label}</span>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>
      )}
      <div className="jrk-page-header">
        <div>
          <h1 className="jrk-page-header__title">{title}</h1>
          {description && <p className="jrk-page-header__desc">{description}</p>}
        </div>
        {actions && <div className="jrk-page-header__actions">{actions}</div>}
      </div>
    </div>
  );
}

/* =================================== Tabs =================================== */

export interface TabsProps {
  tabs: Array<{ id: string; label: ReactNode; count?: number; disabled?: boolean }>;
  value: string;
  onChange: (id: string) => void;
  variant?: 'underline' | 'pills';
  /** Names the tab set for assistive tech. */
  label: string;
  className?: string;
}

export function Tabs({ tabs, value, onChange, variant = 'underline', label, className }: TabsProps) {
  // Arrow keys move between tabs — required for the tablist pattern.
  function onKeyDown(e: React.KeyboardEvent) {
    const i = tabs.findIndex((t) => t.id === value);
    const dir = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (!dir) return;
    e.preventDefault();
    for (let step = 1; step <= tabs.length; step++) {
      const next = tabs[(i + dir * step + tabs.length * step) % tabs.length];
      if (next && !next.disabled) {
        onChange(next.id);
        return;
      }
    }
  }

  return (
    <div
      role="tablist"
      aria-label={label}
      onKeyDown={onKeyDown}
      className={cx('jrk-tabs', variant === 'pills' && 'jrk-tabs--pills', className)}
    >
      {tabs.map((t) => (
        <button
          key={t.id}
          role="tab"
          type="button"
          id={`tab-${t.id}`}
          aria-selected={t.id === value}
          aria-controls={`panel-${t.id}`}
          tabIndex={t.id === value ? 0 : -1}
          disabled={t.disabled}
          onClick={() => onChange(t.id)}
          className="jrk-tab"
        >
          {t.label}
          {t.count !== undefined && <span className="jrk-tab__count">{t.count}</span>}
        </button>
      ))}
    </div>
  );
}

export function TabPanel({ id, active, children }: { id: string; active: boolean; children: ReactNode }) {
  return (
    <div role="tabpanel" id={`panel-${id}`} aria-labelledby={`tab-${id}`} hidden={!active} tabIndex={0}>
      {children}
    </div>
  );
}

/** Puts the theme stamp on <html>, which is what the token CSS keys off.
 *  Setting it explicitly must beat the OS preference in both directions. */
export function setTheme(mode: 'light' | 'dark' | 'system') {
  const el = document.documentElement;
  if (mode === 'system') delete el.dataset.theme;
  else el.dataset.theme = mode;
}
