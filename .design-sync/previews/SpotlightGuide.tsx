import { useState } from 'react';
import { SpotlightGuide, Button, Card, Stat, StatRow } from '@jrk/design';
import type { SpotlightStep } from '@jrk/design';

/* Teaching a figure in place — the reason this component exists.
 *
 * It is deliberately NOT a product tour. The interface is supposed to need no
 * instruction; the DOMAIN always needs some, and accrual vs cash, T12 and a
 * cadence target are irreducibly technical. A step that explains where the
 * export button lives is a scope failure. A step that explains what a number
 * counted is the job.
 *
 * `derivation` is the part worth using: a number that cannot show its inputs is
 * not finished. */
const STEPS: SpotlightStep[] = [
  {
    id: 'noi',
    /* Targeted by class, not id: <Stat> takes `className` and does not spread
       arbitrary props, which is true of most components here. Any selector
       works; the function form on `target` is the escape hatch for a node you
       cannot put a hook on at all. */
    target: '.pv-noi',
    title: 'NOI vs budget',
    body: 'Net operating income against the approved budget for the same period. Accrual basis, so it counts rent billed rather than rent received — the cash figure sits lower whenever delinquency is rising.',
    basis: 'T12 · accrual basis · 37 properties',
    derivation: [
      { label: 'Actual NOI', value: '$1,580,906' },
      { label: 'Budgeted NOI', value: '$1,478,106' },
      { label: 'Variance', value: '+$102,800', total: true },
    ],
  },
  {
    id: 'delinquency',
    target: '.pv-delinq',
    title: 'Delinquency, 30+ days',
    body: 'Share of billed rent still unpaid 30 days past due. Falling is good here — direction and interpretation are separate facts, and this is the metric where assuming up-is-good gets it backwards.',
    basis: 'As of 29 Jul 2026 · 37 properties',
    derivation: [
      { label: 'Billed rent', value: '$4,486,300' },
      { label: 'Unpaid 30+ days', value: '$210,856' },
      { label: 'Delinquency', value: '4.70%', total: true },
    ],
  },
  {
    /* No target: a step about the page as a whole. The scrim covers everything
       and the callout centres, rather than punching a hole around nothing. */
    id: 'basis',
    title: 'Every figure shares one cut',
    body: 'Both numbers above are the same window, the same basis and the same 37 properties. When a tile mixes cuts it says so on the tile.',
  },
];

function Figures() {
  return (
    <Card title="Operating summary">
      <StatRow>
        <Stat className="pv-noi" label="NOI vs budget" value="+7.0" unit="%" />
        <Stat className="pv-delinq" label="Delinquency 30+" value="4.7" unit="%" />
        <Stat label="Occupancy" value="93.8" unit="%" />
      </StatRow>
    </Card>
  );
}

/* The default. `open` and `stepId` are both owned by the app — see Addressable
   below for why controlling the step is the recommended shape. */
export const Default = () => {
  const [open, setOpen] = useState(false);
  return (
    <div className="jrk-stack" style={{ maxWidth: 620 }}>
      <Figures />
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Explain these figures
      </Button>
      <SpotlightGuide steps={STEPS} open={open} onClose={() => setOpen(false)} />
    </div>
  );
};

/* Controlled step, which is the shape to prefer. philosophy.md's constraint on
   any exploratory affordance is that the state it produces must be CITABLE:
   two people in a meeting reach the same screen, and an audit reproduces it six
   months later. Put `stepId` in the query string and the guide becomes a URL. */
export const Addressable = () => {
  const [open, setOpen] = useState(false);
  const [stepId, setStepId] = useState('delinquency');
  return (
    <div className="jrk-stack" style={{ maxWidth: 620 }}>
      <Figures />
      <div className="jrk-row">
        <Button variant="secondary" onClick={() => { setStepId('delinquency'); setOpen(true); }}>
          Open at ?guide=delinquency
        </Button>
      </div>
      <p className="jrk-text-muted" style={{ fontSize: 'var(--jrk-text-xs)' }}>
        Current step: <code className="jrk-mono">{stepId}</code>
      </p>
      <SpotlightGuide
        steps={STEPS}
        open={open}
        stepId={stepId}
        onStepChange={setStepId}
        onClose={() => setOpen(false)}
      />
    </div>
  );
};

/* A single step is legitimate and common — "what is this number" on one figure,
   with no sequence at all. The footer drops Back and Skip on its own. */
export const SingleStep = () => {
  const [open, setOpen] = useState(false);
  return (
    <div className="jrk-stack" style={{ maxWidth: 620 }}>
      <Figures />
      <Button variant="secondary" onClick={() => setOpen(true)}>
        What is NOI vs budget?
      </Button>
      <SpotlightGuide steps={[STEPS[0]]} open={open} onClose={() => setOpen(false)} />
    </div>
  );
};
