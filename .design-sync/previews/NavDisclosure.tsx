import { useState } from 'react';
import type { ReactNode } from 'react';
import { AppShell, Sidebar, NavGroup, NavItem, NavDisclosure, NavPinButton, Main, Content, PageHeader, Card, Icon } from '@jrk/design';
import type { NavLinkProps } from '@jrk/design';

/* The rail only reads truthfully inside its grid, so every cell builds the real shell.
   Harness overrides as in NavItem.tsx: the shell is viewport-height by design, and the
   capture viewport is under the 1024px breakpoint that auto-collapses the rail. */
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
.pv-frame .jrk-sidebar:not([data-collapsed='true']) { width: var(--jrk-rail-width); }
.pv-frame .jrk-content { overflow: hidden; }
`;

const Frame = ({ children }: { children: ReactNode }) => (
  <>
    <style dangerouslySetInnerHTML={{ __html: frameCss }} />
    <div className="pv-frame">{children}</div>
  </>
);

const DemoLink = (props: NavLinkProps) => <a {...props} onClick={(e) => e.preventDefault()} />;
const chevron = <Icon name="chevronRight" />;

function Rail({ collapsed }: { collapsed?: boolean }) {
  const [pins, setPins] = useState<string[]>(['pest']);
  const pin = (id: string) => (
    <NavPinButton
      label={id === 'pest' ? 'Pest Control' : 'Marketing'}
      pinned={pins.includes(id)}
      onToggle={() => setPins((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))}
    />
  );
  return (
    <Sidebar collapsed={collapsed}>
      <NavItem href="/" glyph="🧭" count={24} linkAs={DemoLink}>
        All modules
      </NavItem>
      <NavGroup>Asset Management</NavGroup>
      <NavDisclosure href="/pest" label="Pest Control" glyph="🐛" active actions={pin('pest')} linkAs={DemoLink}>
        <NavItem sub href="/pest" icon={chevron} active linkAs={DemoLink}>
          Overview
        </NavItem>
        <NavItem sub href="/pest/property" icon={chevron} linkAs={DemoLink}>
          Property
        </NavItem>
        <NavItem sub href="/pest/settings" icon={chevron} linkAs={DemoLink}>
          Admin
        </NavItem>
      </NavDisclosure>
      <NavDisclosure href="/marketing" label="Marketing" glyph="📣" actions={pin('marketing')} linkAs={DemoLink}>
        <NavItem sub href="/marketing/funnel" icon={chevron} linkAs={DemoLink}>
          Funnel
        </NavItem>
      </NavDisclosure>
      <NavItem href="/snow2" glyph="❄️" linkAs={DemoLink}>
        Snow Tracker
      </NavItem>
    </Sidebar>
  );
}

/* The row navigates; the caret discloses. Pest is the module you are in, so its list is
   open on its own; Marketing's opens from its caret. The pin appears on hover and stays
   lit on a pinned row. */
export const Default = () => (
  <Frame>
    <AppShell>
      <Rail />
      <Main>
        <Content>
          <PageHeader title="Pest Control" description="Press Marketing's caret to open its sections." />
          <Card title="Two controls, one row" subtitle="The label is a link; the caret is a button beside it" />
        </Content>
      </Main>
    </AppShell>
  </Frame>
);

/* Collapsed: the caret and pin go, the open list stays as its chevrons, and every icon
   is on the pixel it occupies in the open rail. */
export const Collapsed = () => (
  <Frame>
    <AppShell>
      <Rail collapsed />
      <Main>
        <Content>
          <PageHeader title="Pest Control" description="One layout, two widths." />
        </Content>
      </Main>
    </AppShell>
  </Frame>
);
