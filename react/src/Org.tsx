import { Children, createContext, isValidElement, useContext, useId, useState, type CSSProperties, type ReactNode } from 'react';
import { Icon } from './Icon';
import { cx } from './utils';

/* Tracks whether a grouping is already in force above, AND WHICH KIND, because the
 * two kinds nest differently and treating them alike makes the guard cry wolf.
 *
 *   'rollup'  slots derived from nth-child. A second one below restarts the
 *             palette at slot 1, so branch B's first child can land beside
 *             branch A's last wearing the same colour — the one case that breaks
 *             the adjacency guarantee the whole scheme rests on.
 *   'group'   slots assigned by the caller from the group's identity. There is
 *             exactly ONE mapping from group to slot in the chart, so a grouped
 *             node inside another grouped node CANNOT collide — the caller has
 *             already guaranteed what nth-child cannot.
 *
 * NESTED `group` IS THEREFORE LEGITIMATE, and it is not a corner case: a person
 * who holds two consecutive levels is one node wearing both, so a chart coloured
 * by the lower level has that node grouped with more grouped nodes beneath it.
 * Warning on it fired nine times on one real chart, which is how a warning stops
 * being read.
 *
 * Context rather than a child walk, because the nesting can be at any depth. */
type Grouping = 'none' | 'rollup' | 'group';
const InRollup = createContext<Grouping>('none');

/* Whether the chart draws groups as FILLS rather than keylines. Only the dev
 * warning needs it — the styling is a descendant selector off the root class —
 * but the safe group count differs between the two variants, so the warning
 * cannot be written without knowing which one is on. */
const GroupFill = createContext(false);

/* Whether the cards at this depth are the COMPACT tile rather than the full card.
 *
 * Set by `<OrgNode column>` for its own children and inherited from there, so a
 * caller writes `compact` nowhere and a two-hundred-property terminal level
 * cannot end up half one size and half the other. That is the whole reason it is
 * context and not a prop each tile repeats: the size is a property of the LEVEL,
 * and a level with one full-size card in it has a tile a third taller than its
 * eleven neighbours, which is exactly the raggedness the column layout exists to
 * remove.
 *
 * `compact` on a node still wins in both directions — pass it to opt a stray card
 * in, or `compact={false}` to opt one out. */
const CompactCards = createContext(false);

/* Adjacent tints stop being distinguishable at the 4|5 pair: dE 7.0 light / 8.6
 * dark against validate's floor of 10, where the first four are 14.5 / 17.1. The
 * marks the keyline uses hold 22.3 / 16.5 at every count, which is why this
 * threshold belongs to the filled variant alone. */
const GROUP_FILL_SAFE = 4;

const warnGroupFill = (count: number, where: string) => {
  if (count <= GROUP_FILL_SAFE) return;
  console.warn(
    `[jrk] ${where} with groupFill has ${count} groups. Adjacent tints are only ` +
      `distinguishable to ${GROUP_FILL_SAFE} (slots 4|5 measure dE 7.0 light / 8.6 dark, floor 10), ` +
      'so two neighbouring groups can read as one colour. The default keyline holds ' +
      'adjacency at any count and separates all 8 by texture — drop groupFill, or make ' +
      'sure nothing depends on telling the fills apart.',
  );
};

/* Org chart — hierarchy runs DOWN, peers fan OUT.
 *
 * Reporting structure, portfolio structure, entity ownership: all the same
 * shape. Nesting in the JSX is nesting in the chart; the CSS derives every
 * connector from the layout, so there is nothing to measure and no coordinates
 * to pass in.
 *
 *   <OrgChart label="Reporting structure">
 *     <OrgNode name="Dana Whitfield" role="VP, Asset Management" current
 *              meta="37 properties · 8,412 units">
 *       <OrgNode name="Marcus Reed" role="Regional Manager, Southeast" />
 *     </OrgNode>
 *   </OrgChart>
 *
 * It renders a nested <ul>, NOT role="tree". A tree role promises roving
 * tabindex and arrow-key navigation between siblings, none of which this
 * library implements, and a claimed tree that ignores arrow keys is worse for a
 * screen-reader user than the plain nested list they already know. Disclosure
 * is the ordinary button + aria-expanded + aria-controls pattern instead — fully
 * specified, and something the component can actually deliver. See
 * css/components/org.css for the geometry and the connector's contrast note. */

