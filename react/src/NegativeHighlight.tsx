import { useEffect } from 'react';
import { NEGATIVE_MONEY } from './money';

/* EVERY NEGATIVE DOLLAR AMOUNT ON THE PAGE IS RED — mount once at the app root.
 *
 * Finds each `NEGATIVE_MONEY` token in the page's text and paints it through the CSS
 * Custom Highlight API (`::highlight(jrk-negative)` in base.css). NOTHING IN THE DOM
 * CHANGES — no class, no wrapper span — and that is the point: a wrapper around a text
 * node React owns breaks React's next removal of it, and a change before hydration is a
 * mismatch that throws the subtree away. A highlight is neither. It also colours just
 * the figure, so "($1,200) over budget" keeps its words in the body ink.
 *
 * Re-scanned after DOM changes, debounced. Script and style text is skipped (an RSC
 * payload is megabytes of JSON full of dollar signs). Browsers without the API show the
 * parentheses uncoloured, which is the accounting form on its own and still correct.
 *
 * Upstreamed from the portal 2026-11-23 (its rule since 2026-11-11). */

const NAME = 'jrk-negative';
const SKIP = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA', 'TEMPLATE']);

type Registry = { set(name: string, h: unknown): void; delete(name: string): void };
type HighlightLike = { add(r: Range): void; clear(): void };

export interface NegativeHighlightProps {
  /** Element whose text is scanned. Defaults to `document.body`. */
  root?: () => HTMLElement | null;
  /** Debounce after a DOM change, in ms. */
  delay?: number;
}

export function NegativeHighlight({ root, delay = 80 }: NegativeHighlightProps = {}) {
  useEffect(() => {
    const registry = (globalThis.CSS as unknown as { highlights?: Registry } | undefined)?.highlights;
    const Ctor = (globalThis as unknown as { Highlight?: new () => HighlightLike }).Highlight;
    if (!registry || !Ctor) return;
    const scope = root?.() ?? document.body;
    if (!scope) return;
    const highlight = new Ctor();
    registry.set(NAME, highlight);

    const scan = () => {
      highlight.clear();
      const walker = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT, {
        acceptNode: (n) => {
          const parent = n.parentElement;
          if (!parent || SKIP.has(parent.tagName)) return NodeFilter.FILTER_REJECT;
          return n.nodeValue && n.nodeValue.indexOf('$') >= 0 ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
        },
      });
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        const text = node.nodeValue ?? '';
        for (const m of text.matchAll(NEGATIVE_MONEY)) {
          const range = new Range();
          range.setStart(node, m.index ?? 0);
          range.setEnd(node, (m.index ?? 0) + m[0].length);
          highlight.add(range);
        }
      }
    };

    let timer: ReturnType<typeof setTimeout> | null = null;
    const queue = () => {
      if (timer) return;
      timer = setTimeout(() => {
        timer = null;
        scan();
      }, delay);
    };
    scan();
    const observer = new MutationObserver(queue);
    observer.observe(scope, { subtree: true, childList: true, characterData: true });
    return () => {
      observer.disconnect();
      if (timer) clearTimeout(timer);
      registry.delete(NAME);
    };
  }, [root, delay]);
  return null;
}
