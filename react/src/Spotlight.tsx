import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { Button } from './Button';
import { cx } from './utils';

/* SpotlightGuide — an anchored, step-through overlay that teaches a figure in
 * place. See the header of css/components/spotlight.css for the scope argument
 * (this is not a product tour) and for why the cutout needs both a scrim and a
 * ring. This file owns only the parts CSS cannot do: finding the target,
 * measuring it, and sequencing.
 *
 * Everything behavioural is the platform's. The root is a <dialog> driven by
 * showModal(), so focus trapping, Esc and background inertness are not
 * re-implemented here — and because a modal dialog paints in the top layer, the
 * page shows through the hole in the scrim without being moved or cloned. */

/** A step's anchor. A selector keeps steps declarative and serialisable; the
 *  function form is the escape hatch for a node with no stable selector. */
export type SpotlightTarget = string | (() => Element | null);

export interface SpotlightTerm {
  label: string;
  value: string;
}

export interface SpotlightStep {
  /** Stable and URL-addressable. philosophy.md's constraint on every
   *  exploratory affordance is that the state it produces must be citable:
   *  two people in a meeting reach the same screen, and an audit reproduces it
   *  six months later. Put this in the query string. */
  id: string;
  /** Omit for a step about the page as a whole — the scrim covers everything
   *  and the callout centres. */
  target?: SpotlightTarget;
  title: string;
  body: ReactNode;
  /** The inputs the spotlit figure was computed from. This is the component's
   *  reason to exist: "a number that cannot show its inputs is not finished."
   *  Mark the outcome line with `total` so it reads as the result. */
  derivation?: Array<SpotlightTerm & { total?: boolean }>;
  /** Window, basis and population — "T12 · accrual basis · 37 properties".
   *  The three things that make a finance figure citable. */
  basis?: string;
  /** Breathing room between the target's edge and the cutout, in px. */
  padding?: number;
  /** Corner radius of the hole. Defaults to the target's own computed radius,
   *  so the hole matches the tile rather than approximating it. */
  radius?: number;
}

export interface SpotlightGuideProps {
  steps: SpotlightStep[];
  open: boolean;
  /** Controlled current step. Omit to let the component track its own, but
   *  prefer controlling it — that is what makes the state addressable. */
  stepId?: string;
  onStepChange?: (id: string, index: number) => void;
  onClose?: (reason: 'done' | 'dismissed') => void;
  /** Override the button and counter copy for localisation. */
  labels?: Partial<typeof DEFAULT_LABELS>;
  className?: string;
}

const DEFAULT_LABELS = {
  back: 'Back',
  next: 'Next',
  done: 'Done',
  dismiss: 'Skip',
  /** Rendered as text, not just as the progress bar — a bar is a length, and a
   *  length is not a label and announces nothing. */
  step: (n: number, total: number) => `Step ${n} of ${total}`,
};

/** Gap between the cutout edge and the callout, and the margin the callout
 *  keeps from the viewport edge. */
const GAP = 12;
const MARGIN = 16;
const CALLOUT_W = 360;
/** Only used to choose a side before the callout has been measured; the real
 *  height is read back on the next frame. */
const CALLOUT_H_ESTIMATE = 260;

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
  r: number;
}

function resolve(target: SpotlightTarget | undefined): Element | null {
  if (!target) return null;
  try {
    return typeof target === 'function' ? target() : document.querySelector(target);
  } catch {
    // A malformed selector should drop the step to untethered, not throw
    // through the render of whatever page the guide is overlaying.
    return null;
  }
}

function measure(el: Element, padding: number, radius?: number): Rect {
  const b = el.getBoundingClientRect();
  // Match the tile's own corner rather than guessing. The hole is inflated by
  // `padding`, so the radius grows with it or the corners read pinched.
  const own = radius ?? parseFloat(getComputedStyle(el).borderTopLeftRadius) ?? 0;
  return {
    x: b.left - padding,
    y: b.top - padding,
    w: b.width + padding * 2,
    h: b.height + padding * 2,
    r: (Number.isFinite(own) ? own : 0) + padding,
  };
}

