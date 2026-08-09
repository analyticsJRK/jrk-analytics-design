import { OrgChart, OrgNode, Badge } from '@jrk/design';

/* Hierarchy runs DOWN, peers fan OUT. Nesting in the JSX is nesting in the
   chart — every connector is derived from the layout, so there are no
   coordinates to pass and nothing to keep in sync.

   `label` is required. "A list of 14 items" is not an answer to what the reader
   is looking at, and this renders a nested <ul> rather than role="tree": a tree
   role promises roving tabindex and arrow-key navigation, and a claimed tree
   that ignores arrow keys is worse than the plain list a screen-reader user
   already knows how to walk. */
export const Default = () => (
  <OrgChart label="Asset Management reporting structure">
    <OrgNode
      name="Dana Whitfield"
      role="VP, Asset Management"
      meta="37 properties · 8,412 units"
      current
    >
      <OrgNode name="Marcus Reed" role="Regional Manager, Southeast" meta="14 properties · 3,120 units">
        <OrgNode name="Harbor Point" role="L. Okafor" meta="412 units · 94.2% occupied" />
        <OrgNode
          name="Cedar Grove"
          role="R. Diaz"
          meta="204 units · 88.6% occupied"
          aside={<Badge tone="warning" size="sm">Under target</Badge>}
        />
      </OrgNode>
      <OrgNode name="Priya Nandi" role="Regional Manager, Midwest" meta="12 properties · 2,910 units" />
      <OrgNode
        name="Open position"
        role="Regional Manager, Mountain West"
        meta="11 properties · 2,382 units"
        vacant
      />
    </OrgNode>
  </OrgChart>
);

/* The card carries a figure, because an org chart in this library is a chart —
   a node with only a name is a diagram. `meta` is the figure line; `aside`
   takes a Badge, Status or Delta when the node needs a flag rather than a
   number. */
export const PortfolioStructure = () => (
  <OrgChart label="Fund structure" nodeWidth={200}>
    <OrgNode name="JRK Fund IV" role="Closed-end · 2021 vintage" meta="$1.42B AUM · 37 assets">
      <OrgNode name="Southeast" role="4 markets" meta="$612M · 14 assets" />
      <OrgNode name="Midwest" role="3 markets" meta="$488M · 12 assets" />
      <OrgNode
        name="Mountain West"
        role="2 markets"
        meta="$320M · 11 assets"
        aside={<Badge tone="critical" size="sm">Under review</Badge>}
      />
    </OrgNode>
  </OrgChart>
);

/* `scroll` is on by default — a wide fan is the one thing here that legitimately
   scrolls sideways, and a centred tree that outgrows its container would
   otherwise be clipped on the LEFT, where scrolling can never reach it. Turn it
   off only when the chart is known to fit or an ancestor already scrolls.

   Depth is the case that does NOT scroll: it resolves by disclosure, the way
   everything else in this library resolves height. */
export const FitsWithoutScrolling = () => (
  <OrgChart label="Regional team" scroll={false} nodeWidth={160}>
    <OrgNode name="Marcus Reed" role="Regional Manager" meta="14 properties">
      <OrgNode name="Harbor Point" meta="412 units" />
      <OrgNode name="Cedar Grove" meta="204 units" />
    </OrgNode>
  </OrgChart>
);
