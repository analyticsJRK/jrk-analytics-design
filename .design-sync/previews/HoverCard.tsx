import { HoverCard, HoverCardAnchor, Stat, StatRow } from '@jrk/design';

/* A capture harness, not a component API. The panel is revealed by
   `.jrk-hovercard-anchor:hover` / `:focus-within`, and a screenshot does neither
   — so without this every card below shows a stat tile above an empty gap, which
   documents the trigger and not the component. It forces the revealed state on
   and touches nothing else. Same move NavMenuSeparator's preview makes for a
   `position: fixed` panel. */
const openCss = `
.pv-open .jrk-hovercard {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
  transition-delay: 0s;
}
`;

/* The breakdown behind a headline number, revealed on hover AND on focus.
   The trigger is a real <button> and names the panel with aria-describedby —
   opening on hover alone makes the figures reachable only with a pointer, which
   is the difference between a disclosure and a decoration. */
export const Default = () => (
  <div style={{ paddingBottom: 180, maxWidth: 280 }}>
    <style dangerouslySetInnerHTML={{ __html: openCss }} />
    <HoverCardAnchor className="pv-open">
      <button className="jrk-stat jrk-card--interactive" style={{ width: '100%' }} aria-describedby="hc-default">
        <span className="jrk-stat__label">Treatment coverage</span>
        <span className="jrk-stat__value">
          3<span className="jrk-stat__unit">%</span>
        </span>
        <span className="jrk-stat__meta">of units on a 2×/yr cadence</span>
      </button>
      <HoverCard
        id="hc-default"
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
);

/* `align="end"` for a tile at the trailing edge of a row, `side="above"` for one
   near the foot of the page. There is no auto-flip: a measured position goes
   stale the moment anything reflows under it, so the author who knows where the
   tile sits says so. */
export const Placement = () => (
  <div style={{ paddingBottom: 200 }}>
    <style dangerouslySetInnerHTML={{ __html: openCss }} />
    <StatRow className="jrk-stat-row--split">
      <HoverCardAnchor className="pv-open">
        <button className="jrk-stat jrk-card--interactive" style={{ width: '100%' }} aria-describedby="hc-a">
          <span className="jrk-stat__label">Collected rent</span>
          <span className="jrk-stat__value">
            $4.21<span className="jrk-stat__unit">M</span>
          </span>
        </button>
        <HoverCard
          id="hc-a"
          header="Collected by cycle"
          rows={[
            { label: 'On time', value: '$3.94M' },
            { label: 'Late (1–15d)', value: '$0.21M' },
            { label: 'Late (16d+)', value: '$0.06M' },
          ]}
        />
      </HoverCardAnchor>
      <HoverCardAnchor className="pv-open">
        <button className="jrk-stat jrk-card--interactive" style={{ width: '100%' }} aria-describedby="hc-b">
          <span className="jrk-stat__label">Delinquency rate</span>
          <span className="jrk-stat__value">
            4.7<span className="jrk-stat__unit">%</span>
          </span>
        </button>
        <HoverCard
          id="hc-b"
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
);

/* THE CLIPPING TRAP. The panel is absolutely positioned and escapes its anchor,
   so any ancestor with `overflow: hidden` cuts it off. In this library that is
   the JOINED <StatRow> (shown here — the panel is clipped at the band's edge),
   the expandable card, and the table wrapper. Nothing errors. Use the split row,
   or put the anchor outside the clip. */
export const ClippedByAJoinedBand = () => (
  <div style={{ paddingBottom: 120 }}>
    <style dangerouslySetInnerHTML={{ __html: openCss }} />
    <StatRow>
      <HoverCardAnchor className="pv-open">
        <button className="jrk-stat jrk-card--interactive" style={{ width: '100%' }} aria-describedby="hc-clip">
          <span className="jrk-stat__label">Occupancy</span>
          <span className="jrk-stat__value">
            93.8<span className="jrk-stat__unit">%</span>
          </span>
        </button>
        <HoverCard
          id="hc-clip"
          header="Occupancy by region"
          rows={[
            { label: 'Southeast', value: '96.1%' },
            { label: 'Midwest', value: '92.4%' },
            { label: 'Northeast', value: '89.8%' },
          ]}
        />
      </HoverCardAnchor>
      <Stat label="Units" value="8,412" />
    </StatRow>
  </div>
);
