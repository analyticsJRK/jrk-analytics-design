import { useState } from 'react';
import { OrgChart, OrgNode, Badge, Delta } from '@jrk/design';

/* One node. Always inside <OrgChart> — the chart owns the label, the scroll
   container and the card width; the node owns its own card and its children. */
export const Variants = () => (
  <OrgChart label="Node variants">
    <OrgNode name="Reports to" role="Every variant below hangs off this node">
      <OrgNode name="Plain" role="Regional Manager" meta="14 properties · 3,120 units" />
      <OrgNode name="Marcus Reed" role="Drills through" meta="Renders as a link" href="#" />
      <OrgNode
        name="Cedar Grove"
        role="With an aside"
        meta="204 units · 88.6% occupied"
        aside={<Badge tone="warning" size="sm">Under target</Badge>}
      />
      <OrgNode name="Open position" role="Open — posted 12 Jun" vacant />
    </OrgNode>
  </OrgChart>
);

/* `current` sets aria-current, which is what the styling keys off, so the
   treatment and what assistive tech reads cannot disagree. It wears the
   library's settled "this is the one" tinted wash — whose colour channels are
   all under 3:1 against the card, so THE SEMIBOLD NAME is the channel doing the
   work. It survives greyscale and both dichromacies; the wash does not. */
export const Current = () => (
  <OrgChart label="Whose reporting line this is">
    <OrgNode name="Dana Whitfield" role="VP, Asset Management" meta="37 properties" current>
      <OrgNode name="Marcus Reed" role="Regional Manager, Southeast" meta="14 properties" />
      <OrgNode name="Priya Nandi" role="Regional Manager, Midwest" meta="12 properties" />
    </OrgNode>
  </OrgChart>
);

/* `vacant` is the dashed, quieted card for an open post. The dash is redundant
   coding, NEVER the signal — say it in `role`, which is why omitting one warns
   in development. A dashed box with a greyed name and no words reads as a card
   that failed to load. */
export const Vacant = () => (
  <OrgChart label="Open positions">
    <OrgNode name="Dana Whitfield" role="VP, Asset Management" meta="37 properties">
      <OrgNode name="Marcus Reed" role="Regional Manager, Southeast" meta="14 properties" />
      <OrgNode name="Open position" role="Regional Manager, Mountain West" meta="11 properties" vacant />
    </OrgNode>
  </OrgChart>
);

/* `collapsible` gives the node a disclosure toggle, and the COUNT is the label.
   A bare caret leaves a collapsed node as a dead end; "12 properties" is still
   an answer while it is shut. The caret does not rotate, the same as the
   sidebar's — a swinging chevron promises the content lands directly below the
   control in a stack, and this one fans out a whole level.

   Uncontrolled here. Pass `collapsed` + `onCollapsedChange` to keep the open set
   in a URL, so an explored state can be cited by two people in a meeting. */
export const Collapsible = () => (
  <OrgChart label="Collapsible levels">
    <OrgNode name="Dana Whitfield" role="VP, Asset Management" meta="37 properties">
      <OrgNode
        name="Marcus Reed"
        role="Regional Manager, Southeast"
        meta="14 properties"
        collapsible
        toggleLabel="2 properties"
      >
        <OrgNode name="Harbor Point" meta="412 units" />
        <OrgNode name="Cedar Grove" meta="204 units" />
      </OrgNode>
      <OrgNode
        name="Priya Nandi"
        role="Regional Manager, Midwest"
        meta="12 properties"
        defaultCollapsed
        toggleLabel="4 properties"
      >
        <OrgNode name="Lakeside Commons" meta="318 units" />
        <OrgNode name="Maple Yards" meta="246 units" />
        <OrgNode name="Ninth & Rail" meta="180 units" />
        <OrgNode name="Prairie Walk" meta="402 units" />
      </OrgNode>
    </OrgNode>
  </OrgChart>
);