/** The scrim is painted as a spread shadow AROUND the hole, so it only covers
 *  the viewport while the hole is somewhere near it. A target scrolled far off
 *  screen would leave most of the page unscrimmed — the overlay silently tears
 *  rather than failing loudly, which is the worst way for this to break.
 *  So an off-screen target degrades to untethered: full scrim, no hole, until
 *  scrollIntoView and the scroll listener bring it back. */
function onScreen(r: Rect): boolean {
  return r.y < window.innerHeight && r.y + r.h > 0 && r.x < window.innerWidth && r.x + r.w > 0;
}

/** Place the callout on whichever side of the hole has room, preferring below,
 *  then above, then the horizontal sides. Clamped to the viewport last, so a
 *  target near an edge still yields a fully visible panel. */
function place(rect: Rect, calloutH: number): { x: number; y: number } {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const below = vh - (rect.y + rect.h) - GAP - MARGIN;
  const above = rect.y - GAP - MARGIN;

  let x: number;
  let y: number;

  if (below >= calloutH || below >= above) {
    y = rect.y + rect.h + GAP;
    x = rect.x + rect.w / 2 - CALLOUT_W / 2;
  } else {
    y = rect.y - calloutH - GAP;
    x = rect.x + rect.w / 2 - CALLOUT_W / 2;
  }

  // If the hole is wide enough that centring the callout under it would cover
  // little, that is fine; what matters is never leaving the viewport.
  x = Math.min(Math.max(x, MARGIN), Math.max(MARGIN, vw - CALLOUT_W - MARGIN));
  y = Math.min(Math.max(y, MARGIN), Math.max(MARGIN, vh - calloutH - MARGIN));
  return { x, y };
}

