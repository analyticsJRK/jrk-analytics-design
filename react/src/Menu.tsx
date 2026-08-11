import { createContext, useCallback, useContext, useEffect, useId, useRef, useState } from 'react';
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
 */

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
}: MenuProps) {
  const uid = useId();
  const panelId = `${uid}-panel`;
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);

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
          id={panelId}
          role="group"
          aria-label={typeof label === 'string' ? label : undefined}
          className={cx(
            'jrk-menu',
            'jrk-menu--anchored',
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
