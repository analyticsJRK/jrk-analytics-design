import type { ReactNode } from 'react';
import { AppShell, Sidebar, NavGroup, NavItem, Main, Topbar, Content, PageHeader, Card, Badge, Status } from '@jrk/design';

/* NavGroup is a section HEADING, not a wrapper: it renders one
   .jrk-sidebar__group div, and the NavItems it labels are its SIBLINGS inside
   <Sidebar>'s .jrk-sidebar__nav flex column. Nesting items inside it would put
   them under the uppercase-caption padding and, in the collapsed rail, under the
   opacity:0 that hides the heading. So every cell here shows headings interleaved
   with the items they caption, inside the real rail inside the real shell grid.

   Harness overrides (both already in the repo's own preview/dashboard.html): the
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
   and leaves an empty 56px block. A div keeps the mark and drops the wordmark. */
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

const ico = { viewBox: '0 0 20 20', 'aria-hidden': true as const, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

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
const AdjustIcon = () => (
  <svg {...ico}>
    <path d="M3 6.5h14M3 13.5h14" />
    <circle cx="7.5" cy="6.5" r="2.2" />
    <circle cx="12.5" cy="13.5" r="2.2" />
  </svg>
);
const ChargesIcon = () => (
  <svg {...ico}>
    <rect x="4" y="2.5" width="12" height="15" rx="1.5" />
    <path d="M7.5 7h5M7.5 10.5h5M7.5 14h3" />
  </svg>
);
const LeaseIcon = () => (
  <svg {...ico}>
    <path d="M5 2.5h7.5L16 6v11.5H5z" />
    <path d="M7.5 11.5l2 2 3.5-4.5" />
  </svg>
);
const LedgerIcon = () => (
  <svg {...ico}>
    <rect x="3" y="3.5" width="14" height="13" rx="1.5" />
    <path d="M3 8h14M8.5 8v8.5" />
  </svg>
);
const CogIcon = () => (
  <svg {...ico}>
    <circle cx="10" cy="10" r="3" />
    <path d="M10 2.5v2M10 15.5v2M17.5 10h-2M4.5 10h-2M15.3 4.7l-1.4 1.4M6.1 13.9l-1.4 1.4M15.3 15.3l-1.4-1.4M6.1 6.1L4.7 4.7" />
  </svg>
);
const RunsIcon = () => (
  <svg {...ico}>
    <path d="M16.5 10a6.5 6.5 0 11-2.3-4.9" />
    <path d="M17 3.5v3.5h-3.5" />
  </svg>
);
const CalendarIcon = () => (
  <svg {...ico}>
    <rect x="3" y="4" width="14" height="13" rx="2" />
    <path d="M3 8h14M7 2v4M13 2v4" />
  </svg>
);
const PlugIcon = () => (
  <svg {...ico}>
    <path d="M7 2.5v5M13 2.5v5" />
    <path d="M4.5 7.5h11v2a5.5 5.5 0 01-11 0z" />
    <path d="M10 15v2.5" />
  </svg>
);
const UsersIcon = () => (
  <svg {...ico}>
    <circle cx="8" cy="7" r="3" />
    <path d="M2.5 17c0-3 2.5-5 5.5-5s5.5 2 5.5 5" />
    <path d="M14 5.5a2.75 2.75 0 010 5.5" />
  </svg>
);
const KeyIcon = () => (
  <svg {...ico}>
    <circle cx="6.5" cy="10" r="3.5" />
    <path d="M10 10h7.5M15 10v3" />
  </svg>
);
const PenIcon = () => (
  <svg {...ico}>
    <path d="M3 13.5L12.5 4l3.5 3.5L6.5 17H3z" />
    <path d="M11 5.5l3.5 3.5" />
  </svg>
);

/* One ungrouped destination on top, then two captioned sections — the heading
   is what tells Home from a section member. */
export const Default = () => (
  <Frame>
    <AppShell>
      <Sidebar brand={<Brand />}>
        <NavItem href="#/home" icon={<HomeIcon />} active>
          Home
        </NavItem>
        <NavGroup>Portfolio</NavGroup>
        <NavItem href="#/portfolio/am-report" icon={<ReportIcon />}>
          AM Report
        </NavItem>
        <NavItem href="#/portfolio/adjustments" icon={<AdjustIcon />}>
          Adjustments
        </NavItem>
        <NavItem href="#/portfolio/charges" icon={<ChargesIcon />}>
          Charges
        </NavItem>
        <NavGroup>Audits</NavGroup>
        <NavItem href="#/audits/lease" icon={<LeaseIcon />}>
          Lease Audit
        </NavItem>
        <NavItem href="#/audits/gl" icon={<LedgerIcon />}>
          GL Audit
        </NavItem>
      </Sidebar>
      <Main>
        <Topbar>
          <span style={{ fontWeight: 'var(--jrk-weight-semibold)' }}>Home</span>
          <span className="jrk-spacer" />
          <Status tone="good" pulse>
            Synced 4m ago
          </Status>
        </Topbar>
        <Content>
          <PageHeader
            title="Section headings"
            description="PORTFOLIO and AUDITS are NavGroups; the anchors under each are its siblings."
          />
          <Card title="Why the heading is a sibling" subtitle="jrk-sidebar__nav is the flex column">
            NavGroup renders one .jrk-sidebar__group caption. The rail's 2px row gap and the collapsed-rail fade both
            key off it being a peer of the anchors, not their parent.
          </Card>
        </Content>
      </Main>
    </AppShell>
  </Frame>
);

/* Back-to-back sections, no ungrouped items: two headings carry the whole rail
   and every anchor belongs to one of them. */
export const AutomationAndAdmin = () => (
  <Frame>
    <AppShell>
      <Sidebar
        brand={<Brand />}
        footer={
          <NavItem href="#/home" icon={<HomeIcon />}>
            Home
          </NavItem>
        }
      >
        <NavGroup>Automation</NavGroup>
        <NavItem href="#/automation/jobs" icon={<CogIcon />}>
          Jobs
        </NavItem>
        <NavItem href="#/automation/runs" icon={<RunsIcon />} badge={<Badge tone="serious" size="sm" icon={false}>2</Badge>}>
          Runs
        </NavItem>
        <NavItem href="#/automation/schedules" icon={<CalendarIcon />}>
          Schedules
        </NavItem>
        <NavItem href="#/automation/integrations" icon={<PlugIcon />} active>
          Integrations
        </NavItem>
        <NavGroup>Admin</NavGroup>
        <NavItem href="#/admin/form-builder" icon={<PenIcon />}>
          Form Builder
        </NavItem>
        <NavItem href="#/admin/users" icon={<UsersIcon />}>
          Users
        </NavItem>
        <NavItem href="#/admin/api-keys" icon={<KeyIcon />}>
          API Keys
        </NavItem>
      </Sidebar>
      <Main>
        <Topbar>
          <span style={{ fontWeight: 'var(--jrk-weight-semibold)' }}>Integrations</span>
          <span className="jrk-spacer" />
          <Status tone="serious">2 runs failed</Status>
        </Topbar>
        <Content>
          <PageHeader title="Integrations" description="Yardi, Entrata and the GL export connector." />
          <Card title="Connectors" subtitle="AUTOMATION and ADMIN both captioned">
            Yardi Voyager · Entrata · SFTP drop · Snowflake share
          </Card>
        </Content>
      </Main>
    </AppShell>
  </Frame>
);

/* In the collapsed rail the heading text goes to opacity 0 by design — it keeps
   its box, so the sections still read as separated bands of icons while the
   caption stops competing with them at 64px wide. */
export const CollapsedRail = () => (
  <Frame>
    <AppShell>
      <Sidebar collapsed brand={<Brand />}>
        <NavItem href="#/home" icon={<HomeIcon />} active>
          Home
        </NavItem>
        <NavGroup>Portfolio</NavGroup>
        <NavItem href="#/portfolio/am-report" icon={<ReportIcon />}>
          AM Report
        </NavItem>
        <NavItem href="#/portfolio/adjustments" icon={<AdjustIcon />}>
          Adjustments
        </NavItem>
        <NavItem href="#/portfolio/charges" icon={<ChargesIcon />}>
          Charges
        </NavItem>
        <NavGroup>Audits</NavGroup>
        <NavItem href="#/audits/lease" icon={<LeaseIcon />}>
          Lease Audit
        </NavItem>
        <NavItem href="#/audits/gl" icon={<LedgerIcon />}>
          GL Audit
        </NavItem>
      </Sidebar>
      <Main>
        <Topbar>
          <span style={{ fontWeight: 'var(--jrk-weight-semibold)' }}>Home</span>
          <span className="jrk-spacer" />
          <Status tone="good" pulse>
            Synced 4m ago
          </Status>
        </Topbar>
        <Content>
          <PageHeader
            title="Headings in the icon rail"
            description="Same two NavGroups as Default — faded out, still holding their space."
          />
          <Card title="Compare with Default" subtitle="Identical nav tree, collapsed rail">
            The gap between the Home icon and the AM Report icon is the PORTFOLIO caption's box, and the second gap is
            AUDITS. The text stays in the accessibility tree.
          </Card>
        </Content>
      </Main>
    </AppShell>
  </Frame>
);