export interface OrgChartProps {
  /** Names the structure for assistive tech, and it is not optional — "a list
   *  of 14 items" is not an answer to what the reader is looking at. */
  label: string;
  /** Card width. Everything else in the layout is derived from it. */
  nodeWidth?: number | string;
  /** Wrap in a horizontally scrolling container. On by default: a wide fan is
   *  the one thing here that legitimately scrolls sideways. Turn it off when the
   *  chart is known to fit, or when an ancestor already scrolls. */
  scroll?: boolean;
  /** Colour the chart's ROOTS as rollup groups — the same palette, textures and
   *  subtree cascade as `<OrgNode rollup>`, hung on the root list rather than on
   *  a node.
   *
   *  This exists for the MULTI-ROOT chart, which is the one case the node-level
   *  prop cannot reach. A chart with a single root hangs the rollup on that root
   *  and colours the level below it. A chart with several roots — an org with no
   *  single head, or one whose top level the reader filtered away — has no
   *  parent node to hang it from, and putting `rollup` on each root instead
   *  restarts the palette at slot 1 per root, which stands two slot-1 subtrees
   *  side by side. That adjacency is the one thing the colouring does not
   *  survive. The root list is the single parent those roots do not otherwise
   *  have, so it carries the grouping.
   *
   *  Still ONE per chart: use this or a node's `rollup`, never both. Nesting
   *  warns in development. */
  rollup?: boolean;
  /** Draw each rollup group as a FILLED CARD instead of a keyline.
   *
   *  A rendering choice over the same rollup mechanism — same slots, same order,
   *  same subtree cascade — so it does nothing on its own: with no `rollup`
   *  anywhere the chart renders exactly as it does without this prop.
   *
   *  It is the WEAKER of the two at telling groups apart, and knowingly. The fill
   *  has to sit under three levels of ink, which rules the saturated marks out
   *  (no ink but black clears 4.5:1 on them, and the focus ring measures 1.26:1
   *  on one slot) and leaves the pastel `chart.tint` set, which the validator
   *  skips by design. Measured, both themes, against the keyline's marks:
   *
   *  | | keyline | filled |
   *  |---|---|---|
   *  | worst adjacent pair | dE 22.3 / 16.5 | dE 4.5 / 8.6 |
   *  | adjacency guaranteed to | any count | 4 groups |
   *  | all pairs guaranteed to | 3 groups | 2 groups |
   *  | 8 groups | 0 unseparable pairs | 18 / 16 |
   *
   *  So: fine at four groups or fewer, and past that the fill is decoration over
   *  a tree that already draws the grouping. Warns in development at five. If a
   *  reader has to tell six groups apart by colour, use the keyline — that is
   *  what it is the default for. */
  groupFill?: boolean;
  /** Draw each rollup group as a SOLID CARD in the group's own colour, under
   *  white ink.
   *
   *  The third rendering of the one rollup mechanism. It was built for PAPER —
   *  `groupFill`'s tints are pastel by construction, so they carry no weight at
   *  the 35-40% scale an 11x17 sheet needs and wash out under a laser printer's
   *  lighter dot — and it is now also what the dense terminal-level layout uses
   *  on screen, because a filled card at the head of a column of tiles has to be
   *  its own kind of object rather than a card wearing a background.
   *
   *  THE FILL IS `chart.deep`, NOT `chart.categorical`, and that distinction is
   *  the one thing to carry away. It is the SAME eight hues in the SAME searched
   *  order, stepped down in lightness until white clears 4.5:1 on every slot in
   *  both halves — so it is a VOLUME of the series palette rather than a second
   *  palette, and every colourblind property transfers: worst adjacent dE 15.9
   *  light / 18.4 dark, all-pairs safe cap 3 (identical to the marks), and all
   *  nine collapsing pairs still same-parity, so the texture bucketing separates
   *  every one and the first eight groups stay fully distinguishable. `npm run
   *  validate` gates all of it.
   *
   *  It reads better than the tints and it is not free: measured against
   *  `groupFill`, the all-pairs safe cap is 3 slots against 2 and at eight groups
   *  0 unseparable pairs against 18. What it spends is the card's three levels of
   *  ink, which collapse to ONE — white, which is the only ink that clears 4.5:1
   *  on all eight deep fills in both themes — so name, role and figure separate
   *  by size and weight alone. If a consumer flattens those, this variant has
   *  nothing left.
   *
   *  A DEEP FILL BOUNDS ITSELF, 4.54:1 on the light card and 3.29:1 on the dark
   *  one, so a filled card is a shape without an edge. It keeps a 1px white
   *  hairline anyway, and that is not decoration: two tiles of the same hue
   *  stacked flush in a `column` have a 1.00:1 fill step between them and the
   *  hairline is the only thing there. And a vacant seat drops the fill and keeps
   *  the colour on its dashed edge, because a dash cannot be read over a
   *  saturated plane.
   *
   *  A caller may override `--jrk-org-group-solid` and `--jrk-org-solid-ink`
   *  together on a node to put a card outside the palette — a navy president, a
   *  charcoal holding company. Together: one alone gives white-on-yellow or
   *  white-on-white. `--jrk-org-group` still works in that slot and still gets
   *  the bright mark, which is the pre-existing bargain rather than the good one.
   *
   *  Mutually exclusive with `groupFill` — they are two renderings of one thing,
   *  and both classes on one list is a coin toss decided by source order. Warns in
   *  development. */
  groupSolid?: boolean;
  children: ReactNode;
  className?: string;
}

