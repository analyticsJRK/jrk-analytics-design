import type { ReactNode } from 'react';
import { SectionNav, Card, Stat, StatRow, Alert } from '@jrk/design';

/* <SectionNav> indexes a REGION OF THE DOCUMENT, so every cell here builds a real
   .jrk-section-layout and lets the component find its own body — that zero-config
   path is the one an app should use, and showing it wired by hand would teach the
   wrong thing.

   THE INDEX IS A LINE OF DOTS AT REST, and its labels are revealed by
   `.jrk-section-nav:hover` / `:focus-within` — which package-capture.mjs does
   neither of. Left alone, all three cards would capture as a column of dots with
   one label, and every mechanical signal would agree with a screenshot of nothing:
   the label text IS in the DOM, so `texts` is full and `thin`/`blank` stay false.
   That is the hover-only-panel trap NOTES.md records against HoverCard, arriving
   through a different component.

   So the reveal is FORCED with a preview-scoped class, the same house pattern
   HoverCard and NavMenuSeparator use — `.pv-reveal` below, applied via the
   component's own `className`, which lands on the <nav>.

   `Default` is deliberately NOT forced: it is the only cell showing the state a
   reader actually meets first, and a card set where every cell is hover-revealed
   would misrepresent the component as a plain labelled list. One cell at rest,
   two revealed, is the honest pair. The hidden labels are `opacity: 0`, never
   display:none, so a screen reader gets the full index in every case.

   Three more things about these captures are worth knowing before reading them:

   1. The marker follows the WINDOW scroll position, and a preview card is not the
      window. So every cell renders in its resting state, which is the documented
      "above the first heading, mark the first section" rule — the same thing you
      see at the top of a real page. The live scroll behaviour is on
      preview/dashboard.html and preview/sections.html in the repo gallery.

   2. The index is sticky under a 56px topbar in an app. There is no topbar here,
      so the harness overrides --jrk-section-offset to park it at the top of the
      card instead. That property is the single knob for all three things that need
      the number — where the index parks, how tall it may grow, and how far above a
      heading a jump stops. */
const frameCss = `
.pv-frame {
  --jrk-section-offset: var(--jrk-space-4);
  padding: var(--jrk-space-5);
  background: var(--jrk-surface-canvas);
  border: 1px solid var(--jrk-border-default);
  border-radius: var(--jrk-radius-2xl);
}
.pv-frame h2 {
  font-size: var(--jrk-text-xl);
  font-weight: var(--jrk-weight-semibold);
  letter-spacing: var(--jrk-tracking-tight);
  margin: var(--jrk-space-5) 0 var(--jrk-space-3);
}
.pv-frame h2:first-child { margin-top: 0; }
.pv-frame h3 {
  font-size: var(--jrk-text-lg);
  font-weight: var(--jrk-weight-semibold);
  color: var(--jrk-text-secondary);
  margin: var(--jrk-space-4) 0 var(--jrk-space-2);
}
.pv-frame p.pv-note {
  max-width: 68ch;
  color: var(--jrk-text-muted);
  font-size: var(--jrk-text-md);
}
/* Forces the hover/focus reveal for a still capture. 0-2-0, matching the
   component's own :hover rule and beating the 0-1-0 base that hides the label. */
.pv-reveal .jrk-section-nav__label { opacity: 1; }
`;

const Frame = ({ children }: { children: ReactNode }) => (
  <>
    <style dangerouslySetInnerHTML={{ __html: frameCss }} />
    <div className="pv-frame">{children}</div>
  </>
);

/* The whole API surface of the common case. No `items`, no ids to keep in step,
   no ref to wire: the component walks up to its own .jrk-section-layout, indexes
   that layout's __body, and takes the labels off the headings themselves.

   There is no `items` prop and there will not be one — an authored index is a
   second source of truth for the page's own structure and it goes stale the first
   time a section is renamed. Rename a heading below and the row renames with it. */
