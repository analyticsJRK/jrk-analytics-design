import { PageSkeleton } from '@jrk/design';

/* A register: a band of stat tiles over a roster table. */
export const Register = () => (
  <div style={{ maxWidth: 960 }}>
    <PageSkeleton title="Pest Control" tiles={4} rows={8} cols={6} spinner={false} />
  </div>
);

/* A detail screen whose heading comes from the payload — so the title shimmers
   too, rather than painting one string and swapping to another. */
export const Detail = () => (
  <div style={{ maxWidth: 720 }}>
    <PageSkeleton announce="Loading the property…" cards={2} spinner={false} />
  </div>
);
