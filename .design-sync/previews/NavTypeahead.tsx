import type { ReactNode } from 'react';
import { AppShell, Sidebar, NavGroup, NavItem, Main, Content, PageHeader, SubNav, NavTypeahead, Card } from '@jrk/design';
import type { NavLinkProps } from '@jrk/design';

/* NavTypeahead draws nothing: it is the keyboard behaviour over the rail and the strips.
   This cell is the shell it works on. Click anywhere on the page, then type — "pr" lands
   on Property, "pp" cycles through every P, "snow" falls through to the rail. */
const frameCss = `
.pv-frame {
  width: 100%;
  max-width: 860px;
  height: 440px;
  overflow: hidden;
  border: 1px solid var(--jrk-border-default);
  border-radius: var(--jrk-radius-2xl);
  background: var(--jrk-surface-canvas);
}
.pv-frame .jrk-app { min-height: 0; height: 100%; }
.pv-frame .jrk-sidebar { height: 100%; position: static; }
.pv-frame .jrk-sidebar:not([data-collapsed='true']) { width: var(--jrk-rail-width); }
`;

const Frame = ({ children }: { children: ReactNode }) => (
  <>
    <style dangerouslySetInnerHTML={{ __html: frameCss }} />
    <div className="pv-frame">{children}</div>
  </>
);

const DemoLink = (props: NavLinkProps) => <a {...props} onClick={(e) => e.preventDefault()} />;

export const Default = () => (
  <Frame>
    <AppShell>
      <Sidebar>
        <NavItem href="/" glyph="🧭" linkAs={DemoLink}>
          All modules
        </NavItem>
        <NavGroup>Asset Management</NavGroup>
        <NavItem href="/pest" glyph="🐛" active linkAs={DemoLink}>
          Pest Control
        </NavItem>
        <NavItem href="/marketing" glyph="📣" linkAs={DemoLink}>
          Marketing
        </NavItem>
        <NavItem href="/snow2" glyph="❄️" linkAs={DemoLink}>
          Snow Tracker
        </NavItem>
      </Sidebar>
      <Main>
        <Content>
          <PageHeader title="Pest Control" description="Type a name to move focus; Enter opens it." />
          <SubNav
            label="Pest sections"
            location="/pest"
            linkAs={DemoLink}
            groups={[{ id: 'Overview' }, { id: 'Property', href: '/pest/property' }, { id: 'Admin' }]}
            items={[
              { id: 'portfolio', group: 'Overview', label: 'Portfolio', href: '/pest' },
              { id: 'action', group: 'Overview', label: 'Action Center', href: '/pest?view=report' },
              { id: 'financials', group: 'Overview', label: 'Financials', href: '/pest/financials' },
              { id: 'live', group: 'Admin', label: 'Live status', href: '/pest/admin' },
            ]}
          />
          <Card title="Search order" subtitle="Section row first, then the tabs, then the rail" />
          <NavTypeahead />
        </Content>
      </Main>
    </AppShell>
  </Frame>
);
