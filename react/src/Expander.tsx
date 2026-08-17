import { useId, useState, type ReactNode } from 'react';
import { Icon } from './Icon';
import { cx } from './utils';

/* Expandable card — a summary tile that opens to reveal a table.
 *
 * See css/components/expander.css for the design decisions; the two that shape
 * this file:
 *
 *   - The block emits BOTH `jrk-card` and `jrk-expander`. That is a contract, not
 *     a convenience: nesting.css and table.css both style a nested table by
 *     matching `.jrk-card <something>`, so dropping the card class silently gives
 *     the table inside a resting shadow and takes away its hairline.
 *   - The tone treats the SUMMARY only. The panel is always the card plane,
 *     because every token a table uses was measured against surface.default.
 */

export type ExpanderTone = 'plain' | 'pastel' | 'vivid';
/** Assign by POSITION in the row, never by what the card is about — on both the
 *  pastel and the vivid tone these hues collapse pairwise under simulated CVD,
 *  and identity is carried by the tag and the title. */
export type ExpanderHue = 'rose' | 'violet' | 'blue' | 'teal';

export interface ExpanderProps {
  title: ReactNode;
  /** One line on what the card is counting and what to do about it. */
  description?: ReactNode;
  /** A domain chip — "operational", "financial". Deliberately not a status
   *  badge: a status tone reserves a colour and ships a mandatory icon, and a
   *  domain is not a status. */
  tag?: ReactNode;
  /** Leading glyph, by name from the built-in set. */
  icon?: string;
  tone?: ExpanderTone;
  /** Only meaningful on the pastel and vivid tones. */
  hue?: ExpanderHue;
  /** Below the panel content — "+87 more, in the detailed sections below". */
  footer?: ReactNode;
  /** Uncontrolled initial state. Omit `open` to use it. */
  defaultOpen?: boolean;
  /** Controlled state. Pass with `onOpenChange`. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** The table, usually. Anything that belongs on the card plane works. */
  children?: ReactNode;
  className?: string;
}

export function Expander({
  title,
  description,
  tag,
  icon,
  tone = 'plain',
  hue,
  footer,
  defaultOpen = false,
  open,
  onOpenChange,
  children,
  className,
}: ExpanderProps) {
  const [uncontrolled, setUncontrolled] = useState(defaultOpen);
  const isControlled = open !== undefined;
  const expanded = isControlled ? open : uncontrolled;

  const id = useId();
  const panelId = `${id}-panel`;
  const headingId = `${id}-heading`;

  function toggle() {
    if (!isControlled) setUncontrolled((v) => !v);
    onOpenChange?.(!expanded);
  }

  return (
    /* `data-expanded` and `aria-expanded` carry the same fact and both are
       needed: the attribute on the button is the accessible truth, and CSS
       cannot reach up from it to the block that has to restyle. Set in one
       place here so they can never disagree. */
    <section
      className={cx(
        'jrk-card',
        'jrk-expander',
        tone !== 'plain' && `jrk-expander--${tone}`,
        tone !== 'plain' && hue && `jrk-expander--${hue}`,
        className,
      )}
      data-expanded={expanded}
    >
      <h3 className="jrk-expander__heading" id={headingId}>
        <button
          type="button"
          className="jrk-expander__summary"
          aria-expanded={expanded}
          aria-controls={panelId}
          onClick={toggle}
        >
          {icon && (
            <span className="jrk-expander__icon">
              <Icon name={icon} />
            </span>
          )}
          <span className="jrk-expander__text">
            {tag && <span className="jrk-expander__tag">{tag}</span>}
            <span className="jrk-expander__title">{title}</span>
            {description && <span className="jrk-expander__desc">{description}</span>}
          </span>
          {/* Rotates on open, unlike the nav rail's caret. The rail's does not
              because its panel appears BESIDE the row; this one appears below,
              so the accordion gesture is the honest promise. */}
          <Icon name="chevronDown" className="jrk-icon jrk-expander__caret" />
        </button>
      </h3>

      {/* Rendered whether open or closed — the panel animates from a 0fr grid
          row, so its content has to exist to have a height to animate to. The
          CSS hides it with `visibility` when collapsed, which is what keeps it
          out of the tab order; `hidden` here would kill the transition. */}
      <div className="jrk-expander__panel" id={panelId} role="region" aria-labelledby={headingId}>
        <div className="jrk-expander__panel-inner">
          {children}
          {footer && <p className="jrk-expander__footer">{footer}</p>}
        </div>
      </div>
    </section>
  );
}

export interface ExpanderRowProps {
  children?: ReactNode;
  className?: string;
}

/** Lays expanders out side by side. A card OPENS IN PLACE, in the column it
 *  already occupies; its neighbours neither move nor resize.
 *
 *  It used to promote an open card to the full row width and collapse the row to a
 *  single column. Removed on direction, 2026-08-17: the collapse re-laid the whole
 *  row, so opening one card stretched every OTHER card to page width too. The row
 *  block in expander.css records what went and what it cost.
 *
 *  What it cost is now the caller's to design around. A panel in a ~410px column is
 *  narrow, and a wide multi-column table put there is correctly styled at a width
 *  no table can use — "947 of 982 units" wraps, and rows grow to three or four
 *  lines. Prefer a compact list in the panel, wider tracks, or a single full-width
 *  expander per row where the panel genuinely needs a table. */
export function ExpanderRow({ children, className }: ExpanderRowProps) {
  return <div className={cx('jrk-expander-row', className)}>{children}</div>;
}
