import { useEffect, useId, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Icon, STATUS_ICON } from './Icon';
import { useBusy } from './busy';
import { cx } from './utils';

export interface CardProps {
  title?: ReactNode;
  subtitle?: ReactNode;
  /** Right-hand slot in the header — a menu, a toggle, a time-range control. */
  actions?: ReactNode;
  footer?: ReactNode;
  children?: ReactNode;
  /** Elevation is opt-in. A dashboard of many tiles reads calmer flat. */
  raised?: boolean;
  /** Removes body padding — for a table or chart that should meet the edges. */
  flush?: boolean;
  /** The topbar's vibrancy material on a tile — a 72% fill over a saturated blur.
   *
   *  ONLY for a card with content BEHIND it: a sticky summary over a scrolling
   *  body, a panel laid on the vivid gradient band, a tile over an image. Over the
   *  plain page there is nothing to blur and the mix composites to a 1.03:1 step,
   *  so it is a normal card that has given up its fill for no visible effect.
   *
   *  It re-inks muted text to `text.secondary` on its own, because muted lands at
   *  3.4:1 once a saturated ground shows through. A LINK is still not safe there
   *  (`accent.text` falls to 3.45:1) and cannot be fixed by re-inking — the anchor
   *  is already the shallowest passing step on the hue. Read the modifier's header
   *  in card.css for the full hand-measured table; nothing gates a colour that is
   *  composited at runtime. */
  frosted?: boolean;
  /** Scroll anchor — the target of a `#link` from a jump strip or a health tile.
   *  The card takes a scroll margin that clears the sticky topbar. */
  id?: string;
  /** The takeaway, between the header and the body. It stays visible when a
   *  collapsible card is folded: folding hides the detail, never the conclusion. */
  summary?: ReactNode;
  /** A short status at the trailing edge of the header, before `actions` —
   *  "649 combos · 80 properties". */
  meta?: ReactNode;
  /** Opt in to a fold. Off by default, and that is the design: a column of
   *  foldable cards reads as a stack of drawers, not a report. For the long tail
   *  on a page whose other sections stay open. Needs a `title` to hang on. */
  collapsible?: boolean;
  /** Only read when `collapsible`. Defaults to CLOSED, which is the point of
   *  asking for a fold. Not persisted — the card re-opens closed on next load. */
  defaultOpen?: boolean;
  className?: string;
}

export function Card({
  title,
  subtitle,
  actions,
  footer,
  children,
  raised,
  flush,
  frosted,
  id,
  summary,
  meta,
  collapsible = false,
  defaultOpen = false,
  className,
}: CardProps) {
  const [open, setOpen] = useState(defaultOpen);
  const bodyId = `${useId()}-body`;
  const foldable = collapsible && title != null;
  const shown = !foldable || open;

  /* The button sits INSIDE the heading (the disclosure pattern's own shape), not
     around the header: a header-wide button would swallow the actions slot's own
     links and put interactive content inside a button. The body keeps its id in
     both states so `aria-controls` never points at nothing. */
  const heading = foldable ? (
    <h3 className="jrk-card__title">
      <button
        type="button"
        className="jrk-card__toggle"
        aria-expanded={open}
        aria-controls={bodyId}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="jrk-card__chevron" aria-hidden="true">
          <Icon name="chevronDown" />
        </span>
        {title}
      </button>
    </h3>
  ) : (
    title && <h3 className="jrk-card__title">{title}</h3>
  );

  return (
    <section
      id={id}
      className={cx(
        'jrk-card',
        raised && 'jrk-card--raised',
        frosted && 'jrk-card--frosted',
        foldable && 'jrk-card--collapsible',
        foldable && !open && 'jrk-card--collapsed',
        className,
      )}
    >
      {(title || actions || meta) && (
        <header className="jrk-card__header">
          <div>
            {heading}
            {subtitle && <p className="jrk-card__subtitle">{subtitle}</p>}
          </div>
          {meta && <span className="jrk-card__meta">{meta}</span>}
          {actions && <div className="jrk-card__actions">{actions}</div>}
        </header>
      )}
      {summary != null && <div className="jrk-card__summary">{summary}</div>}
      {children != null && (
        <div
          id={foldable ? bodyId : undefined}
          className={cx('jrk-card__body', flush && 'jrk-card__body--flush')}
          hidden={!shown}
        >
          {children}
        </div>
      )}
      {footer && shown && <footer className="jrk-card__footer">{footer}</footer>}
    </section>
  );
}

export interface EmptyProps {
  title: string;
  /** Say what would appear here. An empty surface with no explanation reads
   *  as a bug. */
  description?: string;
  /** The action that produces the missing data. */
  action?: ReactNode;
  icon?: ReactNode;
  inline?: boolean;
  className?: string;
}

