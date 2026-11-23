import type { ReactNode } from 'react';
import { cx } from './utils';
import type { NavLinkAs } from './Shell';

/* The section strip under a page header — a module's screens, one level or two.
 *
 * READ THE HEADER OF css/components/subnav.css BEFORE CHANGING THIS FILE. The short version
 * of the part that constrains it:
 *
 *   LINKS CARRYING aria-current="page", NEVER role="tablist". Both rows navigate to
 *   addressable routes, and a tablist promises panels in this document that never arrive.
 *   Borrowing the tab and segmented-control LOOK is fine; borrowing their semantics when the
 *   behaviour differs is not.
 *
 *   TWO LEVELS THAT DO NOT LOOK ALIKE. Groups are an underline `.jrk-tabs` row; the open
 *   group's sections are a `.jrk-btn-group` segmented row. Only the open group's sections
 *   are on screen, which is the whole reason it is two levels rather than fourteen tabs.
 *
 * What stays with the caller: which sections exist, their hrefs (property scoping, carried
 * query state), hints. What lives here: which item is current, which group is open, where a
 * group tab goes, and the markup. Routing goes through `linkAs`, so a framework link (and its
 * pending marker) is the caller's to pass. */

export interface SubNavAlert {
  /** Zero or less renders nothing — "nothing waiting" is the default state and earns no ink. */
  count: number;
  /** What is waiting, e.g. "live infestations". Read as `${count} ${label}`. */
  label: string;
}

export interface SubNavItem {
  id: string;
  label: ReactNode;
  href: string;
  /** The address this item answers to, when `href` carries extra state that is not its
   *  identity (a carried `?draft=`). Defaults to `href`. */
  match?: string;
  /** Overrides the computed state. Omit it and pass `location` instead. */
  active?: boolean;
  /** Group id. When any item names one, the strip is two levels. */
  group?: string;
  /** Tooltip — the place to say a section is portfolio-wide and not filtered. */
  hint?: string;
  alert?: SubNavAlert;
}

export interface SubNavGroup {
  /** Matches `SubNavItem.group`. */
  id: string;
  /** Tab text. Defaults to the id. */
  label?: ReactNode;
  /** Where the tab goes. Defaults to the group's first item. Required for a group with no
   *  items at this scope, or the tab is not drawn. */
  href?: string;
  /** Where the tab goes while its own group is open. Pressing the tab you are already on must
   *  do something, so this is usually the group's index — "up", the way a breadcrumb goes. */
  activeHref?: string;
  hint?: string;
  /** Shown in place of the section row when the group is open with nothing reachable — say
   *  what it needs ("open a property to see these") rather than drawing an empty row. */
  empty?: ReactNode;
  /** Controls that belong to this group only, under its section row while it is open. */
  controls?: ReactNode;
}

export type SubNavLocation = string | { pathname: string; search?: string | URLSearchParams };

export interface SubNavProps {
  /** Accessible name of the strip, e.g. "Pest sections". */
  label: string;
  items: readonly SubNavItem[];
  /** Group order and per-group behaviour. Groups named only by items follow, in first-use
   *  order. */
  groups?: readonly SubNavGroup[];
  /** The group to open when no item is current (a page inside the module that is in no
   *  section). Falls back to the first group. */
  defaultGroup?: string;
  /** The current address. Each item's state is computed with `subNavActive` unless it sets
   *  `active` itself. */
  location?: SubNavLocation;
  /** Module-wide controls, at the trailing edge of the top row. Outside every `<nav>`, so a
   *  screen reader walking the strip is never told a button is a section. */
  actions?: ReactNode;
  /** Controls at the trailing edge of the section row, in every group. An ungrouped strip has
   *  one row, so there they follow `actions`. */
  sectionActions?: ReactNode;
  /** A framework link component (Next's `Link`, or one carrying a pending marker). Default `a`. */
  linkAs?: NavLinkAs;
  className?: string;
}

/* ------------------------------------------------------------- matching */

