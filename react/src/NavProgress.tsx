import { useEffect, useRef, useState } from 'react';
import { cx } from './utils';

export interface NavProgressProps {
  /** A navigation is in flight. Drive it with `useNavProgress`. */
  busy: boolean;
  className?: string;
}

/** Two pixels across the top of the viewport while a navigation is in flight.
 *
 *  It is the feedback for the navigation a route-level loading state cannot
 *  cover: a SAME-route change of search params, where nothing suspends and the
 *  old page sits there, complete and wrong, for however long the render takes.
 *
 *  `aria-hidden`, deliberately. The status a screen reader needs is the one the
 *  page's own loading state announces; a second live region firing on every link
 *  press would read a progress bar over the top of it. */
export function NavProgress({ busy, className }: NavProgressProps) {
  return <div className={cx('jrk-navprogress', busy && 'jrk-navprogress--busy', className)} aria-hidden="true" />;
}

/** Arms on a same-origin link click and disarms when the location changes.
 *
 *  `locationKey` is whatever names the current address in the host router —
 *  pathname plus search, as a string. A string, not an object: an object's
 *  identity changes every render and would disarm the bar the instant it armed.
 *
 *  ARMED IN THE CAPTURE PHASE, before any component's own handler can call
 *  `preventDefault` — a handler that cancels the navigation runs later, and
 *  guessing from `pointerdown` would leave the bar stuck on. The listener
 *  re-checks what the browser checks before treating a click as a navigation
 *  (left button, no modifier, same origin, no `target`, no `download`), so a
 *  middle-click or ctrl-click that opens a tab does not arm a bar on the page
 *  being left behind. A link to the current address commits nothing, so it does
 *  not arm either.
 *
 *  IT DISARMS ON A TIMEOUT TOO, and that is not belt and braces: a navigation that
 *  is cancelled, or that lands on the same key, changes nothing this hook can
 *  see, and the bar would run forever. `maxMs` is the ceiling for a bar that has
 *  no way to know it was cancelled. */
export function useNavProgress(locationKey: string, maxMs = 6000): boolean {
  const [busy, setBusy] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (e.defaultPrevented || e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const link = (e.target as Element | null)?.closest?.('a');
      if (!(link instanceof HTMLAnchorElement)) return;
      if (link.target && link.target !== '_self') return;
      if (link.hasAttribute('download')) return;
      const href = link.getAttribute('href');
      if (!href || href.startsWith('#')) return;

      let url: URL;
      try {
        url = new URL(link.href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;
      // Same address, or only a fragment change: nothing commits, nothing to wait for.
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;

      setBusy(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setBusy(false), maxMs);
    }
    document.addEventListener('click', onClick, true);
    return () => {
      document.removeEventListener('click', onClick, true);
      clearTimeout(timer.current);
    };
  }, [maxMs]);

  /* The address changed, so the navigation this was armed for has landed. */
  useEffect(() => {
    setBusy(false);
    clearTimeout(timer.current);
  }, [locationKey]);

  return busy;
}
