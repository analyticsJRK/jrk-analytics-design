import { CountBadge, Button, Icon } from '@jrk/design';

export const Default = () => (
  <div className="jrk-row" style={{ gap: 'var(--jrk-space-5)', paddingTop: 8 }}>
    <Button variant="ghost" iconOnly aria-label="Notifications, 3 unread">
      <Icon name="bell" />
      <CountBadge count={3} overlay />
    </Button>
    <Button variant="cta">
      Tasks <CountBadge count={12} tone="inverse" label="open" />
    </Button>
    <CountBadge count={240} tone="accent" />
    <CountBadge count={0} />
  </div>
);
