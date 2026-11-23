import { useState } from 'react';
import { Modal, Button, Input, Select } from '@jrk/design';

/* A heading and one sentence — the body closes the gap to its title on its own. */
export const Confirm = () => {
  const [open, setOpen] = useState(true);
  return (
    <div style={{ minHeight: 320 }}>
      <Button onClick={() => setOpen(true)}>Why is Cascades flagged?</Button>
      <Modal
        open={open}
        title="Why Cascades is flagged"
        description="Lease audit · September 2026"
        onClose={() => setOpen(false)}
      >
        <p>
          Three leases at Cascades bill water through RUBS while the property is on a
          flat utility fee, so <strong>$1,284</strong> a month is charged twice.
        </p>
      </Modal>
    </div>
  );
};

/* A form in a small dialog. The field stack keeps a leading edge; the footer is
   the commit row and stays on screen however tall the body grows. */
export const Form = () => {
  const [open, setOpen] = useState(true);
  return (
    <div style={{ minHeight: 420 }}>
      <Button onClick={() => setOpen(true)}>Escalate accounts</Button>
      <Modal
        open={open}
        size="sm"
        title="Escalate 3 accounts?"
        onClose={() => setOpen(false)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button variant="danger-solid" onClick={() => setOpen(false)}>Escalate</Button>
          </>
        }
      >
        <form className="jrk-stack">
          <label className="jrk-field">
            <span className="jrk-field__label">Reason</span>
            <Select defaultValue="60">
              <option value="60">Over 60 days past due</option>
              <option value="90">Over 90 days past due</option>
            </Select>
          </label>
          <label className="jrk-field">
            <span className="jrk-field__label">Note for the site team</span>
            <Input placeholder="Harbor Point · units 204, 311, 318" />
          </label>
        </form>
      </Modal>
    </div>
  );
};
