import type { ReactNode } from 'react';
import {
  AppShell,
  Sidebar,
  SidebarAction,
  NavGroup,
  NavItem,
  NavMenu,
  NavMenuItem,
  NavMenuSeparator,
  Main,
  Topbar,
  Content,
  PageHeader,
  Card,
  Badge,
} from '@jrk/design';

/* NavMenu is the rail's second level: a parent row that opens a panel beside the
   rail instead of pushing more rows into it. It only reads truthfully inside the
   real shell grid, so every cell builds one.

   Two things about the harness are load-bearing rather than incidental:

   1. The panel is `position: fixed` — it has to be, because .jrk-sidebar__nav is
      overflow-y:auto and CSS forces the other axis into a scroll container too,
      so any in-flow descendant gets sliced off at the rail's edge. Fixed escapes
      the clip without a portal, which is what keeps this working in the Jinja
      apps that have no React tree to portal into.
   2. Because it is fixed, the component MEASURES the rail and writes
      --jrk-nav-flyout-top / --jrk-nav-flyout-inset. It does not read the rail
      width off a token, so it stays correct in a framed cell like this one where
      the rail does not begin at viewport x=0.

   Harness overrides, both already in the repo's own preview/dashboard.html: the
   shell is viewport-height by design, and the capture viewport is under the
   1024px sidebar breakpoint where shell.css collapses any rail not explicitly
   data-collapsed="false" — an attribute <Sidebar> never emits. */
const frameCss = `
.pv-frame {
  width: 100%;
  max-width: 860px;
  height: 520px;
  overflow: hidden;
  border: 1px solid var(--jrk-border-default);
  border-radius: var(--jrk-radius-2xl);
  background: var(--jrk-surface-canvas);
}
.pv-frame .jrk-app { min-height: 0; height: 100%; }
.pv-frame .jrk-sidebar { height: 100%; position: static; }
.pv-frame .jrk-sidebar:not([data-collapsed='true']) { width: var(--jrk-sidebar-expanded); }
.pv-frame .jrk-topbar { position: static; }
.pv-frame .jrk-content { overflow: hidden; }
`;

const Frame = ({ children }: { children: ReactNode }) => (
  <>
    <style dangerouslySetInnerHTML={{ __html: frameCss }} />
    <div className="pv-frame">{children}</div>
  </>
);

/* The mark is a div, not a span, on purpose: shell.css hides EVERY span inside
   .jrk-sidebar__brand in the collapsed rail, so a span-wrapped logo disappears
   and leaves an empty block. A div keeps the mark and drops the wordmark. */
const Brand = () => (
  <>
    <div
      style={{
        display: 'grid',
        placeItems: 'center',
        width: 24,
        height: 24,
        flexShrink: 0,
        fontSize: 11,
        fontWeight: 'var(--jrk-weight-bold)',
        color: 'var(--jrk-text-inverse)',
        background: 'var(--jrk-accent-solid)',
        borderRadius: 'var(--jrk-radius-md)',
      }}
      aria-hidden="true"
    >
      J
    </div>
    <span>JRK Analytics</span>
  </>
);

