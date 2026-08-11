import { Children, createContext, isValidElement, useContext, useId, useState, type ReactNode } from 'react';
import { Icon } from './Icon';
import { cx } from './utils';

/* Tracks whether we are already inside a --rollup subtree. Two rollup branches
 * both start at palette slot 1, so branch B's first child can land beside branch
 * A's last child wearing the same colour — the one case that breaks the
 * adjacency guarantee the colouring rests on. Context rather than a child walk,
 * because the nesting can be at any depth. */
const InRollup = createContext(false);

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
  children: ReactNode;
  className?: string;
}

export function OrgChart({ label, nodeWidth, scroll = true, rollup, children, className }: OrgChartProps) {
  const tree = (
    <ul
      /* `jrk-org__branch--rollup` on the root <ul> rather than a modifier of its
         own. The palette rules select `.jrk-org__branch--rollup >
         .jrk-org__node`, and the root list's children ARE `.jrk-org__node`,
         exactly like a branch's — a separate class would mean eight more
         nth-child rules that had to stay in step with the branch's forever. */
      className={cx('jrk-org', rollup && 'jrk-org__branch--rollup', className)}
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
      <InRollup.Provider value={Boolean(rollup)}>{children}</InRollup.Provider>
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
   *  ONE PER CHART; nesting warns in development. */
  rollup?: boolean;
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

  return (
    <li className="jrk-org__node">
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
          <InRollup.Provider value={alreadyGrouped || Boolean(rollup)}>{children}</InRollup.Provider>
        </ul>
      )}
    </li>
  );
}
