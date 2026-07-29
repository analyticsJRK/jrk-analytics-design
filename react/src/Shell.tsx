import type { ReactNode } from 'react';
import { cx } from './utils';

/* App shell. Layout only — routing and active-state logic stay in the app. */

export function AppShell({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx('jrk-app', className)}>{children}</div>;
}

export interface SidebarProps {
  brand: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  collapsed?: boolean;
  className?: string;
}

export function Sidebar({ brand, children, footer, collapsed, className }: SidebarProps) {
  return (
    <nav className={cx('jrk-sidebar', className)} data-collapsed={collapsed || undefined} aria-label="Main">
      <div className="jrk-sidebar__brand">{brand}</div>
      <div className="jrk-sidebar__nav">{children}</div>
      {footer && <div className="jrk-sidebar__footer">{footer}</div>}
    </nav>
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

export function Main({ children }: { children: ReactNode }) {
  return <div className="jrk-main">{children}</div>;
}

export function Topbar({ children }: { children: ReactNode }) {
  return <header className="jrk-topbar">{children}</header>;
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