const ico = {
  viewBox: '0 0 20 20',
  'aria-hidden': true as const,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

const HomeIcon = () => (
  <svg {...ico}>
    <path d="M3 17V8l7-5 7 5v9" />
    <path d="M8 17v-5h4v5" />
  </svg>
);
const ReportIcon = () => (
  <svg {...ico}>
    <path d="M3 16V9M8 16V4M13 16v-5M18 16V7" />
  </svg>
);
const ClockIcon = () => (
  <svg {...ico}>
    <circle cx="10" cy="10" r="7.5" />
    <path d="M10 5.5V10l3 2" />
  </svg>
);
const LedgerIcon = () => (
  <svg {...ico}>
    <rect x="3" y="3.5" width="14" height="13" rx="1.5" />
    <path d="M3 8h14M8.5 8v8.5" />
  </svg>
);
const PlusIcon = () => (
  <svg {...ico}>
    <path d="M10 4.5v11M4.5 10h11" />
  </svg>
);

/* Parent rows at rest. The caret is the whole reason this reads as a menu rather
   than as a link — Snowsight ships no caret on these rows and you find the second
   level by hovering and hoping. That is discoverability spent on cleanliness, so
   the caret is added back: restraint in decoration, generosity in signifiers.
   It points RIGHT and never rotates, because the panel appears to the right; a
   chevron that swings down is the accordion gesture and promises the wrong thing. */
export const Default = () => (
  <Frame>
    <AppShell>
      <Sidebar brand={<Brand />}>
        <NavGroup>Portfolio</NavGroup>
        <NavItem href="#/overview" icon={<HomeIcon />}>
          Overview
        </NavItem>
        <NavMenu label="Performance" icon={<ReportIcon />}>
          <NavMenuItem href="#/perf/revenue">Revenue &amp; occupancy</NavMenuItem>
          <NavMenuItem href="#/perf/expense">Expense variance</NavMenuItem>
          <NavMenuItem href="#/perf/noi">NOI trend</NavMenuItem>
        </NavMenu>
        <NavMenu label="Collections" icon={<ClockIcon />}>
          <NavMenuItem href="#/collections/delinquency">Delinquency</NavMenuItem>
          <NavMenuItem href="#/collections/aging">Aging buckets</NavMenuItem>
        </NavMenu>
      </Sidebar>
      <Main>
        <Topbar>
          <span style={{ fontWeight: 'var(--jrk-weight-semibold)' }}>Overview</span>
        </Topbar>
        <Content>
          <PageHeader
            title="Rows that open something"
            description="Two parent rows, both closed. The trailing caret is what distinguishes them from Overview."
          />
          <Card title="Closed at rest" subtitle="Nothing opens on hover">
            Click, Enter, Space, ArrowRight and ArrowDown all open the panel. Hover does not — a panel that appears
            because the pointer crossed a row on its way somewhere else covers content nobody asked to have covered.
          </Card>
        </Content>
      </Main>
    </AppShell>
  </Frame>
);

/* Open, via `defaultOpen`. The panel composes on .jrk-menu, so the second nav
   level and the app's other menus are literally the same surface — this adds
   placement, never appearance.
 *
 * The panel is a labelled GROUP of links, never role="menu". That is not
 * pedantry: role="menu" declares application-mode semantics, obliges a roving
 * tabindex and type-ahead, and makes a screen reader announce a set of
 * destinations as if they were commands. These are places. Tab walks them and
 * Escape dismisses. */
export const Open = () => (
  <Frame>
    <AppShell>
      <Sidebar brand={<Brand />}>
        <NavGroup>Portfolio</NavGroup>
        <NavItem href="#/overview" icon={<HomeIcon />}>
          Overview
        </NavItem>
        <NavMenu label="Performance" icon={<ReportIcon />} defaultOpen>
          <NavMenuItem href="#/perf/revenue">Revenue &amp; occupancy</NavMenuItem>
          <NavMenuItem href="#/perf/expense">Expense variance</NavMenuItem>
          <NavMenuItem href="#/perf/noi" active>
            NOI trend
          </NavMenuItem>
          <NavMenuItem href="#/perf/budget">Budget vs actual</NavMenuItem>
          <NavMenuSeparator />
          <NavMenuItem href="#/perf/saved">Saved views</NavMenuItem>
        </NavMenu>
        <NavMenu label="Collections" icon={<ClockIcon />}>
          <NavMenuItem href="#/collections/delinquency">Delinquency</NavMenuItem>
        </NavMenu>
      </Sidebar>
      <Main>
        <Topbar>
          <span style={{ fontWeight: 'var(--jrk-weight-semibold)' }}>NOI trend</span>
        </Topbar>
        <Content>
          <PageHeader title="The panel" description="Separator groups the section's own views from saved ones." />
          <Card title="Current sub-page" subtitle="Accent text plus weight, not a second pill">
            NOI trend is aria-current="page" inside the panel. The parent row already carries the accent pill, and a
            second pill in the panel would be two answers to one question — so this states it in accent text plus
            semibold. Weight is the second channel, which keeps it off colour-as-the-only-signal.
          </Card>
        </Content>
      </Main>
    </AppShell>
  </Frame>
);

/* `active` and open at the same time, which is the case the CSS is ordered for:
   .jrk-nav-item[aria-expanded='true'] sits ABOVE the aria-current block at equal
   specificity, so a row that is both current and open keeps its accent pill and
   does not fall back to the grey. Snowsight paints both states the same quiet
   grey; here they are deliberately different, because "this menu is open" is
   transient and belongs to the pointer while "this is the page you are on" is the
   answer to where-am-I. Move that rule below aria-current and the current page
   silently turns grey whenever its own menu is open. */
export const ActiveSection = () => (
  <Frame>
    <AppShell>
      <Sidebar
        brand={<Brand />}
        actions={
          <>
            <SidebarAction icon={<HomeIcon />} label="Home" href="#/home" active />
            <SidebarAction icon={<PlusIcon />} label="Create" />
          </>
        }
      >
        <NavGroup>Data quality</NavGroup>
        <NavMenu
          label="GL quality"
          icon={<LedgerIcon />}
          active
          defaultOpen
          badge={
            <Badge tone="critical" size="sm" icon={false}>
              12
            </Badge>
          }
        >
          <NavMenuItem href="#/gl/unbalanced" active>
            Unbalanced accounts
          </NavMenuItem>
          <NavMenuItem href="#/gl/missing">Missing closes</NavMenuItem>
          <NavMenuItem href="#/gl/mapping">Mapping exceptions</NavMenuItem>
          <NavMenuSeparator />
          <NavMenuItem href="#/gl/audit">Audit log</NavMenuItem>
        </NavMenu>
        <NavItem href="#/overview" icon={<HomeIcon />}>
          Overview
        </NavItem>
      </Sidebar>
      <Main>
        <Topbar>
          <span style={{ fontWeight: 'var(--jrk-weight-semibold)' }}>Unbalanced accounts</span>
        </Topbar>
        <Content>
          <PageHeader
            title="Current AND open"
            description="The pill survives the open state, and the badge keeps the trailing slot — the caret gives up its auto margin and trails it."
          />
          <Card title="Two states, two treatments" subtitle="aria-current wins over aria-expanded">
            The badge takes margin-inline-start:auto, so when both are present the caret sits after it rather than
            fighting for the same slot.
          </Card>
        </Content>
      </Main>
    </AppShell>
  </Frame>
);

/* The collapsed rail is where the panel's title stops being redundant and starts
   being the only thing that names it: the row's own label is sr-only here, so
   without .jrk-nav-flyout__title the panel would open with no visible heading.
   The caret is dropped outright rather than kept sr-only, because unlike the
   label it is aria-hidden decoration — aria-expanded on the button is what
   announces the disclosure, and that survives the collapse. */
export const CollapsedRail = () => (
  <Frame>
    <AppShell>
      <Sidebar
        collapsed
        brand={<Brand />}
        actions={
          <>
            <SidebarAction icon={<HomeIcon />} label="Home" href="#/home" active />
            <SidebarAction icon={<PlusIcon />} label="Create" />
          </>
        }
      >
        <NavGroup>Data quality</NavGroup>
        <NavMenu label="GL quality" icon={<LedgerIcon />} defaultOpen>
          <NavMenuItem href="#/gl/unbalanced">Unbalanced accounts</NavMenuItem>
          <NavMenuItem href="#/gl/missing">Missing closes</NavMenuItem>
          <NavMenuItem href="#/gl/mapping">Mapping exceptions</NavMenuItem>
        </NavMenu>
        <NavItem href="#/overview" icon={<HomeIcon />}>
          Overview
        </NavItem>
      </Sidebar>
      <Main>
        <Topbar>
          <span style={{ fontWeight: 'var(--jrk-weight-semibold)' }}>GL quality</span>
        </Topbar>
        <Content>
          <PageHeader title="Glyphs only" description="The panel is now the only place the section is named." />
          <Card title="Placement follows the rail" subtitle="Measured, not assumed">
            Collapsing the rail animates its width over 200ms without ever resizing the window, so a one-shot
            measurement would land the panel mid-transition and leave it adrift. A ResizeObserver on the rail re-places
            it on every frame.
          </Card>
        </Content>
      </Main>
    </AppShell>
  </Frame>
);
