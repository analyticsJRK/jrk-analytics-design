import { BusySpinner, Button, Card, beginBusy, useBusy } from '@jrk/design';

/* Two buttons start writes of different lengths; one spinner covers both, and it
   stays up until the longer one ends. */
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

function Writer() {
  const { count } = useBusy();
  const run = async (label: string, ms: number) => {
    const end = beginBusy(label);
    try {
      await wait(ms);
    } finally {
      end();
    }
  };
  return (
    <Card title="Snow plan · Harbor Point" subtitle={count ? `${count} write(s) in flight` : 'Nothing saving'}>
      <div className="jrk-row">
        <Button variant="primary" onClick={() => run('Saving plan…', 1500)}>Save plan</Button>
        <Button onClick={() => run('Approving bid…', 3000)}>Approve bid</Button>
      </div>
    </Card>
  );
}

export const Default = () => (
  <div style={{ minHeight: 260, maxWidth: 460 }}>
    <Writer />
    <BusySpinner />
  </div>
);