export function OrgChart({
  label, nodeWidth, scroll = true, rollup, groupFill, groupSolid, children, className,
}: OrgChartProps) {
  if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
    if (rollup && groupFill) warnGroupFill(Children.toArray(children).length, '<OrgChart rollup>');
    /* No count threshold for the solid variant, because it does not have one: the
       marks hold adjacency at every count, which is the whole reason it exists.
       What DOES need saying is picking both, which is not a degradation but an
       undefined result. */
    if (groupFill && groupSolid) {
      console.warn(
        '[jrk] <OrgChart> has both groupFill and groupSolid. They are two renderings of one ' +
          'rollup and which wins is decided by source order in the stylesheet, not by this ' +
          'prop. Pick one: groupFill for a screen, groupSolid for print.',
      );
    }
  }

  const tree = (
    <ul
      /* `jrk-org__branch--rollup` on the root <ul> rather than a modifier of its
         own. The palette rules select `.jrk-org__branch--rollup >
         .jrk-org__node`, and the root list's children ARE `.jrk-org__node`,
         exactly like a branch's — a separate class would mean eight more
         nth-child rules that had to stay in step with the branch's forever. */
      className={cx(
        'jrk-org',
        rollup && 'jrk-org__branch--rollup',
        /* On the ROOT, not on the branch: the fill is a chart-wide rendering
           choice and the CSS reaches every card from here by descent. Putting it
           on a branch would leave a rollup hung on a node unstyled. */
        groupFill && 'jrk-org--group-fill',
        /* Same reasoning as the fill above — root, not branch, so every card is
           reachable by descent. */
        groupSolid && 'jrk-org--group-solid',
        className,
      )}
      aria-label={label}
      style={
        nodeWidth
          ? { ['--jrk-org-node' as string]: typeof nodeWidth === 'number' ? `${nodeWidth}px` : nodeWidth }
          : undefined
      }
    >
      {/* Seeds the nesting guard, so a node that also sets `rollup` inside a
          root-grouped chart warns rather than quietly laying a second palette
          over the first. */}
      <InRollup.Provider value={rollup ? 'rollup' : 'none'}>
        <GroupFill.Provider value={Boolean(groupFill)}>{children}</GroupFill.Provider>
      </InRollup.Provider>
    </ul>
  );

  return scroll ? <div className="jrk-org-scroll">{tree}</div> : tree;
}

