import { MentionText } from '@jrk/design';

const PEOPLE = [
  { id: 'druiz@example.com', label: 'Dana Ruiz' },
  { id: 'group:legal', label: 'Legal team' },
];

/* A posted note. The email address is not a tag — only known labels are drawn. */
export const Default = () => (
  <p style={{ maxWidth: 460 }}>
    <MentionText
      people={PEOPLE}
      text="@Dana Ruiz confirmed the visit for Thursday. Copying @Legal team on the lease clause; vendor contact is ops@example.com."
    />
  </p>
);
