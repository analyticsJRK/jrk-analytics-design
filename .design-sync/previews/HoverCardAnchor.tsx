import { HoverCard, HoverCardAnchor, StatRow } from '@jrk/design';

/* A capture harness, not a component API. The panel is revealed by
   `.jrk-hovercard-anchor:hover` / `:focus-within`, and a screenshot does neither,
   so every card here would otherwise show the trigger above a reserved gap. The
   class forces the revealed state on so the thing being documented is visible;
   the anchor's own rules are untouched. Same move NavMenuSeparator's preview
   makes for a `position: fixed` panel. */
const openCss = `
.pv-open .jrk-hovercard,
.pv-loose .jrk-hovercard {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
  transition-delay: 0s;
}
/* Only for the WithoutTheAnchor card: a positioned box that is NOT the anchor, so
   the panel has something to resolve against and the reader can see where it goes
   instead of it flying to the page corner. */
.pv-loose {
  position: relative;
  width: 320px;
}
`;

/* The positioning context, and that is all it is: `position: relative` around a
   focusable trigger plus a `HoverCard`, so the panel's `position: absolute` has
   something to resolve against. Drop the anchor and the panel resolves against
   the nearest positioned ancestor instead — usually the page — and lands in a
   corner far from the number it explains. */
export const Default = () => (
  <>
    <style dangerouslySetInnerHTML={{ __html: openCss }} />
    <div style={{ paddingBottom: 170, maxWidth: 280 }}>
      <HoverCardAnchor className="pv-open">
        <button className="jrk-stat jrk-card--interactive" style={{ width: '100%' }} aria-describedby="hca-default">
          <span className="jrk-stat__label">Treatment coverage</span>
          <span className="jrk-stat__value">
            3<span className="jrk-stat__unit">%</span>
          </span>
          <span className="jrk-stat__meta">of units on a 2×/yr cadence</span>
        </button>
        <HoverCard
          id="hca-default"
          header="Treatment coverage"
          rows={[
            { label: 'On cadence (≥2/yr)', value: '886' },
            { label: 'Visited once (below target)', value: '1,889' },
            { label: 'Not visited in 12 mo', value: '25,918' },
          ]}
          note="28,693 units · as of 29 Jul 2026"
        />
      </HoverCardAnchor>
    </div>
  </>
);

/* ONE ANCHOR PER TRIGGER. Two tiles that each explain themselves get two
   anchors, never one wrapped around both: the panel hangs from the anchor's box,
   so a shared anchor puts both panels under the pair rather than under the number
   each belongs to, and `:hover` on either tile reveals both. The trailing tile
   also takes `align="end"`, because there is no auto-flip — a measured position
   goes stale the moment anything reflows under it. */
export const OnePerTrigger = () => (
  <>
    <style dangerouslySetInnerHTML={{ __html: openCss }} />
    <div style={{ paddingBottom: 190 }}>
      <StatRow className="jrk-stat-row--split">
        <HoverCardAnchor className="pv-open">
          <button className="jrk-stat jrk-card--interactive" style={{ width: '100%' }} aria-describedby="hca-a">
            <span className="jrk-stat__label">Collected rent</span>
            <span className="jrk-stat__value">
              $4.21<span className="jrk-stat__unit">M</span>
            </span>
          </button>
          <HoverCard
            id="hca-a"
            header="Collected by cycle"
            rows={[
              { label: 'On time', value: '$3.94M' },
              { label: 'Late (1–15d)', value: '$0.21M' },
              { label: 'Late (16d+)', value: '$0.06M' },
            ]}
          />
        </HoverCardAnchor>
        <HoverCardAnchor className="pv-open">
          <button className="jrk-stat jrk-card--interactive" style={{ width: '100%' }} aria-describedby="hca-b">
            <span className="jrk-stat__label">Delinquency rate</span>
            <span className="jrk-stat__value">
              4.7<span className="jrk-stat__unit">%</span>
            </span>
          </button>
          <HoverCard
            id="hca-b"
            align="end"
            header="Delinquent balance"
            rows={[
              { label: '0–30 days', value: '$612,470' },
              { label: '31–60 days', value: '$289,100' },
              { label: '60+ days', value: '$98,240' },
            ]}
          />
        </HoverCardAnchor>
      </StatRow>
    </div>
  </>
);

/* WHAT THE ANCHOR IS FOR, shown by leaving it out. Same trigger, same panel, no
   `HoverCardAnchor` — and two things break at once. The panel resolves against
   whatever positioned box it happens to find (here the cell's own wrapper), so it
   no longer hangs off the number it explains; and the reveal never fires at all,
   because the rule that shows it is `.jrk-hovercard-anchor:hover` — the panel is
   only visible here because this preview forces it. Nothing errors either way.

   The clipping trap belongs to this pair too, and HoverCard's own card documents
   it: the panel escapes the anchor, so the first ancestor with `overflow: hidden`
   — a joined StatRow, an expandable card, a table wrapper — cuts it off. */
export const WithoutTheAnchor = () => (
  <>
    <style dangerouslySetInnerHTML={{ __html: openCss }} />
    {/* The padding reserves the space the panel would otherwise be clipped out of:
        it is absolutely positioned, so it never grows its own container. */}
    <div style={{ paddingBottom: 140 }}>
      <div className="pv-loose">
        <button
          className="jrk-stat jrk-card--interactive"
          style={{ width: 190, marginInlineStart: 130 }}
          aria-describedby="hca-loose"
        >
          <span className="jrk-stat__label">Occupancy</span>
          <span className="jrk-stat__value">
            93.8<span className="jrk-stat__unit">%</span>
          </span>
        </button>
        <HoverCard
          id="hca-loose"
          header="Occupancy by region"
          rows={[
            { label: 'Southeast', value: '96.1%' },
            { label: 'Midwest', value: '92.4%' },
            { label: 'Northeast', value: '89.8%' },
          ]}
        />
      </div>
    </div>
  </>
);