export interface OrgNodeProps {
  name: ReactNode;
  /** The position, not the person. Keep it to one line where you can — a row of
   *  leaf cards equalises to the tallest, so a two-line role sets the height for
   *  every peer beside it. */
  role?: ReactNode;
  /** The IDENTIFIER — a property code, a fund code, a cost centre. Occupies the
   *  same middle line as `role`, and a card takes one or the other: a manager
   *  card says what the person does, a property tile says what the asset is
   *  called in the system of record.
   *
   *  Uppercased and tracked by CSS, not by the data, so the value stays copyable
   *  as whatever it actually is. Pass it as it is stored. */
  code?: ReactNode;
  /** The figure the node carries: "37 properties · 8,412 units". An org chart in
   *  this library is a chart; a node with no figure is a diagram. */
  meta?: ReactNode;
  /** Trailing slot for a <Badge>, <Status> or <Delta>. */
  aside?: ReactNode;
  /** The one the chart is ABOUT. Sets aria-current, which is what the styling
   *  keys off, so the treatment and what assistive tech reads cannot disagree. */
  current?: boolean;
  /** An open position. The dashed edge is redundant coding, never the signal —
   *  say so in `role` ("Open — posted 12 Jun"), which this warns about. */
  vacant?: boolean;
  /** Drill through to the person or property. */
  href?: string;
  onClick?: () => void;
  /** Stack this node's children down an indented spine instead of fanning them
   *  out. The escape valve for a wide fan — twelve peers side by side is 2,300px
   *  no screen holds. LEAF CHILDREN ONLY; warns in development otherwise. */
  stacked?: boolean;
  /** Stack this node's children INSIDE this node's own footprint, with no
   *  connectors drawn at all, and render them as compact tiles.
   *
   *  The third layout for a level, and the one for a TERMINAL one. `stacked`
   *  indents children away from the parent and then spends a spine reconnecting
   *  them; this never separates them, so there is nothing to reconnect — the
   *  column sits directly under the card at exactly the card's width, and
   *  containment states the relationship. That is a stronger statement than a
   *  line, because a line can be traced to the wrong card in a thirty-card row
   *  and a box under a card cannot.
   *
   *  Use it when a level's members are NOT compared with each other: twelve
   *  properties under a regional manager get looked up one at a time or counted,
   *  so fanning them out buys nothing and costs 2,300px. Five direct reports are
   *  compared, and they take the default.
   *
   *  It implies `compact` on its children (see `compact`), which is the half of
   *  it that makes the density pay. LEAF CHILDREN ONLY — apart from `<OrgGroup>`,
   *  which is what a column is normally filled with; anything else with children
   *  of its own is a subtree with no drawn hierarchy, and this warns in
   *  development. */
  column?: boolean;
  /** Render this node's card as the COMPACT tile — one rung down in type and
   *  padding on every axis, with the name clamped to two lines.
   *
   *  Rarely passed by hand: `column` sets it for its children and it inherits
   *  from there, because the size is a property of the LEVEL and one full-size
   *  card among eleven tiles is a third taller than its neighbours. Pass it
   *  explicitly to opt a stray card in, or `compact={false}` to opt one out. */
  compact?: boolean;
  /** Colour this node's children as rollup groups: each child takes the next
   *  palette slot and its whole subtree inherits it, so a reader can see what
   *  rolls up into what.
   *
   *  The keyline carries TWO channels — hue and texture (solid / dashed /
   *  dotted / double-rail, assigned `ceil(slot / 2)`) — which is what makes the
   *  **first 8 groups fully distinguishable**, including under both
   *  dichromacies. Hue alone leaves 9 unseparable pairs in those 8; with texture
   *  it is 0. Adjacent siblings never collide at any count.
   *
   *  Past 8, hue and texture repeat together — group 9 is group 1 exactly. That
   *  is a deliberate trade: shifting texture on a second lap would remove the
   *  repeats but introduce CVD collisions instead, and an exact repeat is
   *  visible to everyone while a CVD collision is invisible to the author. The
   *  hard ceiling is 3 x textures = 12, since only three hues here are pairwise
   *  CVD-safe.
   *
   *  It is still an accelerator, never the identity channel — every card is
   *  labelled and the tree draws the grouping regardless.
   *
   *  `<OrgChart groupFill>` draws these same groups as filled cards instead, at a
   *  measured cost in separation — see that prop.
   *
   *  ONE PER CHART; nesting warns in development. */
  rollup?: boolean;
  /** Put this node in rollup group `n` EXPLICITLY, instead of letting a parent's
   *  `rollup` derive it from position. 1-based; cycles at 8, so 9 is 1 again.
   *  Its subtree inherits the colour exactly as it does under `rollup`, because
   *  the mechanism is the same custom property.
   *
   *  This is for a chart grouped by something other than "who reports to this
   *  node". `rollup` counts children within ONE parent's list, so it can only
   *  express that one grouping; colour a chart by the regional manager three
   *  levels down and the groups are scattered across nine parents' lists with no
   *  ordinal in common. Here the CALLER knows the grouping — it is the thing it
   *  asked to colour by — so it assigns the slot from the group's identity and
   *  one person gets one colour wherever they appear.
   *
   *  WHAT YOU TAKE ON BY USING IT. Adjacency is guaranteed between CONSECUTIVE
   *  slots and nothing else (see `rollup`), so number groups in the order they
   *  will be READ across a level — by first appearance in render order, never by
   *  a hash or an alphabetical key, or you forfeit the one guarantee the palette
   *  order was searched for.
   *
   *  Use this or `rollup`, never both in one chart: two mappings over one palette
   *  is the same collision `rollup` warns about. Nesting warns in development. */
  group?: number;
  /** Give the node a disclosure toggle. Ignored when it has no children. */
  collapsible?: boolean;
  /** Uncontrolled initial state. Implies `collapsible`. */
  defaultCollapsed?: boolean;
  /** Controlled state. Pass with `onCollapsedChange` to keep the open set in a
   *  URL — an explored state that cannot be cited is worse than a static one. */
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  /** Overrides the toggle's label. The default counts the children, because a
   *  bare caret leaves a collapsed node as a dead end rather than an answer. */
  toggleLabel?: ReactNode;
  children?: ReactNode;
  className?: string;
  /** Inline style on the CARD, the same element `className` lands on.
   *
   *  It exists for one job the component cannot do from a prop: putting a node
   *  OUTSIDE the rollup palette under `groupSolid`, by setting
   *  `--jrk-org-group-solid` and `--jrk-org-solid-ink` together. A president's
   *  card, a holding company, the two levels above the rollup — those are not
   *  palette slots and numbering them as slots would steal a colour from a group
   *  that needs it.
   *
   *  SET BOTH OR NEITHER. One alone gives white-on-white or white-on-yellow, and
   *  nothing checks it.
   *
   *  `surface.inverse` / `text.inverse` is the pair to reach for, and it is right
   *  BECAUSE it flips rather than in spite of flipping. What this card has to do
   *  is separate from `surface.default` — the plane every other card in the chart
   *  sits on — in both halves and under every skin. An inverse plane is *defined*
   *  as the maximum step off the plane, so whichever way the theme goes it goes
   *  the other. Worst case across base/industry/midgard/vitrine x light/dark:
   *  ink 13.96:1 on the fill, 12.91:1 of step against the panel.
   *
   *  `surface.bannerDeep` looks like the better answer and is measurably the
   *  wrong one — recorded here because it passes a careless check. It reads as a
   *  stable dark navy in the BASE layer, which is where it gets checked first,
   *  but a skin owns its own planes: vitrine sets it to #e9eceb in light, which
   *  is 1.025:1 against that skin's panel, and the card vanishes. It is a BANNER
   *  plane, built to sit under the topbar's own ink; nothing about it promises a
   *  step against a CARD.
   *
   *  So the rule is not "prefer a themed pair" — bannerDeep is a themed pair with
   *  measured ink and it still fails. It is: this card needs a plane whose step
   *  against `surface.default` is guaranteed, and inverse is the only namespace
   *  that makes that promise. A fixed hex makes no promise at all. */
  style?: CSSProperties;
}

