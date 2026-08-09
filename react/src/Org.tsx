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
  children: ReactNode;
  className?: string;
}

export function OrgChart({ label, nodeWidth, scroll = true, children, className }: OrgChartProps) {
  const tree = (
    <ul
      className={cx('jrk-org', className)}
      aria-label={label}
      style={
        nodeWidth
          ? { ['--jrk-org-node' as string]: typeof nodeWidth === 'number' ? `${nodeWidth}px` : nodeWidth }
          : undefined
      }
    >
      {children}
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
   *  Adjacent siblings never collide — consecutive slots are the pair the
   *  palette order was searched to maximise (dE 22.3 light / 16.5 dark). Slot 9
   *  restarts at slot 1, eight positions away, and siblings an even number of
   *  slots apart can read as one colour under dichromacy (worst: orange|yellow,
   *  dE 0.8). Both are fine because the tree already draws the grouping and
   *  every card is labelled — the keyline is an accelerator, never the identity
   *  channel. With 3 or fewer groups it is fully CVD-safe.
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
