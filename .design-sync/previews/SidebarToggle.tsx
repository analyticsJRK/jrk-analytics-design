import { useState } from 'react';
import type { ReactNode } from 'react';
import { AppShell, Sidebar, SidebarToggle, NavGroup, NavItem, Main, Content, PageHeader, Card } from '@jrk/design';
import type { NavLinkProps } from '@jrk/design';

const frameCss = `
.pv-frame {
  width: 100%;
  max-width: 860px;
  height: 400px;
  overflow: hidden;
  border: 1px solid var(--jrk-border-default);
  border-radius: var(--jrk-radius-2xl);
  background: var(--jrk-surface-canvas);
}
.pv-frame .jrk-app { min-height: 0; height: 100%; }
.pv-frame .jrk-sidebar { height: 100%; position: sticky; }
.pv-frame .jrk-sidebar:not([data-collapsed='true']) { width: var(--jrk-rail-width); }
`;

const Frame = ({ children }: { children: ReactNode }) => (
  <>
    <style dangerouslySetInnerHTML={{ __html: frameCss }} />
    <div className="pv-frame">{children}</div>
  </>
);

const DemoLink = (props: NavLinkProps) => <a {...props} onClick={(e) => e.preventDefault()} />;

function Shell({ start }: { start: boolean }) {
  const [collapsed, setCollapsed] = useState(start);
  return (
    <AppShell>
      <Sidebar
        collapsed={collapsed}
        peek
        footer={<SidebarToggle collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />}
      >
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
        <NavItem href="/utility" glyph="⚡" disabled title="Utility — coming soon" linkAs={DemoLink}>
          Utility
        </NavItem>
      </Sidebar>
      <Main>
        <Content>
          <PageHeader title="Pest Control" description="Hover the collapsed rail to peek; the page does not move." />
          <Card title="Peek is not a choice" subtitle="Expand is still how the rail stays open" />
        </Content>
      </Main>
    </AppShell>
  );
}

/* Collapsed, with `peek`: the chevron sits on the icon column and points the way the rail
   will move. */
export const Collapsed = () => (
  <Frame>
    <Shell start />
  </Frame>
);

export const Expanded = () => (
  <Frame>
    <Shell start={false} />
  </Frame>
);