export function OrgNode({
  name,
  role,
  code,
  meta,
  aside,
  current,
  vacant,
  href,
  onClick,
  stacked,
  column,
  compact,
  rollup,
  group,
  collapsible,
  defaultCollapsed,
  collapsed,
  onCollapsedChange,
  toggleLabel,
  children,
  className,
  style,
}: OrgNodeProps) {
  const branchId = useId();
  const kids = Children.toArray(children);
  const hasKids = kids.length > 0;
  const alreadyGrouped = useContext(InRollup);
  const filledGroups = useContext(GroupFill);
  /* The prop wins in BOTH directions, which is why this is `??` on a possibly-false
     prop rather than `compact || inherited` — the latter would make `compact={false}`
     inside a column silently do nothing, and opting one card out is the whole
     reason the escape hatch is documented. */
  const inheritedCompact = useContext(CompactCards);
  const isCompact = compact ?? inheritedCompact;

  const [uncontrolled, setUncontrolled] = useState(Boolean(defaultCollapsed));
  const isControlled = collapsed !== undefined;
  const isCollapsed = hasKids && (isControlled ? Boolean(collapsed) : uncontrolled);
  const hasToggle = hasKids && Boolean(collapsible || defaultCollapsed !== undefined || isControlled);

  if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
    if (vacant && !role) {
      console.warn(
        '[jrk] <OrgNode vacant> needs a `role` that says the post is open. The dashed edge is redundant coding, not the signal.',
      );
    }
    if (stacked && kids.some((k) => isValidElement<OrgNodeProps>(k) && Children.count(k.props.children) > 0)) {
      console.warn(
        '[jrk] <OrgNode stacked> is for leaf children. A stacked child with children of its own centres over its subtree and pulls off the spine.',
      );
    }
    /* THE `<OrgGroup>` EXEMPTION IS THE POINT OF WRITING THIS SEPARATELY FROM THE
       `stacked` CHECK ABOVE, rather than widening that one. A group HAS children —
       that is what it is — so the plain "any child with children" test fires on
       every correctly-built column, and a warning that fires on the normal case is
       a warning nobody reads. What is actually illegal is a child NODE with a
       subtree: with no connectors drawn, its children hang under it with nothing
       stating the relationship at all, which is a silent loss of the hierarchy
       rather than a cosmetic one. */
    if (column) {
      const offenders = kids.filter(
        (k) => isValidElement<OrgNodeProps>(k) && k.type !== OrgGroup && Children.count(k.props.children) > 0,
      );
      if (offenders.length) {
        console.warn(
          `[jrk] <OrgNode column> has ${offenders.length} child(ren) with children of their own. A column draws NO connectors — containment is what states the relationship — so a subtree inside one has nothing drawing its hierarchy at all. Use column for a terminal level: leaf nodes, or <OrgGroup> holding leaf nodes.`,
        );
      }
      if (stacked) {
        console.warn(
          '[jrk] <OrgNode> has both stacked and column. They are two different answers to a wide fan and both classes land on one branch, so the result is decided by source order in the stylesheet. Pick one: stacked keeps a spine and indents, column keeps the parent footprint and drops the connectors.',
        );
      }
    }
    if (rollup && filledGroups) warnGroupFill(kids.length, '<OrgNode rollup>');
    /* MIXING THE TWO KINDS IS THE FAULT; nesting one kind is not. Either direction of the
       mix puts a position-derived palette and a caller-assigned one over the same slots,
       which is the collision `rollup` has always warned about wearing a second hat. */
    if (group !== undefined && (rollup || alreadyGrouped === 'rollup')) {
      console.warn(
        '[jrk] <OrgNode group> is inside a --rollup branch, or sets both. Position-derived and identity-assigned slots are two mappings over one palette, which is the collision rollup warns about. Pick one kind per chart.',
      );
    }
    if (group !== undefined && (!Number.isInteger(group) || group < 1)) {
      console.warn(`[jrk] <OrgNode group={${String(group)}}> — slots are 1-based integers. 9 is slot 1 again.`);
    }
    if (rollup && alreadyGrouped !== 'none') {
      console.warn(
        `[jrk] <OrgNode rollup> is nested inside a ${alreadyGrouped === 'rollup' ? 'rollup' : 'group'}. Its slots start at 1 regardless of what is already in force above, so two subtrees can end up adjacent in the same colour — the one case the colouring does not survive. Use one grouping per chart.`,
      );
    }
  }

  const cardClass = cx(
    'jrk-org__card',
    isCompact && 'jrk-org__card--compact',
    vacant && 'jrk-org__card--vacant',
    (href || onClick) && 'jrk-org__card--link',
    className,
  );

  const cardInner = (
    <>
      <span className="jrk-org__name">{name}</span>
      {role && <span className="jrk-org__role">{role}</span>}
      {/* After `role` rather than instead of it, because the DOM order has to be
          stable: a card is free to carry both (a manager whose cost centre is on
          the chart), and the middle line then reads role-then-code, which is the
          order a reader expects — what the person does, then the key it is filed
          under. Neither is required. */}
      {code && <span className="jrk-org__code">{code}</span>}
      {meta && <span className="jrk-org__meta">{meta}</span>}
      {aside && <span className="jrk-org__aside">{aside}</span>}
    </>
  );

  let card: ReactNode;
  if (href) {
    card = (
      <a className={cardClass} style={style} href={href} aria-current={current || undefined}>
        {cardInner}
      </a>
    );
  } else if (onClick) {
    card = (
      <button type="button" className={cardClass} style={style} onClick={onClick} aria-current={current || undefined}>
        {cardInner}
      </button>
    );
  } else {
    card = <div className={cardClass} style={style} aria-current={current || undefined}>{cardInner}</div>;
  }

  const setCollapsed = (next: boolean) => {
    if (!isControlled) setUncontrolled(next);
    onCollapsedChange?.(next);
  };

  /* Cycled HERE rather than in the CSS, which carries eight slots and no ninth.
     Doing it in the component means a caller may number groups 1..n and let the
     library decide what happens past the palette — the same place the repeat is
     documented. */
  const slot = group !== undefined && Number.isInteger(group) && group >= 1
    ? ((group - 1) % 8) + 1
    : undefined;

  return (
    <li className={cx('jrk-org__node', slot !== undefined && `jrk-org__node--group-${slot}`)}>
      {card}

      {hasToggle && (
        <button
          type="button"
          className="jrk-org__toggle"
          aria-expanded={!isCollapsed}
          aria-controls={branchId}
          onClick={() => setCollapsed(!isCollapsed)}
        >
          <span>{toggleLabel ?? `${kids.length} ${kids.length === 1 ? 'report' : 'reports'}`}</span>
          {/* Does not rotate, the same as the sidebar caret: a swinging chevron
              promises the content lands directly below the control in a stack,
              and this one fans out a whole level. The count carries the state. */}
          <Icon name="chevronDown" />
        </button>
      )}

      {hasKids && (
        <ul
          id={branchId}
          className={cx(
            'jrk-org__branch',
            stacked && 'jrk-org__branch--stacked',
            column && 'jrk-org__branch--column',
            rollup && 'jrk-org__branch--rollup',
          )}
          hidden={isCollapsed}
        >
          {/* An explicit slot seeds the guard too — the subtree INHERITS the colour either
              way, so a `rollup` hung underneath one is still the two-palettes collision.
              What it seeds is 'group', not 'rollup', so a nested `group` stays silent while
              a nested `rollup` still warns. A rollup in force above OUTRANKS a group set
              here: it is the kind that cannot tolerate anything below it. */}
          <InRollup.Provider
            value={
              alreadyGrouped === 'rollup' || rollup
                ? 'rollup'
                : slot !== undefined || alreadyGrouped === 'group'
                  ? 'group'
                  : 'none'
            }
          >
            {/* `column` sets the size for the level BELOW it, never for its own card —
                a manager heading a column of properties is a full-size card and the
                properties are tiles. It then INHERITS on down, which is what carries
                it through an `<OrgGroup>` to the tiles inside without the group
                having to know about it. Nothing turns it back off, and it does not
                need to: the only legal descendants of a column are leaves and
                groups, which the warning above enforces. */}
            <CompactCards.Provider value={column ? true : inheritedCompact}>
              {children}
            </CompactCards.Provider>
          </InRollup.Provider>
        </ul>
      )}
    </li>
  );
}

