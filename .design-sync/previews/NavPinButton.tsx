import { useState } from 'react';
import type { ReactNode } from 'react';
import { AppShell, Sidebar, NavGroup, NavItem, NavPinButton, Main, Content, PageHeader } from '@jrk/design';
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

const MODULES = [
  { id: 'pest', label: 'Pest Control', glyph: '🐛' },
  { id: 'marketing', label: 'Marketing', glyph: '📣' },
  { id: 'snow', label: 'Snow Tracker', glyph: '❄️' },
  { id: 'repairs', label: 'Required Repairs', glyph: '🛠️' },
];

/* Pinned rows keep the pin lit; the rest show it on hover or focus. The Pinned list's own
   rows carry the `remove` cross instead. */
export const Default = () => {
  const [pins, setPins] = useState(['pest', 'repairs']);
  const toggle = (id: string) => setPins((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  return (
    <Frame>
      <AppShell>
        <Sidebar>
          <NavGroup>Pinned</NavGroup>
          {MODULES.filter((m) => pins.includes(m.id)).map((m) => (
            <NavItem
              key={m.id}
              href={`/${m.id}`}
              glyph={m.glyph}
              linkAs={DemoLink}
              actions={<NavPinButton remove label={m.label} onToggle={() => toggle(m.id)} />}
            >
              {m.label}
            </NavItem>
          ))}
          <NavGroup>Browse</NavGroup>
          {MODULES.map((m) => (
            <NavItem
              key={m.id}
              href={`/${m.id}`}
              glyph={m.glyph}
              linkAs={DemoLink}
              actions={<NavPinButton label={m.label} pinned={pins.includes(m.id)} onToggle={() => toggle(m.id)} />}
            >
              {m.label}
            </NavItem>
          ))}
        </Sidebar>
        <Main>
          <Content>
            <PageHeader title="Pins" description="Hover a Browse row to reach its pin; tab to it from the keyboard." />
          </Content>
        </Main>
      </AppShell>
    </Frame>
  );
};