function splitHref(href: string): { path: string; params: [string, string][] } {
  const noHash = href.split('#')[0];
  const at = noHash.indexOf('?');
  const raw = at < 0 ? noHash : noHash.slice(0, at);
  const query = at < 0 ? '' : noHash.slice(at + 1);
  return { path: normalPath(raw), params: [...new URLSearchParams(query)] };
}

/* Case-insensitive because a property route resolves either way while a strip builds from
   the canonical code, and a trailing slash is the same page. */
function normalPath(path: string): string {
  let p = path;
  try {
    if (/^[a-z][a-z\d+.-]*:/i.test(p)) p = new URL(p).pathname;
  } catch {
    /* not a URL — compare as written */
  }
  if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1);
  return p.toLowerCase();
}

function readLocation(location: SubNavLocation): { path: string; here: URLSearchParams } {
  if (typeof location === 'string') {
    const noHash = location.split('#')[0];
    const at = noHash.indexOf('?');
    return {
      path: normalPath(at < 0 ? noHash : noHash.slice(0, at)),
      here: new URLSearchParams(at < 0 ? '' : noHash.slice(at + 1)),
    };
  }
  return { path: normalPath(location.pathname), here: new URLSearchParams(location.search ?? '') };
}

/**
 * Which items the address is at. Pure, so it runs on a server render and in a test.
 *
 * THE MOST SPECIFIC MATCH WINS, and only it. An item is current when the path matches and
 * the address carries every one of its own query params — and no sibling on the same path
 * is satisfied by MORE of them. Without the last clause `/pest` lights Overview while
 * `?view=report` is showing, and `?property=WIN` lights beside `?property=WIN&view=rating`,
 * because the first is a subset of the second. A tie still lights both, which is the honest
 * answer to two items that genuinely name one address.
 *
 * Params the address carries and the item does not name are ignored — module state riding
 * in the URL is not identity. Use `match` for an item whose `href` carries such state.
 */
export function subNavActive(
  items: readonly Pick<SubNavItem, 'id' | 'href' | 'match'>[],
  location: SubNavLocation,
): Set<string> {
  const { path, here } = readLocation(location);
  const parsed = items.map((it) => ({ id: it.id, ...splitHref(it.match ?? it.href) }));
  const satisfied = (params: [string, string][]) => params.every(([k, v]) => here.get(k) === v);
  const out = new Set<string>();
  for (const it of parsed) {
    if (it.path !== path || !satisfied(it.params)) continue;
    const beaten = parsed.some(
      (o) => o.id !== it.id && o.path === path && o.params.length > it.params.length && satisfied(o.params),
    );
    if (!beaten) out.add(it.id);
  }
  return out;
}

/* --------------------------------------------------------------- render */

const alertText = (a?: SubNavAlert) => (a && a.count > 0 ? `${a.count} ${a.label}` : '');

/* The COUNT is in the accessible name and the mark is only "!", because a strip is
   horizontally tight and a two-digit badge on six tabs wraps the row. The figure is never
   lost — it is in the title, the name, and on the screen the tab opens. */
function AlertDisc({ text }: { text: string }) {
  if (!text) return null;
  return (
    <span className="jrk-subnav__alert" role="img" aria-label={text} title={text}>
      !
    </span>
  );
}

/* A closed group's waiting items, rolled onto its tab. Without this an alert on a section in
   another group is invisible — its row is not on screen — which defeats the point of
   flagging it on the strip at all. */
const rollUp = (items: readonly SubNavItem[]) =>
  items
    .map((it) => alertText(it.alert))
    .filter(Boolean)
    .join(', ');

const DEV = typeof process !== 'undefined' && process.env.NODE_ENV !== 'production';