export function Empty({ title, description, action, icon, inline, className }: EmptyProps) {
  return (
    <div className={cx('jrk-empty', inline && 'jrk-empty--inline', className)}>
      {icon && <span className="jrk-empty__icon">{icon}</span>}
      <p className="jrk-empty__title">{title}</p>
      {description && <p className="jrk-empty__text">{description}</p>}
      {action && <div className="jrk-empty__actions">{action}</div>}
    </div>
  );
}

export interface AlertProps {
  tone?: 'good' | 'warning' | 'serious' | 'critical' | 'accent' | 'neutral';
  title?: ReactNode;
  children?: ReactNode;
  /** Defaults to the tone's status glyph, because a wash alone is colour as the
   *  only signal. `accent` takes the info glyph: it is an informational box that
   *  wants to be noticed, not a fifth severity. Pass `null` to drop it — only
   *  where something beside the box already says what it is. */
  icon?: ReactNode;
  /** `alert` interrupts a screen reader. Defaults to `alert` for critical and
   *  `status` for everything else; a critical message already on the page at load
   *  is `status`. */
  role?: 'status' | 'alert';
  className?: string;
}

/* `STATUS_ICON` carries good / warning / serious / critical / neutral and no
   `accent`, so passing that tone straight through rendered an empty glyph box. */
const alertIcon = (tone: NonNullable<AlertProps['tone']>) => STATUS_ICON[tone] ?? STATUS_ICON.neutral;

export function Alert({ tone = 'neutral', title, children, icon, role, className }: AlertProps) {
  // Critical messages interrupt; everything else is announced politely.
  const live = role ?? (tone === 'critical' ? 'alert' : 'status');
  return (
    <div className={cx('jrk-alert', tone !== 'neutral' && `jrk-alert--${tone}`, className)} role={live}>
      {icon === undefined ? (
        <Icon name={alertIcon(tone)} className="jrk-alert__icon" />
      ) : (
        icon && <span className="jrk-alert__icon">{icon}</span>
      )}
      <div className="jrk-alert__body">
        {title && <p className="jrk-alert__title">{title}</p>}
        {children && <div className="jrk-alert__text">{children}</div>}
      </div>
    </div>
  );
}

export interface HoverCardRow {
  label: ReactNode;
  value: ReactNode;
}

export interface HoverCardProps {
  /** The panel's id, and the target of the trigger's `aria-describedby`.
   *
   *  Optional only in the type. Without it the association the plain-CSS contract
   *  requires cannot be expressed from React at all — which is what this
   *  component's own preview did before the prop existed, pointing
   *  `aria-describedby` at nothing. That failure is silent in the worst way: the
   *  panel still opens on focus, so it looks reachable, and announces nothing. */
  id?: string;
  /** Names what the rows break down — usually the tile's own metric. */
  header?: ReactNode;
  rows?: HoverCardRow[];
  /** A closing line: the denominator, the as-of date. */
  note?: ReactNode;
  /** Free-form panel content instead of `rows`. */
  children?: ReactNode;
  /** Which corner the panel hangs from. There is no auto-flip — a measured
   *  position goes stale the moment anything reflows under it — so an author who
   *  knows the tile is at the end of a row or the foot of a page says so. */
  align?: 'start' | 'end';
  side?: 'below' | 'above';
  className?: string;
}

/** The breakdown behind a headline number, revealed on hover **and on focus**.
 *
 *  The trigger must be focusable — a `<button>` or a link, never a bare `<div>` —
 *  and must name the panel with `aria-describedby`, which means passing `id`
 *  here. Opening on hover alone makes the figures reachable only with a pointer,
 *  which is the difference between a disclosure and a decoration.
 *
 *  Watch for clipping: the panel escapes its anchor, so any ancestor with
 *  `overflow: hidden` cuts it off. In this library that is the joined
 *  `.jrk-stat-row` (the split row is fine), `.jrk-expander`, and
 *  `.jrk-table-wrap`. */
export function HoverCard({
  id,
  header,
  rows,
  note,
  children,
  align = 'start',
  side = 'below',
  className,
}: HoverCardProps) {
  return (
    <div
      id={id}
      className={cx(
        'jrk-hovercard',
        align === 'end' && 'jrk-hovercard--end',
        side === 'above' && 'jrk-hovercard--above',
        className,
      )}
      role="tooltip"
    >
      {header && <p className="jrk-hovercard__header">{header}</p>}
      {rows?.map((r, i) => (
        <p className="jrk-hovercard__row" key={i}>
          <span className="jrk-hovercard__label">{r.label}</span>
          <span className="jrk-hovercard__value">{r.value}</span>
        </p>
      ))}
      {children}
      {note && <p className="jrk-hovercard__note">{note}</p>}
    </div>
  );
}

