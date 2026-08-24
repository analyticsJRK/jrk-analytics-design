import { Fragment } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { cx } from './utils';

/* Explain — <Lede>, <Steps>, <Glossary>.
 *
 * The three pieces a data-dense landing zone needs so that it states a finding
 * instead of describing itself. Full reasoning, and every measured figure, is in
 * css/components/explain.css; only the API decisions are argued here.
 *
 * None of the three draws a surface, so each is safe on the page and inside a
 * card. All three are content components: they take what you give them and add
 * no chrome of their own. */

/* ============================== Lede ============================== */

export interface LedeProps {
  /** ONE SENTENCE, stating what the data says this time. Wrap the figure in
   *  <strong> — the weight is the emphasis, never a colour. */
  children?: ReactNode;
  /** The scope condition the claim rests on — "priced on completed winters
   *  only". Fine print, muted, under the sentence. */
  basis?: ReactNode;
  className?: string;
}

/* RETURNS NULL ON EMPTY CHILDREN, and that is the API doing the design's job.
 * A page with no finding should show no lede — the alternative is a caller
 * writing "Review the table below" to fill the slot, which is furniture at the
 * largest type size on the screen. Nothing else in this library renders null on
 * empty, and nothing else in this library is a claim.
 *
 * `basis` alone renders nothing either: grounds with no claim attached are a
 * caption that has lost its subject. */
export function Lede({ children, basis, className }: LedeProps) {
  if (children == null || children === false || children === '') return null;
  return (
    <>
      <p className={cx('jrk-lede', className)}>{children}</p>
      {basis && <p className="jrk-lede__basis">{basis}</p>}
    </>
  );
}

/* ============================== Steps ============================== */

export interface Step {
  /** The action, in a few words. Semibold, primary ink. */
  title: ReactNode;
  /** One sentence of detail. Optional — a three-word step needs none. */
  detail?: ReactNode;
}

export interface StepsProps {
  /** Three or four. A method that takes seven steps to state is a method the
   *  reader will not follow, and the fix is at layer 1 rather than here. */
  items: Step[];
  className?: string;
}

/* `items` RATHER THAN CHILDREN, for the same reason <Glossary> takes items: the
 * numeral is a CSS counter, so a caller assembling its own <li> elements would
 * be free to omit the marker span and get an unnumbered list that still passes
 * every gate. The array makes the marker structural.
 *
 * role="list" is deliberate — see the CSS. `list-style: none` costs an <ol> its
 * list semantics in Safari/VoiceOver, and the ordinal is the entire point. */
export function Steps({ items, className }: StepsProps) {
  return (
    <ol className={cx('jrk-steps', className)} role="list">
      {items.map((s, i) => (
        <li className="jrk-steps__step" key={i}>
          <span className="jrk-steps__num" aria-hidden="true" />
          <span className="jrk-steps__title">{s.title}</span>
          {s.detail && <span className="jrk-steps__detail">{s.detail}</span>}
        </li>
      ))}
    </ol>
  );
}

/* ============================== Glossary ============================== */

export interface GlossaryEntry {
  /** The term as the reader will meet it in the data. A <Badge> is the intended
   *  form when the term appears as one in the table below. */
  term: ReactNode;
  /** ONE LINE. A gloss that needs a paragraph is a <SpotlightGuide> step. */
  def: ReactNode;
}

export interface GlossaryProps {
  /** Two or three. A page whose terms fill a screen has a vocabulary problem
   *  that a glossary hides rather than solves. */
  items: GlossaryEntry[];
  /** One column, gloss under term — for a narrow column, not for a long list. */
  stacked?: boolean;
  /** Fixes the term column instead of letting the longest term set it. Any CSS
   *  length; the two-column grid is `max-content` without it. */
  termWidth?: string;
  className?: string;
}

/* A <dl> has to emit dt/dd as SIBLINGS — wrapping each pair in a <div> is legal
 * HTML but puts a box between the grid and its items, and the whole component is
 * one grid so that every gloss lands on one edge. That is why this takes an
 * array rather than children: children cannot be trusted to stay flat. */
export function Glossary({ items, stacked, termWidth, className }: GlossaryProps) {
  return (
    <dl
      className={cx('jrk-glossary', stacked && 'jrk-glossary--stacked', className)}
      style={termWidth ? ({ '--jrk-glossary-term': termWidth } as CSSProperties) : undefined}
    >
      {items.map((e, i) => (
        <Fragment key={i}>
          <dt className="jrk-glossary__term">{e.term}</dt>
          <dd className="jrk-glossary__def">{e.def}</dd>
        </Fragment>
      ))}
    </dl>
  );
}
