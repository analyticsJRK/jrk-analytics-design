import { useEffect, useId } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';
import { Button } from './Button';
import { Icon } from './Icon';
import { cx } from './utils';

export interface DockedPanelTab {
  id: string;
  label: ReactNode;
  /** A count beside the label — notes on the anchored row. Hidden at 0. */
  count?: number;
  content: ReactNode;
}

export interface DockedPanelProps {
  open: boolean;
  /** The panel's accessible name — "Snow Tracker panel". */
  label: string;
  tabs: DockedPanelTab[];
  /** The id of the tab showing. */
  tab: string;
  onTabChange: (id: string) => void;
  /** Escape and the close button both call this. */
  onClose: () => void;
  footer?: ReactNode;
  closeLabel?: string;
  className?: string;
}

/** A rail on the trailing edge that docks BESIDE the content — a guide, a notes
 *  thread — so the reader can read it while looking at the numbers. Below 1100px
 *  it overlays instead. Wrap the page in `<PanelHost open>` so the content gives
 *  up the rail's width rather than sliding under it.
 *
 *  EVERY PANE STAYS MOUNTED while the panel is open; the inactive ones are
 *  `hidden`. Switching to the guide and back must not discard a half-typed note.
 *
 *  Escape closes it, bound on the document so it works while focus is still on
 *  the table row that opened the panel. It stands down when something nearer has
 *  already handled the key — a dialog's own Escape, an open autocomplete list. */
export function DockedPanel({
  open,
  label,
  tabs,
  tab,
  onTabChange,
  onClose,
  footer,
  closeLabel = 'Close panel',
  className,
}: DockedPanelProps) {
  const base = useId();

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key !== 'Escape' || e.defaultPrevented) return;
      if ((e.target as Element | null)?.closest?.('dialog')) return;
      onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const tabId = (id: string) => `${base}-tab-${id}`;
  const paneId = (id: string) => `${base}-pane-${id}`;
  const single = tabs.length === 1 ? tabs[0] : null;

  /* Arrow keys walk the tabs — the tablist pattern's one required keyboard rule.
     Focus follows, so the tab moved to is the one that is announced. */
  const onTabKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const dir = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (!dir || !tabs.length) return;
    e.preventDefault();
    const rtl = getComputedStyle(e.currentTarget).direction === 'rtl';
    const step = rtl ? -dir : dir;
    const i = tabs.findIndex((t) => t.id === tab);
    const next = tabs[(i + step + tabs.length) % tabs.length];
    if (!next) return;
    onTabChange(next.id);
    document.getElementById(tabId(next.id))?.focus();
  };

  return (
    <aside className={cx('jrk-panel', className)} aria-label={label}>
      <header className="jrk-panel__head">
        {single ? (
          <h2 className="jrk-panel__title">{single.label}</h2>
        ) : (
          <div
            className="jrk-tabs jrk-tabs--pills jrk-panel__tabs"
            role="tablist"
            aria-label={label}
            onKeyDown={onTabKey}
          >
            {tabs.map((t) => (
              <button
                key={t.id}
                id={tabId(t.id)}
                className="jrk-tab"
                role="tab"
                type="button"
                aria-selected={t.id === tab}
                aria-controls={paneId(t.id)}
                tabIndex={t.id === tab ? 0 : -1}
                onClick={() => onTabChange(t.id)}
              >
                {t.label}
                {t.count != null && t.count > 0 && <span className="jrk-tab__count">{t.count}</span>}
              </button>
            ))}
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          iconOnly
          aria-label={closeLabel}
          className="jrk-panel__close"
          onClick={onClose}
        >
          <Icon name="close" />
        </Button>
      </header>

      <div className="jrk-panel__body">
        {tabs.map((t) => (
          <div
            key={t.id}
            id={paneId(t.id)}
            className="jrk-panel__pane"
            role={single ? undefined : 'tabpanel'}
            aria-labelledby={single ? undefined : tabId(t.id)}
            hidden={!single && t.id !== tab}
          >
            {t.content}
          </div>
        ))}
      </div>

      {footer && <footer className="jrk-panel__foot">{footer}</footer>}
    </aside>
  );
}

/** The page the panel docks beside. While `open`, it gives up the rail's width
 *  as padding — padding cannot push the page wider than the viewport, where a
 *  grid track would. */
export function PanelHost({ open, children, className }: { open: boolean; children?: ReactNode; className?: string }) {
  return <div className={cx('jrk-panel-host', open && 'jrk-panel-host--open', className)}>{children}</div>;
}