/** Wraps a tile and its <HoverCard>. Block, not inline-flex: it holds a tile that
 *  has to keep filling its grid track. */
export function HoverCardAnchor({ children, className }: { children?: ReactNode; className?: string }) {
  return <div className={cx('jrk-hovercard-anchor', className)}>{children}</div>;
}

export interface SpinnerProps {
  /** `em` tracks the surrounding text, so the ring can take an icon's slot. */
  size?: 'sm' | 'md' | 'lg' | 'em';
  /** The sr-only status line. A spinner alone announces nothing. */
  label?: string;
  /** Hold the ring back 140ms and fade it in. For a wait that may be a
   *  prefetched navigation, which commits in about a frame — a ring that flashes
   *  for one frame reads as a glitch. Leave it off for a server write, which is
   *  never that short: delaying the only feedback removes it exactly while the
   *  reader decides whether their click registered. `size="em"` holds by default. */
  delay?: boolean;
  className?: string;
}

/** A loading ring with an sr-only status line.
 *
 *  `size="em"` or `delay` renders the SPLIT form — a box that reveals and a ring
 *  inside it that spins — because the bare ring owns its animation shorthand and a
 *  reveal cannot be layered onto it. */
export function Spinner({ size = 'md', label = 'Loading', delay, className }: SpinnerProps) {
  const split = size === 'em' || delay === true;
  const held = delay ?? size === 'em';
  return (
    <>
      {split ? (
        <span
          className={cx(
            'jrk-spinner',
            'jrk-spinner--em',
            size !== 'em' && `jrk-spinner--${size}`,
            !held && 'jrk-spinner--now',
            className,
          )}
          aria-hidden="true"
        >
          <span className="jrk-spinner__ring" />
        </span>
      ) : (
        <span
          className={cx('jrk-spinner', size !== 'md' && `jrk-spinner--${size}`, className)}
          aria-hidden="true"
        />
      )}
      {/* A spinner alone announces nothing. */}
      <span className="jrk-sr-only" role="status">
        {label}
      </span>
    </>
  );
}

export interface ScreenSpinnerProps {
  /** Names the wait, and makes it a live region. A navigation needs no words —
   *  the page it waits for arrives. A WRITE does: "Approving and locking…" is the
   *  difference between a wait somebody sits through and one they press the
   *  button again during. */
  label?: string;
  /** Hold the whole layer back 140ms — for a navigation that may be prefetched. */
  delay?: boolean;
  className?: string;
}

type PopoverEl = HTMLElement & { showPopover?: () => void; hidePopover?: () => void };

/** One ring in the middle of the viewport, over a faint wash, above everything.
 *
 *  Shown as a `popover="manual"` in the TOP LAYER, which is the fix for a ring
 *  that "runs behind chart data": `position: fixed` does not escape a stacking
 *  context, and an ancestor with a transform, a filter or an opacity under 1
 *  traps it in its own slot whatever its z-index says. The top layer sidesteps
 *  the whole class of bug, and unlike a portal it needs no `react-dom` and keeps
 *  the element where the wait is known — inside the link, inside the control.
 *
 *  `pointer-events: none`: it marks a wait, it does not disable the page. Render
 *  it only while waiting; unmounting takes it down. */
export function ScreenSpinner({ label, delay = false, className }: ScreenSpinnerProps) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current as PopoverEl | null;
    if (!el || typeof el.showPopover !== 'function') return undefined;
    try {
      el.showPopover();
    } catch {
      /* Already showing, or detached mid-commit: the CSS still draws it fixed. */
    }
    return () => {
      try {
        el.hidePopover?.();
      } catch {
        /* Gone with its subtree. */
      }
    };
  }, []);

  return (
    <span
      ref={ref}
      popover="manual"
      className={cx(
        'jrk-screen-spinner',
        label && 'jrk-screen-spinner--labelled',
        delay && 'jrk-screen-spinner--delay',
        className,
      )}
      role={label ? 'status' : undefined}
      aria-live={label ? 'polite' : undefined}
      aria-hidden={label ? undefined : true}
    >
      <span className="jrk-spinner jrk-spinner--em jrk-spinner--now" aria-hidden="true">
        <span className="jrk-spinner__ring" />
      </span>
      {label && <span className="jrk-screen-spinner__label">{label}</span>}
    </span>
  );
}

/** The screen spinner, shown while any `beginBusy()` write is open. Mount it
 *  once, near the root, and every write that reports itself gets "Saving…". It
 *  must outlive the screens that start writes: a dialog that closes as it saves
 *  would otherwise take its own spinner with it. */
export function BusySpinner({ label = 'Saving…' }: { label?: string }) {
  const busy = useBusy();
  return busy.busy ? <ScreenSpinner label={busy.label ?? label} /> : null;
}