/* `stacked` is the escape valve for a wide fan, and it is why the horizontal
   default is safe to ship. Twelve peers side by side is 2,300px no screen holds
   and no reader can compare across; the same twelve down an indented spine fit
   in a column. Density resolves by disclosure, and this is that rule pointed
   sideways.

   LEAF CHILDREN ONLY — a stacked child with children of its own centres over
   its subtree and pulls off the spine. It warns in development. Note the toggle
   hangs off the spine here rather than centring under the card, because a
   stacked branch moves the parent card off the node's midpoint and every
   connector follows it. */
export const Stacked = () => (
  <OrgChart label="Midwest portfolio">
    <OrgNode name="Priya Nandi" role="Regional Manager, Midwest" meta="12 properties · 2,910 units" stacked>
      <OrgNode name="Lakeside Commons" meta="318 units · 96.1% occupied" />
      <OrgNode name="Maple Yards" meta="246 units · 91.4% occupied" />
      <OrgNode name="Ninth & Rail" meta="180 units · 93.8% occupied" />
      <OrgNode
        name="Prairie Walk"
        meta="402 units · 89.0% occupied"
        aside={<Delta value={-2.4} vs="prior month" />}
      />
    </OrgNode>
  </OrgChart>
);

/* `rollup` colours this node's children as groups — each child takes the next
   palette slot and its whole subtree inherits it, so you can see what rolls up
   into what. It appears as a keyline inside the card, not a wash: a wash would
   collide with `current` (accent.washHover and chart-tint-1 are the same colour)
   and the connectors must stay `text.muted`, since four of the eight hues sit
   under 3:1 on the light card and the lines are the one mark that has to read.

   The keyline carries hue AND texture — solid, dashed, dotted, double-rail,
   assigned ceil(slot/2) so every CVD-collapsing pair lands in a different
   bucket. That is what takes the first 8 groups from 9 unseparable pairs to 0.

   This cycles the categorical palette, which is banned everywhere else here.
   The ban protects IDENTITY — two chart lines sharing a colour cannot be told
   apart. Every node here is labelled and the tree draws the grouping, so the
   keyline is an accelerator, never the identity channel. Adjacent siblings are
   guaranteed distinct (dE 22.3 light / 16.5 dark, the pair the palette order was
   searched to maximise); reuse happens at distance 8. One rollup level per
   chart — nesting warns, because two rollups both start at slot 1.

   Kept to four leaves on purpose: the preview harness captures a cell at 900px
   and the tree scrolls rather than wraps, so a fifth leaf pushes it to 1024px
   and the card shows a cropped tree with no way to scroll a screenshot. */
export const Rollup = () => (
  <OrgChart label="Portfolio rollup by region">
    <OrgNode name="JRK Fund IV" role="All regions" meta="$1.42B AUM · 37 assets" rollup>
      <OrgNode name="Southeast" role="M. Reed" meta="$612M · 14 assets">
        <OrgNode name="Harbor Point" meta="412 units" />
        <OrgNode name="Cedar Grove" meta="204 units" />
      </OrgNode>
      <OrgNode name="Midwest" role="P. Nandi" meta="$488M · 12 assets">
        <OrgNode name="Lakeside Commons" meta="318 units" />
      </OrgNode>
      {/* A vacant seat KEEPS its keyline. The vacancy is about the post; the
          rollup is about the branch, and a region with no manager still has
          properties rolling into it. Dropping the colour here would also leave
          the children below wearing a group their own parent does not. */}
      <OrgNode name="Mountain West" role="Open — posted 12 Jun" meta="$320M · 11 assets" vacant>
        <OrgNode name="Summit at Red Rocks" meta="316 units" />
      </OrgNode>
    </OrgNode>
  </OrgChart>
);

/* The full encoding, eight groups, narrow nodes so the whole cycle fits one
   card. Read the keylines left to right: blue solid, orange solid, mint dashed,
   yellow dashed, purple dotted, pink dotted, teal rail, brown rail.

   The two channels are what make these eight mutually distinguishable. On hue
   alone, nine of these pairs are the same colour to a dichromat — orange|yellow
   is dE 0.8 — and every one of those pairs is separated here by texture, because
   collapsing pairs are same-parity and ceil(slot/2) always splits them. A ninth
   group would restart at blue solid.

   Every card carries a meta line deliberately: the keyline is only as tall as
   the card's text block, and on a name-only card that is ~18px — enough to
   render the textures but not enough to READ them at a glance, which defeats
   the one card whose job is to teach the encoding. */
