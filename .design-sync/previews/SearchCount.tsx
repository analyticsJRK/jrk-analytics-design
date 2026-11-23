import { SearchCount } from '@jrk/design';

/* The two shapes. The noun agrees with the total in both, so a search narrowed to
   one row reads "1 of 43 properties", not "1 of 43 property". */
export const Default = () => (
  <div style={{ display: 'grid', gap: 'var(--jrk-space-2)' }}>
    <SearchCount shown={43} total={43} />
    <SearchCount shown={7} total={43} />
    <SearchCount shown={1} total={43} />
    <SearchCount shown={12} total={318} noun="work orders" singular="work order" />
  </div>
);
