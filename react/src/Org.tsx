import { Children, createContext, isValidElement, useContext, useId, useState, type ReactNode } from 'react';
import { Icon } from './Icon';
import { cx } from './utils';

/* Tracks whether we are already inside a --rollup subtree. Two rollup branches
 * both start at palette slot 1, so branch B's first child can land beside branch
 * A's last child wearing the same colour — the one case that breaks the
 * adjacency guarantee the colouring rests on. Context rather than a child walk,
 * because the nesting can be at any depth. */
const InRollup = createContext(false);

/* Whether the chart draws groups as FILLS rather than keylines. Only the dev
 * warning needs it — the styling is a descendant selector off the root class —
 * but the safe group count differs between the two variants, so the warning
 * cannot be written without knowing which one is on. */
const GroupFill = createContext(false);

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
  children: ReactNode;
  className?: string;
}

export function OrgChart({ label, nodeWidth, scroll = true, rollup, groupFill, children, className }: OrgChartProps) {
  if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
    if (rollup && groupFill) warnGroupFill(Children.toArray(children).length, '<OrgChart rollup>');
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
      <InRollup.Provider value={Boolean(rollup)}>
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
}

export function OrgNode({
  name,
  role,
  meta,
  aside,
  current,
  vacant,
  href,
  onClick,
  stacked,
  rollup,
  group,
  collapsible,
  defaultCollapsed,
  collapsed,
  onCollapsedChange,
  toggleLabel,
  children,
  className,
}: OrgNodeProps) {
  const branchId = useId();
  const kids = Children.toArray(children);
  const hasKids = kids.length > 0;
  const alreadyGrouped = useContext(InRollup);
  const filledGroups = useContext(GroupFill);

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
    if (rollup && filledGroups) warnGroupFill(kids.length, '<OrgNode rollup>');
    if (group !== undefined && (rollup || alreadyGrouped)) {
      console.warn(
        '[jrk] <OrgNode group> is inside a rollup, or sets both. Position-derived and identity-assigned slots are two mappings over one palette, which is the collision rollup warns about. Pick one per chart.',
      );
    }
    if (group !== undefined && (!Number.isInteger(group) || group < 1)) {
      console.warn(`[jrk] <OrgNode group={${String(group)}}> — slots are 1-based integers. 9 is slot 1 again.`);
    }
    if (rollup && alreadyGrouped) {
      console.warn(
        '[jrk] <OrgNode rollup> is nested inside another rollup. Both start at palette slot 1, so two subtrees can end up adjacent in the same colour — the one case the colouring does not survive. Use one rollup level per chart.',
      );
    }
  }

  const cardClass = cx(
    'jrk-org__card',
    vacant && 'jrk-org__card--vacant',
    (href || onClick) && 'jrk-org__card--link',
    className,
  );

  const cardInner = (
    <>
      <span className="jrk-org__name">{name}</span>
      {role && <span className="jrk-org__role">{role}</span>}
      {meta && <span className="jrk-org__meta">{meta}</span>}
      {aside && <span className="jrk-org__aside">{aside}</span>}
    </>
  );

  let card: ReactNode;
  if (href) {
    card = <a className={cardClass} href={href} aria-current={current || undefined}>{cardInner}</a>;
  } else if (onClick) {
    card = (
      <button type="button" className={cardClass} onClick={onClick} aria-current={current || undefined}>
        {cardInner}
      </button>
    );
  } else {
    card = <div className={cardClass} aria-current={current || undefined}>{cardInner}</div>;
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
            rollup && 'jrk-org__branch--rollup',
          )}
          hidden={isCollapsed}
        >
          {/* An explicit slot seeds the guard exactly as `rollup` does — the subtree
              INHERITS the colour either way, so a rollup hung underneath one is the
              same two-palettes collision. */}
          <InRollup.Provider value={alreadyGrouped || Boolean(rollup) || slot !== undefined}>{children}</InRollup.Provider>
        </ul>
      )}
    </li>
  );
}
