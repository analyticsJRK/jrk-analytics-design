import { Avatar } from '@jrk/design';

export const Sizes = () => (
  <div className="jrk-row">
    <Avatar initials="DR" size="sm" />
    <Avatar initials="DR" />
    <Avatar initials="DR" size="lg" label="Dana Ruiz" />
    <Avatar initials="MS" solid />
  </div>
);

/* Beside the name it belongs to — decorative there, so it is not announced twice. */
export const WithName = () => (
  <div className="jrk-stack" style={{ maxWidth: 320 }}>
    {[
      ['MM', 'Max McCoy', 'Asset manager · 22 properties'],
      ['LB', 'Lisa Baeck', 'Asset manager · 26 properties'],
    ].map(([i, n, r]) => (
      <div className="jrk-row" key={n}>
        <Avatar initials={i} />
        <div>
          <div>{n}</div>
          <div className="jrk-caption">{r}</div>
        </div>
      </div>
    ))}
  </div>
);