export function SpotlightGuide({
  steps,
  open,
  stepId,
  onStepChange,
  onClose,
  labels,
  className,
}: SpotlightGuideProps) {
  const L = { ...DEFAULT_LABELS, ...labels };
  const dialogRef = useRef<HTMLDialogElement>(null);
  const calloutRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const titleId = useId();

  const [internalId, setInternalId] = useState(steps[0]?.id);
  const currentId = stepId ?? internalId;
  const index = Math.max(0, steps.findIndex((s) => s.id === currentId));
  const step = steps[index];

  const [rect, setRect] = useState<Rect | null>(null);
  const tethered = rect !== null;

  const goTo = useCallback(
    (i: number) => {
      const next = steps[i];
      if (!next) return;
      if (stepId === undefined) setInternalId(next.id);
      onStepChange?.(next.id, i);
    },
    [steps, stepId, onStepChange],
  );

  const close = useCallback(
    (reason: 'done' | 'dismissed') => {
      onClose?.(reason);
    },
    [onClose],
  );

  // ---- open / close the dialog imperatively.
  // showModal() is what makes the rest of the document inert and gives us Esc
  // and a focus trap; rendering the element with an `open` attribute would give
  // a non-modal dialog and none of the three.
  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  // Esc fires `cancel`; let the parent own the open flag rather than closing
  // the dialog behind its back and desynchronising the two.
  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    const onCancel = (e: Event) => {
      e.preventDefault();
      close('dismissed');
    };
    d.addEventListener('cancel', onCancel);
    return () => d.removeEventListener('cancel', onCancel);
  }, [close]);

  // ---- measure the target and keep the hole on it.
  const reposition = useCallback(() => {
    if (!step) return;
    const el = resolve(step.target);
    if (!el) {
      setRect(null);
      return;
    }
    const r = measure(el, step.padding ?? 6, step.radius);
    setRect(onScreen(r) ? r : null);
  }, [step]);

  useLayoutEffect(() => {
    if (!open || !step) return;

    const el = resolve(step.target);
    // Bring the target into view before measuring, or a hole gets punched
    // somewhere off screen and the reader sees only scrim.
    el?.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'smooth' });
    reposition();

    // Re-measure rather than locking scroll: the page under a modal dialog can
    // still scroll, the smooth scrollIntoView above is itself a scroll, and a
    // target can resize (a chart laying out, a row expanding) with no scroll at
    // all. Capture phase catches scrolls in nested containers too.
    let live = true;
    const onChange = () => {
      if (live) reposition();
    };
    window.addEventListener('scroll', onChange, { capture: true, passive: true });
    window.addEventListener('resize', onChange);

    // Observe the ROOT as well as the target. A reflow can move the target
    // without changing its own size — in which case an observer on the target
    // alone never fires and the hole stays where the element used to be.
    const ro = new ResizeObserver(onChange);
    if (el) ro.observe(el);
    ro.observe(document.documentElement);

    // css/fonts.css loads Inter over the network, so first layout happens in the
    // fallback face and text-sized boxes move when the swap lands. Cheap
    // insurance rather than a diagnosed bug — the observers above would very
    // likely catch it anyway, and a hole measured against the wrong layout is
    // the one failure that makes the whole component look broken.
    document.fonts?.ready.then(onChange);

    return () => {
      live = false;
      window.removeEventListener('scroll', onChange, { capture: true });
      window.removeEventListener('resize', onChange);
      ro.disconnect();
    };
  }, [open, step, reposition]);

  // ---- move focus to the step heading so the new content is announced.
  useEffect(() => {
    if (!open) return;
    titleRef.current?.focus();
  }, [open, currentId]);

  // ---- place the callout once its real height is known.
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  useLayoutEffect(() => {
    if (!open || !rect) {
      setPos(null);
      return;
    }
    const h = calloutRef.current?.offsetHeight || CALLOUT_H_ESTIMATE;
    setPos(place(rect, h));
  }, [open, rect, currentId]);

  if (!step) return null;

  const first = index === 0;
  const last = index === steps.length - 1;

  const style = {
    ...(rect && {
      '--jrk-spotlight-x': `${rect.x}px`,
      '--jrk-spotlight-y': `${rect.y}px`,
      '--jrk-spotlight-w': `${rect.w}px`,
      '--jrk-spotlight-h': `${rect.h}px`,
      '--jrk-spotlight-r': `${rect.r}px`,
    }),
    ...(pos && {
      '--jrk-spotlight-callout-x': `${pos.x}px`,
      '--jrk-spotlight-callout-y': `${pos.y}px`,
    }),
  } as CSSProperties;

  return (
    <dialog
      ref={dialogRef}
      className={cx('jrk-spotlight', !tethered && 'jrk-spotlight--untethered', className)}
      style={style}
      aria-labelledby={titleId}
      onClose={() => {
        if (open) close('dismissed');
      }}
    >
      <div className="jrk-spotlight__cutout" />

      <div className="jrk-spotlight__callout" ref={calloutRef}>
        <div className="jrk-spotlight__header">
          <p className="jrk-spotlight__step">{L.step(index + 1, steps.length)}</p>
          <h2 className="jrk-spotlight__title" id={titleId} ref={titleRef} tabIndex={-1}>
            {step.title}
          </h2>
        </div>

        <div className="jrk-spotlight__body">
          {step.body}
          {step.basis && <p className="jrk-spotlight__basis">{step.basis}</p>}
        </div>

        {step.derivation && step.derivation.length > 0 && (
          <dl className="jrk-spotlight__derivation">
            {step.derivation.map((t) => (
              <div
                key={t.label}
                className={cx('jrk-spotlight__term', t.total && 'jrk-spotlight__term--total')}
              >
                <dt>{t.label}</dt>
                <dd>{t.value}</dd>
              </div>
            ))}
          </dl>
        )}

        <div className="jrk-spotlight__footer">
          {/* Both readings of position: the bar, and the words in the header.
              aria-hidden because the counter already says it. */}
          <div
            className="jrk-progress jrk-spotlight__progress"
            role="presentation"
            aria-hidden="true"
          >
            <span
              className="jrk-progress__fill"
              style={{ width: `${((index + 1) / steps.length) * 100}%` }}
            />
          </div>

          <div className="jrk-spotlight__actions">
            {!last && (
              <Button variant="ghost" size="sm" onClick={() => close('dismissed')}>
                {L.dismiss}
              </Button>
            )}
            {!first && (
              <Button variant="secondary" size="sm" onClick={() => goTo(index - 1)}>
                {L.back}
              </Button>
            )}
            {/* The one committing action in the overlay, so it is the one cta.
                There is no other saturated blue rectangle inside the callout. */}
            <Button
              variant="cta"
              size="sm"
              onClick={() => (last ? close('done') : goTo(index + 1))}
            >
              {last ? L.done : L.next}
            </Button>
          </div>
        </div>
      </div>
    </dialog>
  );
}
