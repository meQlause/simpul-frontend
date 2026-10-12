import { useQuery } from '@tanstack/react-query';
import { z as schema } from 'zod';
import { getResponse } from '../../shared/api/client';
import { Icon } from '../../shared/ui/Icon';
import { AuthShell } from './AuthShell';
import { authCopy } from './auth.copy';
import { useSignOut } from './useSignOut';

const signedInSchema = schema.object({
  data: schema.object({
    person: schema.object({ name: schema.string(), roleName: schema.string() }),
  }),
});

function initialsOf(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('');
}

export function NoAccess() {
  const identity = useQuery({
    queryKey: ['no-access-me'],
    queryFn: () => getResponse('/me', signedInSchema),
  });
  const signOut = useSignOut();
  const person = identity.data?.data.person;

  return (
    <AuthShell
      variant="no-access"
      eyebrow={authCopy.accessEyebrow}
      title={authCopy.accessTitle}
      lead={authCopy.accessBody}
    >
      <div className="auth-signed eyebrow">{authCopy.signedInAs}</div>
      {person && (
        <div className="drawer-person">
          <span className="avatar">{initialsOf(person.name)}</span>
          <div>
            <strong>{person.name}</strong>
            <small>{person.roleName}</small>
          </div>
        </div>
      )}
      <button
        className="button button-primary auth-submit"
        type="button"
        onClick={() => void signOut()}
      >
        {authCopy.signOut}
        <Icon name="logout" />
      </button>
    </AuthShell>
  );
}
