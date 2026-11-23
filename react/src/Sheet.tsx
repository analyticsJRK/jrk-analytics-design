import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { cx } from './utils';

export interface SheetToolbarProps {
  children?: ReactNode;
  className?: string;
}

/** The sheet's top toolbar, which measures itself.
 *
 *  `.jrk-sheet` stacks three things at the top of its scroll port — this toolbar,
 *  the A…Y letter bar under it, and every metric block's header under both — and
 *  each has to know the height of the ones above. CSS cannot ask an element how
 *  tall it is, so sheet.css reads `--jrk-sheet-toolbar-h` and this component
 *  writes it. Unset, the letter bar pins at 0 behind the toolbar and every metric
 *  header parks out of sight inside it.
 *
 *  MEASURED, NOT STATED, because a toolbar wraps: it holds pickers whose option
 *  text is a property name, and at a narrow viewport a stated height would park
 *  the letter bar across the middle of a taller toolbar. One ResizeObserver per
 *  sheet cannot go out of step.
 *
 *  IT WRITES ON THE SHEET, NOT ON ITSELF, because `--jrk-sheet-frozen-top` is
 *  composed on `.jrk-sheet`; set here it would only reach this toolbar's
 *  children. Render it inside the sheet it belongs to — `closest()` finds it. */
export function SheetToolbar({ children, className }: SheetToolbarProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const bar = ref.current;
    const sheet = bar?.closest<HTMLElement>('.jrk-sheet');
    if (!bar || !sheet) return undefined;

    /* `offsetHeight`, not the fractional box height: the value meets an integer
       letter-bar height in a `calc`, and a fractional px parks the block head a
       subpixel over the letters — a hairline of the scrolling row shows through. */
    const publish = () => sheet.style.setProperty('--jrk-sheet-toolbar-h', `${bar.offsetHeight}px`);
    publish();

    /* Observes the BAR, which is what changes height. The sheet's own height is
       the scroll port and moves for unrelated reasons. */
    const ro = new ResizeObserver(publish);
    ro.observe(bar);
    return () => {
      ro.disconnect();
      /* A sheet that loses its toolbar must not keep reserving space for it;
         removing the property restores the 0px fallback. */
      sheet.style.removeProperty('--jrk-sheet-toolbar-h');
    };
  }, []);

  return (
    <div className={cx('jrk-sheet__toolbar', className)} ref={ref}>
      {children}
    </div>
  );
}

/** The strip at the END of a sheet — a closing note, a second set of controls.
 *  Static, and never measured: its height must not overwrite the top toolbar's. */
export function SheetFoot({ children, className }: SheetToolbarProps) {
  return <div className={cx('jrk-sheet__foot', className)}>{children}</div>;
}