export interface OrgGroupProps {
  /** The group's name — a state code, a market, a fund, a vintage. Uppercased
   *  and tracked by CSS, so pass it as it is stored.
   *
   *  Not optional, and it is the whole component: an unlabelled box around some
   *  tiles states that they belong together and refuses to say what they have in
   *  common, which is the one fact the box exists to carry. If there is nothing
   *  to name, the tiles belong directly in the column. */
  label: string;
  /** Leaf `<OrgNode>`s. They pick up the compact tile size from the column
   *  above without this component doing anything — see `CompactCards`. */
  children: ReactNode;
  className?: string;
}

/* A NAMED SUBDIVISION INSIDE A `<OrgNode column>` — the states under a regional
 * manager, the vintages under a fund.
 *
 * It renders an `<li>` holding a `<ul>`, so the accessibility tree says exactly
 * what the picture says: the branch is a list of groups and a group is a list of
 * properties. That matters more here than it usually does, because visually the
 * only thing separating two groups is a thin box and a three-letter label, and a
 * screen-reader user gets the nesting and the label in place of both. Flattening
 * it — headings interleaved into one list — hands them two hundred properties in
 * a run with the state codes buried in it.
 *
 *   <OrgNode name="Ed Sarti" role="Associate" meta="7 properties · 2,182 units" column>
 *     <OrgGroup label="WA">
 *       <OrgNode name="Boulders at Puget Sound" code="WST" meta="714 units" />
 *       <OrgNode name="Carrolls Creek Landing" code="CCL" meta="288 units" />
 *     </OrgGroup>
 *     <OrgGroup label="CA">
 *       <OrgNode name="Parkside Glen" code="PAG" meta="180 units" />
 *     </OrgGroup>
 *   </OrgNode>
 *
 * IT TAKES THE ROLLUP COLOUR AND CANNOT DISAGREE WITH IT. The box's edge reads
 * `--jrk-org-group-solid`, which is a custom property set on the node above and
 * inherited, so a group inside a rollup is edged in that rollup's hue with
 * nothing to pass in and no way to give it a colour its parent does not have.
 *
 * THE LABEL IS NOT THE HUE, and that is measured: a deep fill is 4.54:1 on the
 * light card and 3.29:1 on the dark one, so it can be the box's edge (3:1,
 * graphical) and cannot be its text (4.5:1) in dark, in all eight slots. The
 * edge takes the hue and the ink takes the ink. Nothing is lost — the hue names
 * the rollup and is stated on every tile inside; the label names the group,
 * which is the fact nothing else on screen carries.
 *
 * ONLY MEANINGFUL INSIDE A COLUMN. It is a plain list item, so it renders
 * anywhere without breaking, but in a fanned-out branch it sits where a node
 * would and the bus draws a stem to a box rather than to a card. It is not
 * gated, because the CSS cannot see its parent and a runtime check would need a
 * context set by every branch in the component for one authoring mistake that is
 * obvious the moment it is looked at. */
export function OrgGroup({ label, children, className }: OrgGroupProps) {
  return (
    <li className={cx('jrk-org__group', className)}>
      <span className="jrk-org__group-label">{label}</span>
      {/* `aria-label` on the inner list, so the group is announced by its own
          name rather than as "list, 5 items" nested inside another list. Same
          reason OrgChart's `label` is required. */}
      <ul className="jrk-org__group-items" aria-label={label}>
        {children}
      </ul>
    </li>
  );
}
