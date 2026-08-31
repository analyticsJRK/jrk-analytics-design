import { OrgChart, OrgNode, OrgGroup, Badge } from '@jrk/design';

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

/* THE NODE ITSELF CARRIES THE GROUP COLOUR instead of a keyline beside it.
   `groupFill` is a rendering choice over the same `rollup` mechanism — same
   slots, same order, same subtree cascade — so Atlanta and Tampa wear
   Southeast's tint without being told to, and the root card, which sits above
   the rollup, keeps the plain card plane because it has no group.

   FOUR REGIONS, DELIBERATELY. The fill is `chart.tint`, which the validator
   skips by design: adjacent tints hold dE 14.5 light / 17.1 dark for the first
   four slots and then break at the 4|5 pair (7.0 / 8.6, floor 10), so five
   groups warns in development. The keyline the default draws holds 22.3 / 16.5
   at any count and separates all eight by texture — if a reader has to tell six
   groups apart by colour, that is the variant that can do it.

   `current` keeps its group fill here and states currency on a border.accent
   edge instead (3.81:1 light / 5.26:1 dark) — the wash the plain card uses is
   the same colour as tint-1, so the two signals would collide. */
/* DEFAULT nodeWidth, not a wider one. Four groups at 188px overflowed the
   capture box and the fourth was sliced to a sliver down the right edge — the
   harness crops WIDE cells as silently as tall ones, and the org chart's own
   `.jrk-org-scroll` is what hides it (a screenshot cannot scroll). Each leaf
   costs nodeWidth + 2x gutter, so four cost 4 x 204 = 816px at 188 and 4 x 192 =
   768 at the 176 default, plus 16px per nesting level. Look at the sheet; the
   render check passes either way. */
export const FilledGroups = () => (
  <OrgChart label="Fund IV portfolio rollup" groupFill>
    <OrgNode name="JRK Fund IV" role="Closed-end · 2021 vintage" meta="$1.42B AUM · 37 assets" rollup>
      {/* The count is the toggle's label, and the default counts "reports" —
          right for a reporting line, wrong for a fund whose children are
          markets. */}
      <OrgNode name="Southeast" role="4 markets" meta="$612M · 14 assets" href="#" collapsible toggleLabel="2 markets">
        <OrgNode name="Atlanta" meta="$318M · 7 assets" />
        <OrgNode name="Tampa" meta="$294M · 7 assets" />
      </OrgNode>
      <OrgNode name="Midwest" role="3 markets" meta="$488M · 12 assets" href="#" current />
      <OrgNode
        name="Open position"
        role="Regional Director, Mountain West"
        meta="$320M · 11 assets"
        vacant
      />
      <OrgNode name="Northeast" role="2 markets" meta="$204M · 4 assets" href="#" />
    </OrgNode>
  </OrgChart>
);

/* THE PORTFOLIO LAYOUT: solid nodes over a terminal level that is a COLUMN
   rather than a fan. This is the shape a real property chart wants, and it uses
   two mechanisms the other examples do not.

   `groupSolid` fills the card with `chart.deep` — the SAME eight hues in the
   SAME searched order as the series palette, stepped down in lightness until
   WHITE clears 4.5:1 on every slot in both halves (worst 4.54:1 light, 4.58:1
   dark). That is why it exists: on `chart.categorical` no ink but black clears
   4.5:1 and white clears it on none, so rather than change the ink, the fill
   moved. Being a volume of the series palette rather than a second one is what
   let all the colourblind doctrine transfer — worst adjacent dE 15.9 / 18.4, the
   same all-pairs safe cap of 3, and all nine collapsing pairs still same-parity,
   so the same texture buckets separate every one. `npm run validate` gates it.

   `column` stacks a node's children in the node's own footprint with NO
   CONNECTORS. That is not a shortcut: a column sits directly under its parent at
   exactly the parent's width, so containment states the relationship, and that is
   a stronger claim than a line — a line can be traced to the wrong card in a
   thirty-card row and a box under a card cannot. Use it when a level's members
   are not compared with each other; the properties under one manager get looked
   up one at a time or counted, so fanning twelve of them out costs 2,300px and
   buys nothing.

   SLOTS ARE ASSIGNED BY NAME, NOT POSITION, and this chart is the case that
   requires it. `rollup` derives a slot from nth-child, so it can only colour the
   children of ONE node; here the managers hang off two different associates with
   no ordinal in common. `group={n}` lets the caller assign from identity instead
   — and what the caller takes on is the numbering: adjacency is guaranteed
   between CONSECUTIVE slots, so number groups in the order they will be READ
   across the level, by first appearance, never by a hash or an alphabetical key.

   TWO GROUPS AND A SHORT COLUMN, DELIBERATELY, and it is the same crop the
   FilledGroups note above records: the harness cannot scroll, so a wide chart
   loses its right-hand nodes silently. The real thing is thirty managers wide
   inside `.jrk-org-scroll`. */
