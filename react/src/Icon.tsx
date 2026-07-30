import type { SVGProps } from 'react';
import { OUTLINE, FILLED, STATUS_ICON } from '../../dist/icons';
import { cx } from './utils';

/* Icons, in the SF Symbols idiom.
 *
 * The glyph paths live in `tokens/icons.json` and are generated into
 * `dist/icons.ts` (this file) and `dist/icons.js` (the plain-JS previews and
 * anything Jinja-side). One source, two consumers — a path is never written
 * twice and cannot drift.
 *
 * SF Symbols themselves are not shipped: Apple publishes no webfont and the
 * outlines are theirs. What is reproduced here is the BEHAVIOUR, which is what
 * actually reads as SF — see css/components/icon.css:
 *
 *   - sized in `em`, so a glyph scales with the label beside it
 *   - weight that tracks the surrounding text
 *   - round terminals, compact geometry filling the 16 grid
 *   - filled status variants whose inner mark is punched out, so they sit on
 *     any badge wash without knowing its colour
 *
 * For glyphs beyond this set use Phosphor (MIT) with `className="jrk-icon"` —
 * it inherits the same contract.
 */

export type IconName = keyof typeof OUTLINE | keyof typeof FILLED | (string & {});

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'name'> {
  name: IconName;
  /** Weight, paired to the text weight the icon sits beside. */
  weight?: 'light' | 'medium' | 'semibold' | 'bold';
  /** Fixed size instead of scaling with the surrounding text. Prefer the
   *  default — text-relative sizing is what makes icons feel native. */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function Icon({ name, weight, size, className, ...rest }: IconProps) {
  const filled = FILLED[name as string];
  const outline = OUTLINE[name as string];

  if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production' && !filled && !outline) {
    console.warn(`[jrk] no icon named "${name}". Add it to tokens/icons.json and rebuild.`);
  }

  return (
    <svg
      viewBox="0 0 16 16"
      aria-hidden="true"
      focusable="false"
      data-fill={filled ? 'true' : undefined}
      className={cx(
        'jrk-icon',
        filled && 'jrk-icon--fill',
        weight && `jrk-icon--${weight}`,
        size && `jrk-icon--${size}`,
        className,
      )}
      {...rest}
    >
      <path d={filled ?? outline} fillRule={filled ? 'evenodd' : undefined} />
    </svg>
  );
}

export { STATUS_ICON };
