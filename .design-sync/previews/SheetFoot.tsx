import { SheetFoot } from '@jrk/design';

/* A two-row sheet so the foot has something to close. */
export const Default = () => (
  <div className="jrk-sheet" role="grid" aria-label="NOI — Vista Ridge" style={{ maxHeight: 200 }}>
    <div className="jrk-sheet__row" role="row">
      <div className="jrk-sheet__gutter" aria-hidden="true">1</div>
      <div className="jrk-sheet__cell jrk-sheet__cell--label" role="rowheader">2025</div>
      <div className="jrk-sheet__cell jrk-sheet__cell--num" role="gridcell">$962,400</div>
    </div>
    <div className="jrk-sheet__row" role="row">
      <div className="jrk-sheet__gutter" aria-hidden="true">2</div>
      <div className="jrk-sheet__cell jrk-sheet__cell--label" role="rowheader">2026</div>
      <div className="jrk-sheet__cell jrk-sheet__cell--num" role="gridcell">$1,004,118</div>
    </div>
    <SheetFoot>
      <span className="jrk-caption">Budget from the 2026 plan · actuals through September</span>
    </SheetFoot>
  </div>
);