export const PortfolioColumns = () => (
  <OrgChart label="JRK portfolio reporting structure" groupSolid>
    {/* The root sits ABOVE the rollup, so it has no group and would fall back to
        the plain card plane. It is put outside the palette on purpose —
        `--jrk-org-group-solid` and `--jrk-org-solid-ink` TOGETHER, because one
        alone gives white-on-white.

        `surface.inverse` is the pair to reach for, and it is right BECAUSE it
        flips rather than in spite of it. This card has to separate from
        `surface.default` — the plane every other card sits on — in both halves
        and under every skin, and an inverse plane is *defined* as the maximum
        step off the plane. Worst case across all four palettes x both themes:
        ink 13.96:1 on the fill, 12.91:1 of step against the panel.

        `surface.bannerDeep` looks like the better answer and is measurably the
        wrong one: stable dark navy in the BASE layer, but a skin owns its planes
        and vitrine sets it to #e9eceb in light — 1.025:1 off that skin's panel,
        so the card vanishes. It is a banner plane, and nothing about it promises
        a step against a card. */}
    <OrgNode
      name="Tom Manzo"
      role="President"
      meta="89 props · 28,460 un"
      style={{
        ['--jrk-org-group-solid' as string]: 'var(--jrk-surface-inverse)',
        ['--jrk-org-solid-ink' as string]: 'var(--jrk-text-inverse)',
      }}
    >
      <OrgNode name="Lawrence Baeck" role="SVP" meta="23 props · 7,183 un">
        <OrgNode name="Ed Sarti" role="Associate" meta="7 props · 2,182 un" group={1} column>
          <OrgGroup label="WA">
            <OrgNode name="Boulders at Puget Sound" code="WST" meta="714 units" href="#" />
            <OrgNode name="Carrolls Creek Landing" code="CCL" meta="288 units" href="#" />
            <OrgNode name="Silverdale Ridge" code="SVR" meta="118 units" href="#" />
          </OrgGroup>
          <OrgGroup label="CA">
            <OrgNode name="Parkside Glen" code="PAG" meta="180 units" href="#" />
          </OrgGroup>
        </OrgNode>
        <OrgNode name="Geneva Lacroix" role="Regional Manager" meta="5 props · 1,570 un" group={2} column>
          <OrgGroup label="LA">
            <OrgNode name="Delaneaux" code="DLX" meta="210 units" href="#" />
            <OrgNode name="Heights at Hammond" code="HAM" meta="336 units" href="#" />
            <OrgNode name="Indigo Park" code="IND" meta="330 units" href="#" />
          </OrgGroup>
          <OrgGroup label="FL">
            <OrgNode name="Terra Mar" code="TEM" meta="310 units" href="#" />
          </OrgGroup>
        </OrgNode>
      </OrgNode>
    </OrgNode>
  </OrgChart>
);
