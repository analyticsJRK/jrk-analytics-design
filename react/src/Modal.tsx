import { useCallback, useEffect, useId, useRef } from 'react';
import type { MouseEvent, PointerEvent, ReactNode, SyntheticEvent } from 'react';
import { Button } from './Button';
import { Icon } from './Icon';
import { cx } from './utils';

export interface ModalProps {
  /** Renders and opens the dialog. `false` unmounts it, which also takes it out
   *  of the top layer. Defaults to `true`, for the common shape of mounting the
   *  modal only while it is wanted. */
  open?: boolean;
  /** The dialog's ACCESSIBLE NAME, and its heading unless `titleNode` is given.
   *  Required: the name is what a screen reader announces on open. */
  title: string;
  /** What the heading SHOWS, when that differs from what the dialog is CALLED —
   *  a heading with a count or a coloured word. A node cannot be a name, so
   *  `title` is still required. The heading is always rendered: a dialog with a
   *  blank band where its heading should be is worse than one that restates the
   *  row that opened it. */
  titleNode?: ReactNode;
  /** A short note under the heading, and the dialog's description. */
  description?: ReactNode;
  children?: ReactNode;
  /** The action row. Always reachable: header and footer keep their height and
   *  the body scrolls. */
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  /** The body is centred with the heading. `start` puts it on a leading edge —
   *  for content that is scanned rather than read in one line (a fact grid, a
   *  review's prose). Forms, lists and field stacks opt out by themselves. */
  align?: 'center' | 'start';
  /** Escape, the close button and a backdrop click all call this. React state is
   *  the authority: the dialog never closes itself. */
  onClose: () => void;
  closeLabel?: string;
  className?: string;
}

/** A modal dialog on the native `<dialog>`.
 *
 *  `showModal()` gives the top layer, a real focus trap, inertness for the rest of
 *  the page, a backdrop and Escape — five things a div-based modal reimplements,
 *  usually badly. It is called in an effect rather than set with the `open`
 *  attribute: `open` renders the dialog inline with no backdrop, no top layer and
 *  no trap.
 *
 *  Everything inside is library surface — fields, tables and buttons render as
 *  they would on a page. Nothing in a modal is bold; see `.jrk-modal` in
 *  feedback.css. */
export function Modal({
  open = true,
  title,
  titleNode,
  description,
  children,
  footer,
  size = 'md',
  align = 'center',
  onClose,
  closeLabel = 'Close',
  className,
}: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const descId = `${useId()}-desc`;
  /* Whether the current press STARTED on the backdrop. A drag that selects text
     inside the dialog and is released outside it fires `click` on the dialog with
     outside coordinates; closing on that throws away whatever was being typed. */
  const pressedOutside = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (open && el && !el.open) el.showModal();
  }, [open]);

  /* The browser fires `cancel` for Escape and would close the dialog itself,
     leaving the state that rendered it true — so it could never be reopened.
     Routing it through `onClose` keeps React the authority.

     ONLY THE DIALOG'S OWN cancel. A file input fires `cancel` too when its picker
     is dismissed, and it bubbles: without the target test, pressing Cancel in a
     file picker closed the whole dialog. */
  const handleCancel = useCallback(
    (e: SyntheticEvent<HTMLDialogElement>) => {
      if (e.target !== e.currentTarget) return;
      e.preventDefault();
      onClose();
    },
    [onClose],
  );

  /* A `<form method="dialog">` inside closes the dialog natively; report it. */
  const handleNativeClose = useCallback(
    (e: SyntheticEvent<HTMLDialogElement>) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose],
  );

  /* The backdrop is not an element, so a backdrop click lands on the dialog
     itself with coordinates outside its box. A click on a child has the child as
     its target and never matches. */
  const outside = (el: HTMLDialogElement, x: number, y: number) => {
    const box = el.getBoundingClientRect();
    return x < box.left || x > box.right || y < box.top || y > box.bottom;
  };

  const handlePointerDown = (e: PointerEvent<HTMLDialogElement>) => {
    pressedOutside.current = e.target === e.currentTarget && outside(e.currentTarget, e.clientX, e.clientY);
  };

  const handleClick = (e: MouseEvent<HTMLDialogElement>) => {
    const started = pressedOutside.current;
    pressedOutside.current = false;
    if (e.target !== e.currentTarget || !started) return;
    if (outside(e.currentTarget, e.clientX, e.clientY)) onClose();
  };

  if (!open) return null;

  return (
    <dialog
      ref={ref}
      className={cx('jrk-modal', size !== 'md' && `jrk-modal--${size}`, className)}
      aria-label={title}
      aria-describedby={description ? descId : undefined}
      onCancel={handleCancel}
      onClose={handleNativeClose}
      onPointerDown={handlePointerDown}
      onClick={handleClick}
    >
      <header className="jrk-modal__header">
        <div>
          <h2 className="jrk-modal__title">{titleNode ?? title}</h2>
          {description && (
            <p className="jrk-modal__desc" id={descId}>
              {description}
            </p>
          )}
        </div>
        <Button variant="ghost" iconOnly aria-label={closeLabel} className="jrk-modal__close" onClick={onClose}>
          <Icon name="close" />
        </Button>
      </header>
      <div className={cx('jrk-modal__body', align === 'start' && 'jrk-modal__body--start')}>{children}</div>
      {footer && <footer className="jrk-modal__footer">{footer}</footer>}
    </dialog>
  );
}