export const RollupAllEight = () => (
  <OrgChart label="All eight rollup slots" nodeWidth={88}>
    <OrgNode name="Portfolio" meta="37 assets" rollup>
      <OrgNode name="North" meta="6 assets" />
      <OrgNode name="South" meta="5 assets" />
      <OrgNode name="East" meta="4 assets" />
      <OrgNode name="West" meta="6 assets" />
      <OrgNode name="Central" meta="3 assets" />
      <OrgNode name="Coastal" meta="5 assets" />
      <OrgNode name="Gulf" meta="4 assets" />
      <OrgNode name="Plains" meta="4 assets" />
    </OrgNode>
  </OrgChart>
);

/* Three groups or fewer never leaves slots 1-3 — the palette's measured
   all-pairs safe cap — so it is CVD-safe on hue alone, before texture even
   helps. Texture then makes the guarantee hold all the way to 8. */
export const RollupSafeCount = () => (
  <OrgChart label="Three regions">
    <OrgNode name="All regions" meta="37 assets" rollup>
      <OrgNode name="Southeast" meta="14 assets" />
      <OrgNode name="Midwest" meta="12 assets" />
      <OrgNode name="Mountain West" meta="11 assets" />
    </OrgNode>
  </OrgChart>
);

/* `group` takes the slot EXPLICITLY, for a chart whose grouping is not "children
   of one node". `rollup` counts nth-child, so it can only ever express that one
   shape; colour a chart by a level three deep and the groups are spread across
   many parents' child lists with no ordinal in common.

   Here the same regional manager reports to two different VPs and wears ONE
   colour under both, which is what identity-assigned slots buy and what no
   arrangement of `rollup` can give: two rollups would restart at slot 1 and
   stand two slot-1 subtrees side by side.

   The caller takes on the numbering, and the rule is the palette's: number
   groups in the order they will be READ across the level, because adjacency is
   guaranteed between CONSECUTIVE slots and nothing else. Slot 9 is slot 1. */
export const ExplicitGroup = () => (
  <OrgChart label="Coloured by regional manager">
    <OrgNode name="Dana Whitfield" role="EVP" meta="37 assets">
      <OrgNode name="Ana Ruiz" role="VP, Asset Management" meta="20 assets">
        <OrgNode name="Marcus Reed" role="Regional Manager" meta="14 assets" group={1} />
        <OrgNode name="Priya Nandi" role="Regional Manager" meta="6 assets" group={2} />
      </OrgNode>
      <OrgNode name="Tomas Vega" role="VP, Asset Management" meta="17 assets">
        {/* Same person, same slot, a different parent. */}
        <OrgNode name="Marcus Reed" role="Regional Manager" meta="9 assets" group={1} />
        <OrgNode name="Iris Okonjo" role="Regional Manager" meta="8 assets" group={3} />
      </OrgNode>
    </OrgNode>
  </OrgChart>
);

/* Controlled, so the open set can live in a URL. Every explored state being
   addressable is what separates exploration from a toy: two people in a meeting
   have to be able to reach the same screen, and an audit has to be reproducible
   six months later. */
export const Controlled = () => {
  const [open, setOpen] = useState(true);
  return (
    <OrgChart label="Controlled disclosure">
      <OrgNode name="Dana Whitfield" role="VP, Asset Management" meta="37 properties">
        <OrgNode
          name="Marcus Reed"
          role="Regional Manager, Southeast"
          meta="14 properties"
          collapsed={!open}
          onCollapsedChange={(next) => setOpen(!next)}
          toggleLabel="2 properties"
        >
          <OrgNode name="Harbor Point" meta="412 units" />
          <OrgNode name="Cedar Grove" meta="204 units" />
        </OrgNode>
      </OrgNode>
    </OrgChart>
  );
};
