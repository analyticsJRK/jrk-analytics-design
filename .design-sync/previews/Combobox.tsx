import { useState } from 'react';
import { Combobox } from '@jrk/design';

const PROPERTIES = [
  { value: 'HBP', label: 'Harbor Point', hint: 'HBP' },
  { value: 'BLC', label: 'Bellevue Commons', hint: 'BLC' },
  { value: 'RVF', label: 'Riverside Flats', hint: 'RVF' },
  { value: 'TEM', label: 'Terra Mar', hint: 'TEM' },
  { value: 'CKN', label: 'Chase Knolls', hint: 'CKN' },
  { value: 'MAN', label: 'Manchester Lakes', hint: 'MAN' },
  { value: 'CPC', label: 'Cypress Cove', hint: 'CPC' },
  { value: 'SFV', label: 'Sun Valley', hint: 'SFV' },
  { value: 'WIN', label: 'Windsor Park', hint: 'WIN' },
  { value: 'LBC', label: 'Lake Bluff Commons', hint: 'LBC' },
  { value: 'CBA', label: 'Cambridge Arms', hint: 'CBA' },
  { value: '1250', label: '1250 Lasalle', hint: '1LS' },
];

/* A property picker with a visible label. Type on the closed button to open it
   already searching; "lasalle" finds "1250 Lasalle", which a native select's
   type-ahead cannot. */
export const Default = () => {
  const [code, setCode] = useState('RVF');
  return (
    <div style={{ maxWidth: 320, minHeight: 380 }}>
      <label className="jrk-field__label" htmlFor="pick-property">Property</label>
      <Combobox id="pick-property" value={code} onChange={setCode} options={PROPERTIES} />
    </div>
  );
};

/* A blank first choice, for a filter that may be unset. */
export const WithEmptyChoice = () => {
  const [code, setCode] = useState('');
  return (
    <div style={{ maxWidth: 320 }}>
      <Combobox
        label="Property"
        value={code}
        onChange={setCode}
        emptyLabel="All properties"
        placeholder="All properties"
        options={PROPERTIES}
        size="sm"
      />
    </div>
  );
};

/* Adding several in a row: the list stays open and picked values leave it. */
export const StayOpen = () => {
  const [picked, setPicked] = useState<string[]>(['HBP']);
  return (
    <div style={{ maxWidth: 320 }}>
      <Combobox
        label="Add a property"
        value=""
        placeholder="Add a property…"
        stayOpen
        onChange={(v) => setPicked((p) => (v && !p.includes(v) ? [...p, v] : p))}
        options={PROPERTIES.filter((o) => !picked.includes(o.value))}
      />
      <p className="jrk-caption">{picked.join(', ')}</p>
    </div>
  );
};
