import { OrgChart, OrgNode, OrgGroup } from '@jrk/design';

/* A NAMED SUBDIVISION INSIDE A `<OrgNode column>` — the states under a regional
   manager, the vintages under a fund.

   It exists because colour is already spent. Every tile in a column is the same
   hue, and that hue names the ROLLUP the column belongs to, so the subdivision
   inside it cannot also be carried by colour. It cannot be carried by whitespace
   either: the gap between groups and the gap between tiles would then be the only
   difference, and both are a few pixels in a column that scrolls. So the group
   gets a bracket and a label.

   THE LABEL IS NEUTRAL INK, NOT THE GROUP HUE, and that is measured rather than
   cautious. A `chart.deep` fill is 4.54:1 on the light card and 3.29:1 on the dark
   one, so it can be the box's EDGE (3:1, the floor for a graphical object) and
   cannot be its TEXT (4.5:1) in dark — in all eight slots, not some of them. The
   edge takes the hue and the ink takes the ink. Nothing is lost: the hue is
   already stated on every tile inside the box, and the label carries the one fact
   nothing else on screen does.

   In markup it is an `<li>` holding a `<ul>`, so a screen-reader user gets the
   nesting and the state name in place of the bracket they cannot see. Flattening
   it would hand them two hundred properties in one run with the state codes
   buried in it. */
export const Default = () => (
  <OrgChart label="Pacific Northwest portfolio" scroll={false}>
    <OrgNode name="Ed Sarti" role="Associate" meta="7 properties · 2,182 units" column>
      <OrgGroup label="WA">
        <OrgNode name="Boulders at Puget Sound" code="WST" meta="714 units" />
        <OrgNode name="Carrolls Creek Landing" code="CCL" meta="288 units" />
        <OrgNode name="Centennial" code="CNT" meta="417 units" />
      </OrgGroup>
      <OrgGroup label="CA">
        <OrgNode name="Parkside Glen" code="PAG" meta="180 units" />
      </OrgGroup>
    </OrgNode>
  </OrgChart>
);

/* IT TAKES THE ROLLUP COLOUR AND CANNOT DISAGREE WITH IT. The box's edge reads
   `--jrk-org-group-solid`, a custom property set on the grouped node above and
   inherited, so a group inside a rollup is edged in that rollup's hue with
   nothing passed in and no way to give it a colour its parent does not have.

   `code` is the identifier line, and it is not a second `role`: a manager card
   says what the person does, a property tile says what the asset is called in the
   system of record. It is uppercased and tracked by CSS rather than in the data,
   so the value stays copyable as whatever it actually is.

   NOTE `compact` APPEARS NOWHERE. `column` sets the tile size for its children
   and it inherits through the group, because the size is a property of the LEVEL
   — one full-size card among eleven tiles is a third taller than its neighbours,
   which is the raggedness the column layout exists to remove. */
export const InsideARollup = () => (
  <OrgChart label="Regional rollup" groupSolid scroll={false}>
    <OrgNode name="Lawrence Baeck" role="SVP" meta="23 properties · 7,183 units">
      <OrgNode name="Ed Sarti" role="Associate" meta="7 properties · 2,182 units" group={1} column>
        <OrgGroup label="WA">
          <OrgNode name="Boulders at Puget Sound" code="WST" meta="714 units" href="#" />
          <OrgNode name="Silverdale Ridge" code="SVR" meta="118 units" href="#" />
        </OrgGroup>
        <OrgGroup label="CA">
          <OrgNode name="Parkside Glen" code="PAG" meta="180 units" href="#" />
        </OrgGroup>
      </OrgNode>
      <OrgNode name="Geneva Lacroix" role="Regional Manager" meta="5 properties · 1,570 units" group={2} column>
        <OrgGroup label="LA">
          <OrgNode name="Delaneaux" code="DLX" meta="210 units" href="#" />
          <OrgNode name="Heights at Hammond" code="HAM" meta="336 units" href="#" />
        </OrgGroup>
        <OrgGroup label="FL">
          <OrgNode name="Terra Mar" code="TEM" meta="310 units" href="#" />
        </OrgGroup>
      </OrgNode>
    </OrgNode>
  </OrgChart>
);
