import type { ReactNode } from 'react';
import {
  AppShell,
  Sidebar,
  SidebarAction,
  NavGroup,
  NavItem,
  Main,
  Topbar,
  Content,
  PageHeader,
  Card,
} from '@jrk/design';

/* The rail's action row: the verbs, above a hairline, separated from the nouns.
   Home / Create / Search are things you DO; everything in the nav below is a
   place you GO. Snowsight splits them this way and it is why its rail stays
   short — the actions never compete with the destinations for a row.

   These render only inside .jrk-sidebar__actions, which <Sidebar actions={…}>
   supplies, so every cell builds a real shell.

   Harness overrides, both already in the repo's own preview/dashboard.html: the
   shell is viewport-height by design, and the capture viewport is under the
   1024px sidebar breakpoint where shell.css collapses any rail not explicitly
   data-collapsed="false" — an attribute <Sidebar> never emits. */
const frameCss = `
.pv-frame {
  width: 100%;
  max-width: 860px;
  height: 460px;
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
   .jrk-sidebar__brand in the collapsed rail. */
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
const PlusIcon = () => (
  <svg {...ico}>
    <path d="M10 4.5v11M4.5 10h11" />
  </svg>
);
const SearchIcon = () => (
  <svg {...ico}>
    <circle cx="9" cy="9" r="5.5" />
    <path d="M13 13l3.5 3.5" />
  </svg>
);
const ReportIcon = () => (
  <svg {...ico}>
    <path d="M3 16V9M8 16V4M13 16v-5M18 16V7" />
  </svg>
);

/* Home is a destination that happens to live in this row, so it takes the same
   accent pill the nav rows use — it is still the answer to where-am-I. Create and
   Search are verbs and stay quiet until hovered.
 *
 * `label` is required, and that is the entire reason this component exists rather
 * than a bare <button> with a class. An icon-only control has to carry an
 * accessible name and a tooltip; `label` feeds both aria-label and title, so
 * there is no way to render a nameless one. */
export const Default = () => (
  <Frame>
    <AppShell>
      <Sidebar
        brand={<Brand />}
        actions={
          <>
            <SidebarAction icon={<HomeIcon />} label="Home" href="#/home" active />
            <SidebarAction icon={<PlusIcon />} label="Create" />
            <SidebarAction icon={<SearchIcon />} label="Search" />
          </>
        }
      >
        <NavGroup>Portfolio</NavGroup>
        <NavItem href="#/overview" icon={<ReportIcon />}>
          Overview
        </NavItem>
        <NavItem href="#/properties" icon={<HomeIcon />}>
          Properties
        </NavItem>
      </Sidebar>
      <Main>
        <Topbar>
          <span style={{ fontWeight: 'var(--jrk-weight-semibold)' }}>Home</span>
        </Topbar>
        <Content>
          <PageHeader title="Verbs above the hairline" description="Three actions; the nav below holds destinations." />
          <Card title="Two elements, one class" subtitle="href renders an anchor, no href renders a button">
            Home navigates, so it is an anchor. Create and Search invoke, so they are buttons with type="button". The
            class and the geometry are identical either way.
          </Card>
        </Content>
      </Main>
    </AppShell>
  </Frame>
);

/* Only include a rail Search if the shell has NO topbar. This cell is the
   counter-example on purpose: the topbar already owns a search field, so the
   third action is dropped. Two entry points to one mechanism is the
   parallel-navigation failure in miniature, and the rule is that the sidebar,
   the breadcrumb and the tabs answer three different questions — one mechanism
   each, never one question twice. */
export const WithTopbarSearch = () => (
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
        <NavGroup>Portfolio</NavGroup>
        <NavItem href="#/overview" icon={<ReportIcon />}>
          Overview
        </NavItem>
      </Sidebar>
      <Main>
        <Topbar>
          <span className="jrk-input-group jrk-topbar__search">
            <span className="jrk-input-group__icon">
              <SearchIcon />
            </span>
            <input
              className="jrk-input jrk-input--sm jrk-input--filled"
              placeholder="Search properties, units, tenants"
              aria-label="Search"
            />
          </span>
        </Topbar>
        <Content>
          <PageHeader title="Two actions, not three" description="Search lives in the topbar, so it is not in the rail." />
          <Card title="One question, one mechanism" subtitle="A rail search belongs here only if the topbar goes">
            Snowsight's rail carries Search because Snowsight has no topbar. Copying the row wholesale into a shell that
            keeps its topbar ships the same affordance twice.
          </Card>
        </Content>
      </Main>
    </AppShell>
  </Frame>
);

/* Collapsed, three 28px squares cannot sit side by side in a 52px rail, so the
   row becomes a column. It must never gain flex-wrap to do that: a wrapping
   COLUMN container goes multi-line and align-content:stretch then inflates every
   line, which tripled a grid's height in this library once already. */
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
            <SidebarAction icon={<SearchIcon />} label="Search" />
          </>
        }
      >
        <NavGroup>Portfolio</NavGroup>
        <NavItem href="#/overview" icon={<ReportIcon />}>
          Overview
        </NavItem>
        <NavItem href="#/properties" icon={<HomeIcon />}>
          Properties
        </NavItem>
      </Sidebar>
      <Main>
        <Topbar>
          <span style={{ fontWeight: 'var(--jrk-weight-semibold)' }}>Home</span>
        </Topbar>
        <Content>
          <PageHeader title="Stacked, not wrapped" description="flex-direction: column — never flex-wrap." />
          <Card title="The tooltip is now the only label" subtitle="Which is why label is required">
            Nothing in the rail is named in the collapsed state, so title and aria-label are carrying the whole row.
          </Card>
        </Content>
      </Main>
    </AppShell>
  </Frame>
);
