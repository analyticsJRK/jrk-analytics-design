import { useState } from 'react';
import { Menu, MenuItem, MenuLabel, MenuSeparator } from '@jrk/design';

const ExportIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M10 3v9M6.5 8.5L10 12l3.5-3.5M4 15h12" />
  </svg>
);

const ClockIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="10" cy="10" r="7" /><path d="M10 6v4l2.5 2" />
  </svg>
);

/* The ordinary row. `onSelect` runs, then the panel closes and focus returns to
   the trigger — neither half is optional politeness. */
export const Default = () => {
  const [last, setLast] = useState('nothing yet');
  return (
    <div className="jrk-stack" style={{ maxWidth: 420, minHeight: 300 }}>
      <div className="jrk-row" style={{ justifyContent: 'flex-end' }}>
        <Menu label="Actions" defaultOpen>
          <MenuItem icon={<ExportIcon />} onSelect={() => setLast('Export CSV')}>Export CSV</MenuItem>
          <MenuItem icon={<ClockIcon />} onSelect={() => setLast('Schedule report')}>Schedule report</MenuItem>
        </Menu>
      </div>
      <p className="jrk-text-muted" style={{ fontSize: 'var(--jrk-text-xs)' }}>
        Last selected: {last}
      </p>
    </div>
  );
};

/* `danger` is for the destructive row. The LABEL has to say what it destroys —
   colour is never the only signal, so "Remove" alone would not be enough. */
export const Danger = () => (
  <div className="jrk-row" style={{ justifyContent: 'flex-end', maxWidth: 420, minHeight: 260 }}>
    <Menu label="Actions" defaultOpen>
      <MenuItem onSelect={() => {}}>Export CSV</MenuItem>
      <MenuSeparator />
      <MenuItem danger onSelect={() => {}}>Remove from portfolio</MenuItem>
    </Menu>
  </div>
);

/* `disabled` for a row that is temporarily unavailable. A row that can NEVER
   apply on this screen should be omitted, not disabled. */
export const Disabled = () => (
  <div className="jrk-row" style={{ justifyContent: 'flex-end', maxWidth: 420, minHeight: 260 }}>
    <Menu label="Actions" defaultOpen>
      <MenuItem onSelect={() => {}}>Export CSV</MenuItem>
      <MenuItem disabled onSelect={() => {}}>Export XLSX — no July close</MenuItem>
      <MenuItem onSelect={() => {}}>Schedule report</MenuItem>
    </Menu>
  </div>
);

/* `keepOpen` — the narrow exception. These rows toggle parts of a set the reader
   is still adjusting, and dismissing after each one makes the control unusable.
   Everywhere else, leaving it off is the right answer. */
export const KeepOpen = () => {
  const [on, setOn] = useState<string[]>(['occupancy', 'noi']);
  const toggle = (k: string) =>
    setOn((v) => (v.includes(k) ? v.filter((x) => x !== k) : [...v, k]));
  return (
    <div className="jrk-stack" style={{ maxWidth: 420, minHeight: 300 }}>
      <div className="jrk-row" style={{ justifyContent: 'flex-end' }}>
        <Menu label="Columns" width="240px" defaultOpen>
          <MenuLabel>Show columns</MenuLabel>
          {[
            ['occupancy', 'Occupancy'],
            ['noi', 'NOI vs budget'],
            ['delinq', 'Delinquency 30+'],
          ].map(([k, name]) => (
            <MenuItem key={k} keepOpen onSelect={() => toggle(k)}>
              {on.includes(k) ? '✓ ' : '   '}{name}
            </MenuItem>
          ))}
        </Menu>
      </div>
      <p className="jrk-text-muted" style={{ fontSize: 'var(--jrk-text-xs)' }}>
        Showing: {on.join(', ') || 'none'}
      </p>
    </div>
  );
};
