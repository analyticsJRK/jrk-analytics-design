import type { ReactNode } from 'react';
import { AppShell, Sidebar, NavGroup, NavItem, Main, Topbar, Content, PageHeader, Card, BrandMark, Button, Avatar } from '@jrk/design';
import type { NavLinkProps } from '@jrk/design';

/* The masthead form: one bar across the whole window, the rail hanging beneath it. The
   harness pins the frame's height and turns the sticky parts static, as every shell
   preview does. */
const frameCss = `
.pv-frame {
  width: 100%;
  max-width: 860px;
  height: 420px;
  overflow: hidden;
  border: 1px solid var(--jrk-border-default);
  border-radius: var(--jrk-radius-2xl);
  background: var(--jrk-surface-canvas);
}
.pv-frame .jrk-topbar { position: static; }
.pv-frame .jrk-app { min-height: 0; height: calc(100% - var(--jrk-topbar-default)); }
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

const masthead = (
  <Topbar vivid tone="brand" masthead>
    <BrandMark href="/" linkAs={DemoLink} mark="J" name="JRK Analytics" />
    <span className="jrk-spacer" />
    <span className="jrk-topbar__user">
      <Avatar initials="AL" />
      <span className="jrk-topbar__user-name">Avery Lin</span>
    </span>
    <Button variant="ghost">Sign Out</Button>
  </Topbar>
);

/* The mark takes the bar's ink as its fill: navy on the pale light ramp, white on the
   dark one — the inverse of the wordmark beside it, so it measures what the text does. */
export const Masthead = () => (
  <Frame>
    <AppShell masthead={masthead}>
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
      </Sidebar>
      <Main>
        <Content>
          <PageHeader title="Pest Control" description="The bar spans the window; the rail starts under it." />
          <Card title="Masthead" subtitle="Topbar masthead + AppShell masthead" />
        </Content>
      </Main>
    </AppShell>
  </Frame>
);

/* In the rail's own brand row, for a shell with no masthead. */
export const InRail = () => (
  <Frame>
    <AppShell>
      <Sidebar brand={<BrandMark mark="J" name="JRK Analytics" />}>
        <NavItem href="/pest" glyph="🐛" active linkAs={DemoLink}>
          Pest Control
        </NavItem>
        <NavItem href="/marketing" glyph="📣" linkAs={DemoLink}>
          Marketing
        </NavItem>
      </Sidebar>
      <Main>
        <Topbar>
          <span style={{ fontWeight: 'var(--jrk-weight-semibold)' }}>Pest Control</span>
        </Topbar>
        <Content>
          <PageHeader title="Pest Control" />
        </Content>
      </Main>
    </AppShell>
  </Frame>
);
