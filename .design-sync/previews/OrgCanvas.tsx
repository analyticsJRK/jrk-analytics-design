import { useState } from 'react';
import { OrgCanvas, OrgChart, OrgNode, OrgGroup } from '@jrk/design';

/* Zoom and pan around a tree too wide for any screen. The canvas is the
   scroller, so the chart inside takes `scroll={false}` — two nested scrollers
   fight over every wheel event. Fit-to-width runs once on mount; after that the
   reader's zoom stands. Ctrl/⌘ + wheel zooms at the pointer, drag pans. */
export const Default = () => (
  <OrgCanvas hint="Ranks above the grouping take a tone, not a slot">
    <OrgChart label="Portfolio reporting structure" groupSolid scroll={false}>
      <OrgNode name="Jim Lippman" role="President" meta="96 props · 28,411 un" tone="inverse">
        <OrgNode name="Matt Sussman" role="EVP" meta="96 props · 28,411 un" tone="deep">
          {/* Nobody holds this rank: the box keeps the row, the line runs through. */}
          <OrgNode name="Max McCoy" role="SVP (acting VP)" meta="22 props" passThrough>
            <OrgNode name="Geneva Lacroix" role="Regional Manager" meta="3 props · 1,182 un" group={1} column>
              <OrgGroup label="WA">
                <OrgNode name="Boulders at Puget Sound" code="WST" meta="714 un" />
                <OrgNode name="Carrolls Creek Landing" code="CCL" meta="288 un" current />
              </OrgGroup>
              <OrgGroup label="CA">
                <OrgNode name="Parkside Glen" code="PAG" meta="180 un" />
              </OrgGroup>
            </OrgNode>
          </OrgNode>
          <OrgNode name="Jen Carothers" role="Regional Manager" meta="2 props · 616 un" group={2} column>
            <OrgGroup label="TX">
              <OrgNode name="Harbor Point" code="HPT" meta="412 un" />
              <OrgNode name="Cedar Grove" role="Open — no PM" code="CDG" meta="204 un" vacant />
            </OrgGroup>
          </OrgNode>
          <OrgNode name="Ed Sarti" role="Associate" meta="4 props · 1,050 un" tone="neutral">
            <OrgNode name="Lena Park" role="Regional Manager" meta="4 props · 1,050 un" group={3} />
          </OrgNode>
        </OrgNode>
      </OrgNode>
    </OrgChart>
  </OrgCanvas>
);

/* Drag a property onto a manager. The card is the drag source and the drop
   target — never the <li>, which spans the whole subtree. `dragging` on the
   chart dims everything but the valid targets for the length of the drag, and
   the target outline divides by the canvas zoom so it stays visible at 30%. */
export const DragToReassign = () => {
  const [owner, setOwner] = useState<Record<string, string>>({ WST: 'Geneva', HPT: 'Jen' });
  const [dragging, setDragging] = useState<string | null>(null);
  const [over, setOver] = useState<string | null>(null);
  const managers = ['Geneva', 'Jen'];
  return (
    <OrgCanvas hint="Drag a property onto a manager to reassign it" fitOnMount={false}>
      <OrgChart label="Reassign properties" groupSolid scroll={false} dragging={dragging !== null}>
        <OrgNode name="Matt Sussman" role="EVP" meta="2 managers" tone="deep">
          {managers.map((m, i) => (
            <OrgNode
              key={m}
              name={m}
              role="Regional Manager"
              meta={`${Object.values(owner).filter((o) => o === m).length} props`}
              group={i + 1}
              column
              dropTarget={dragging !== null && owner[dragging] !== m}
              dropOver={over === m}
              onDragOver={() => setOver(m)}
              onDragLeave={() => setOver(null)}
              onDrop={() => {
                if (dragging) setOwner({ ...owner, [dragging]: m });
                setDragging(null);
                setOver(null);
              }}
            >
              {Object.entries(owner)
                .filter(([, o]) => o === m)
                .map(([code]) => (
                  <OrgNode
                    key={code}
                    name={code === 'WST' ? 'Boulders at Puget Sound' : 'Harbor Point'}
                    code={code}
                    meta="property"
                    draggable
                    data-code={code}
                    onDragStart={() => setDragging(code)}
                    onDragEnd={() => setDragging(null)}
                  />
                ))}
            </OrgNode>
          ))}
        </OrgNode>
      </OrgChart>
    </OrgCanvas>
  );
};

/* More than eight groups: `palette="generated"` gives every group its own hue
   so no two managers share a card. It promises no repeats — not that twelve
   hues are separable, which no palette can promise. Every card stays labelled. */
export const GeneratedPalette = () => (
  <OrgCanvas>
    <OrgChart label="Twelve regional managers" groupSolid palette="generated" scroll={false} nodeWidth={128}>
      {Array.from({ length: 12 }, (_, i) => (
        <OrgNode key={i} name={`Manager ${i + 1}`} role="Regional Manager" meta={`group ${i + 1}`} group={i + 1} />
      ))}
    </OrgChart>
  </OrgCanvas>
);