export const Default = () => (
  <Frame>
    <div className="jrk-section-layout">
      <div className="jrk-section-layout__body">
        <h2 id="pv-summary">Portfolio summary</h2>
        <StatRow className="jrk-stat-row--split">
          <Stat label="Collected rent" value="$4.21M" />
          <Stat label="Occupancy" value="93.8%" />
          <Stat label="NOI vs budget" value="+7.0%" />
        </StatRow>

        <h2 id="pv-revenue">Revenue</h2>
        <p className="pv-note">
          Billed rather than received. The cash figure sits lower whenever delinquency is
          rising, which is why these two sections are read together.
        </p>

        <h2 id="pv-delinquency">Delinquency</h2>
        <p className="pv-note">
          Falling is good here. Direction and interpretation are separate inputs, and this is
          the metric where assuming down-is-bad gets it backwards.
        </p>

        <h2 id="pv-expenses">Operating expenses</h2>
        <p className="pv-note">
          Controllable expenses are 2.4% under budget; the overage is entirely in insurance,
          which is not controllable at the property.
        </p>

        <h2 id="pv-methodology">Methodology</h2>
        <p className="pv-note">
          T12 on an accrual basis. NOI excludes capital and debt service.
        </p>
      </div>
      <SectionNav />
    </div>
  </Frame>
);

/* Two levels, and there is no third. Depth comes from position in the `headings`
   selector — 'h2, h3' indents every h3 one step under the h2s — and a third
   selector is clamped to level 2 with a dev warning. An index deep enough to need
   three levels has stopped being a position indicator and become a second copy of
   the document, which is a layer-1 problem with the page.

   `data-section-label` on the "Aging buckets, 0–120 days" heading shortens its row
   without shortening the heading. The label still lives ON the section, so it
   cannot drift from it either. */
export const TwoLevels = () => (
  <Frame>
    <div className="jrk-section-layout">
      <div className="jrk-section-layout__body">
        <h2 id="pv2-revenue">Revenue</h2>
        <h3 id="pv2-rent-roll">Rent roll</h3>
        <p className="pv-note">
          Scheduled rent of $4,486,300 across 316 units, 12 of them down for turn at the close.
        </p>
        <h3 id="pv2-other-income">Other income</h3>
        <p className="pv-note">Parking, pet rent, utility reimbursement and late fees.</p>

        <h2 id="pv2-delinquency">Delinquency</h2>
        <h3 id="pv2-aging" data-section-label="Aging buckets">
          Aging buckets, 0–120 days
        </h3>
        <Card subtitle="41 accounts current, 18 at 31–60 days, 9 escalated past 60." />
        <h3 id="pv2-write-offs">Write-offs</h3>
        <p className="pv-note">$18,900 written off against a $24,000 reserve.</p>

        <h2 id="pv2-capital">Capital projects</h2>
        <p className="pv-note">Roof replacement closed in May; boiler replacement moves to Q3.</p>
      </div>
      <SectionNav headings="h2, h3" className="pv-reveal" />
    </div>
  </Frame>
);

/* `title` renames the caption AND the accessible name of the <nav> — one prop, via
   aria-labelledby, so the name is announced once rather than twice.

   The index is an ACCELERATOR, never the only path to a section: every heading
   keeps its id, every deep link still resolves, and the page reads top to bottom
   without it. That is what makes it legal to drop the whole column below 1024px
   rather than reflowing it into a horizontal row of pills above the content —
   which would be the "jump to section pill row" this library names as its most
   common IA failure, arriving as a responsive artefact nobody chose. */
export const CustomTitle = () => (
  <Frame>
    <div className="jrk-section-layout">
      <div className="jrk-section-layout__body">
        <Alert tone="warning" title="3 units missing a June close">
          Totals on this page exclude them.
        </Alert>

        <h2 id="pv3-coverage">Coverage</h2>
        <p className="pv-note">313 of 316 units reported a June close.</p>

        <h2 id="pv3-variance">Variance</h2>
        <StatRow className="jrk-stat-row--split">
          <Stat label="NOI vs budget" value="+7.0%" delta={{ value: 7, vs: 'vs budget' }} />
          <Stat label="Expenses vs budget" value="−2.4%" />
        </StatRow>

        <h2 id="pv3-exceptions">Exceptions</h2>
        <p className="pv-note">Two accounts carry just over half the written-off balance.</p>

        <h2 id="pv3-sign-off">Sign-off</h2>
        <p className="pv-note">Asset manager review pending.</p>
      </div>
      <SectionNav title="In this report" className="pv-reveal" />
    </div>
  </Frame>
);
