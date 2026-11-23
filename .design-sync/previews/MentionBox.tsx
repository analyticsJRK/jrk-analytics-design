import { useState } from 'react';
import { MentionBox, Badge } from '@jrk/design';
import type { MentionPerson } from '@jrk/design';

const PEOPLE: MentionPerson[] = [
  { id: 'druiz@example.com', label: 'Dana Ruiz', hint: 'druiz@example.com' },
  { id: 'mmccoy@example.com', label: 'Max McCoy', hint: 'mmccoy@example.com' },
  { id: 'msussman@example.com', label: 'Matt Sussman', hint: 'msussman@example.com' },
  { id: 'group:legal', label: 'Legal team', hint: 'Group · 4 people' },
];

/* Type `@Ma` to open the list. The tag already in the text is highlighted and
   reported; delete it and it leaves the list below. */
export const Default = () => {
  const [text, setText] = useState('Ask @Dana Ruiz to confirm the vendor visit at Harbor Point.');
  const [tagged, setTagged] = useState<string[]>(['druiz@example.com']);
  return (
    <div className="jrk-stack" style={{ maxWidth: 460, minHeight: 260 }}>
      <MentionBox
        value={text}
        people={PEOPLE}
        rows={3}
        aria-label="Note"
        onChange={(next, mentions) => {
          setText(next);
          setTagged(mentions);
        }}
      />
      <div className="jrk-row">
        <span className="jrk-caption">Tagged:</span>
        {tagged.length ? tagged.map((id) => <Badge key={id} tone="accent">{id}</Badge>) : <span className="jrk-caption">nobody</span>}
      </div>
    </div>
  );
};