export function SubNav({
  label,
  items,
  groups,
  defaultGroup,
  location,
  actions,
  sectionActions,
  linkAs,
  className,
}: SubNavProps) {
  const Link = linkAs ?? 'a';
  const computed = location !== undefined ? subNavActive(items, location) : null;
  const isActive = (it: SubNavItem) => it.active ?? computed?.has(it.id) ?? false;

  const grouped = items.some((it) => it.group) || (groups?.length ?? 0) > 0;

  if (!grouped) {
    const trailing = actions || sectionActions;
    return (
      <div className={cx('jrk-subnav', className)}>
        <div className="jrk-subnav__line jrk-subnav__line--tabs">
          <nav className="jrk-tabs jrk-subnav__tabs" aria-label={label}>
            {items.map((it) => (
              <Link
                key={it.id}
                href={it.href}
                className="jrk-tab"
                aria-current={isActive(it) ? 'page' : undefined}
                title={it.hint}
              >
                {it.label}
                <AlertDisc text={alertText(it.alert)} />
              </Link>
            ))}
          </nav>
          {trailing && (
            <div className="jrk-subnav__actions">
              {actions}
              {sectionActions}
            </div>
          )}
        </div>
      </div>
    );
  }

  /* Group order: declared first, then any an item names that was not declared. An item with
     no group falls in the '' group, captioned with the strip's own label. */
  const order: SubNavGroup[] = [...(groups ?? [])];
  for (const it of items) {
    const id = it.group ?? '';
    if (!order.some((g) => g.id === id)) order.push({ id });
  }
  const own = (id: string) => items.filter((it) => (it.group ?? '') === id);

  /* The open group: the one holding a current item, else the declared default, else the first.
     A route inside the module that is in no section still gets a coherent strip. */
  const open =
    order.find((g) => own(g.id).some(isActive))?.id ??
    (defaultGroup !== undefined && order.some((g) => g.id === defaultGroup) ? defaultGroup : order[0]?.id);
  const openGroup = order.find((g) => g.id === open);
  const sections = open === undefined ? [] : own(open);

  /* No segmented control with a single segment: that is a label pretending to be a choice. */
  const body =
    sections.length >= 2 ? (
      <nav
        className="jrk-btn-group jrk-subnav__sections"
        aria-label={`${typeof openGroup?.label === 'string' ? openGroup.label : open || label} sections`}
      >
        {sections.map((it) => (
          <Link
            key={it.id}
            href={it.href}
            className="jrk-btn jrk-btn--ghost jrk-btn--sm"
            aria-current={isActive(it) ? 'page' : undefined}
            title={it.hint}
          >
            {it.label}
            <AlertDisc text={alertText(it.alert)} />
          </Link>
        ))}
      </nav>
    ) : sections.length === 0 && openGroup?.empty ? (
      <p className="jrk-subnav__empty">{openGroup.empty}</p>
    ) : null;

  return (
    <div className={cx('jrk-subnav', 'jrk-subnav--grouped', className)}>
      <div className="jrk-subnav__line jrk-subnav__line--tabs">
        <nav className="jrk-tabs jrk-subnav__tabs" aria-label={label}>
          {order.map((g) => {
            const mine = own(g.id);
            const isOpen = g.id === open;
            const href = (isOpen ? g.activeHref : undefined) ?? g.href ?? mine[0]?.href;
            if (!href) {
              if (DEV) {
                console.warn(
                  `[jrk] <SubNav> group "${g.id}" has no items and no href, so its tab is not drawn. Give it an href so the tab exists at every scope.`,
                );
              }
              return null;
            }
            return (
              <Link
                key={g.id || '(ungrouped)'}
                href={href}
                className="jrk-tab"
                aria-current={isOpen ? 'page' : undefined}
                title={g.hint}
              >
                {g.label ?? (g.id || label)}
                {!isOpen && <AlertDisc text={rollUp(mine)} />}
              </Link>
            );
          })}
        </nav>
        {actions && <div className="jrk-subnav__actions">{actions}</div>}
      </div>
      {(body || sectionActions) && (
        <div className="jrk-subnav__line">
          {body}
          {sectionActions && <div className="jrk-subnav__actions">{sectionActions}</div>}
        </div>
      )}
      {openGroup?.controls}
    </div>
  );
}
