import { useSyncExternalStore } from 'react';

/* A count of writes in flight, so one screen-level "Saving…" can cover all of them.
 *
 * WHY A STORE AND NOT A PROP. The thing that starts a write (a dialog's Save, a
 * row's toggle) is usually not the thing that should show the wait, and is often
 * gone before the wait is over — a dialog that closes as it saves takes any
 * spinner it owns with it. So a write REPORTS itself here and one <BusySpinner>,
 * mounted once near the root, shows the wait for every write on the page.
 *
 * A COUNT, NOT A FLAG. Two writes overlapping must keep the spinner up until the
 * second finishes; a boolean set false by the first would drop it mid-write.
 *
 * NO ROUTER IN HERE. Holding the wait until refreshed data is ON SCREEN (not just
 * until the request returns) is the consumer's half: open a `beginBusy()` when the
 * refresh starts and close it when the new render commits — a React transition's
 * `isPending` is the usual signal. Keeping that out is what lets this run under
 * any framework.
 *
 *   const end = beginBusy('Approving…');
 *   try { await save(); } finally { end(); }
 */

export interface BusyState {
  /** True while at least one write is open. */
  busy: boolean;
  /** The label of the most recently started write still open that named one. */
  label?: string;
  /** How many writes are open. */
  count: number;
}

interface Entry {
  id: number;
  label?: string;
}

let open: Entry[] = [];
let seq = 0;
const IDLE: BusyState = { busy: false, count: 0 };
let snapshot: BusyState = IDLE;
const subscribers = new Set<() => void>();

/* `useSyncExternalStore` compares snapshots by identity, so a new object is made
   only when the state actually changes — never on read. */
function publish() {
  let label: string | undefined;
  for (let i = open.length - 1; i >= 0; i -= 1) {
    if (open[i].label) {
      label = open[i].label;
      break;
    }
  }
  snapshot = open.length ? { busy: true, label, count: open.length } : IDLE;
  subscribers.forEach((fn) => fn());
}

/** A write has started. Call the returned function when it has finished, either
 *  way — it is safe to call twice, so `finally` and an error path can both call it. */
export function beginBusy(label?: string): () => void {
  seq += 1;
  const entry: Entry = { id: seq, label };
  open = [...open, entry];
  publish();
  let ended = false;
  return () => {
    if (ended) return;
    ended = true;
    open = open.filter((e) => e.id !== entry.id);
    publish();
  };
}

/** Run `work` with the store marked busy for its whole duration. */
export async function trackBusy<T>(work: Promise<T> | (() => Promise<T>), label?: string): Promise<T> {
  const end = beginBusy(label);
  try {
    return await (typeof work === 'function' ? work() : work);
  } finally {
    end();
  }
}

export function subscribeBusy(fn: () => void): () => void {
  subscribers.add(fn);
  return () => {
    subscribers.delete(fn);
  };
}

export function getBusy(): BusyState {
  return snapshot;
}

/* The server never has a write in flight, and answering IDLE there means the first
   client render agrees with the HTML it hydrates. */
const getServerBusy = (): BusyState => IDLE;

/** The current write state, re-rendering when it changes. */
export function useBusy(): BusyState {
  return useSyncExternalStore(subscribeBusy, getBusy, getServerBusy);
}
