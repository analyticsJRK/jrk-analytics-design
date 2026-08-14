import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { cx } from './utils';
import { Icon } from './Icon';

/* App shell. Layout only — routing and active-state logic stay in the app. */

export function AppShell({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx('jrk-app', className)}>{children}</div>;
}

export interface SidebarProps {
  brand: ReactNode;
  children: ReactNode;
  /** Icon-only verbs above the nav hairline — Home, Create, Search. Destinations
   *  belong in `children`; this row is for things you DO. */
  actions?: ReactNode;
  footer?: ReactNode;
  collapsed?: boolean;
  className?: string;
}

export function Sidebar({ brand, children, actions, footer, collapsed, className }: SidebarProps) {
  return (
    <nav className={cx('jrk-sidebar', className)} data-collapsed={collapsed || undefined} aria-label="Main">
      <div className="jrk-sidebar__brand">{brand}</div>
      {actions && <div className="jrk-sidebar__actions">{actions}</div>}
      <div className="jrk-sidebar__nav">{children}</div>
      {footer && <div className="jrk-sidebar__footer">{footer}</div>}
    </nav>
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
  children: ReactNode;
  /** Drives both the styling and aria-current, so the visual and the
   *  accessible state can never disagree. */
  active?: boolean;
  badge?: ReactNode;
  className?: string;
}

export function NavItem({ href, icon, children, active, badge, className }: NavItemProps) {
  return (
    <a href={href} className={cx('jrk-nav-item', className)} aria-current={active ? 'page' : undefined}>
      {icon}
      <span className="jrk-nav-item__label">{children}</span>
      {badge && <span className="jrk-nav-item__badge">{badge}</span>}
    </a>
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
   *  the same ramp, so the two read as one masthead. Ignored unless `vivid`. */
  tone?: 'blue';
  className?: string;
}

export function Topbar({ children, vivid, tone, className }: TopbarProps) {
  return (
    <header
      className={cx(
        'jrk-topbar',
        vivid && 'jrk-topbar--vivid',
        vivid && tone && `jrk-topbar--${tone}`,
        className,
      )}
    >
      {children}
    </header>
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
