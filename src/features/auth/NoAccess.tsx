import { Icon } from '../../shared/ui/Icon';
import { avatarTone } from '../work';
import { AuthShell } from './AuthShell';
import { useSignedInPerson } from './auth.api';
import { authCopy } from './auth.copy';
import { useSignOut } from './useSignOut';

function initialsOf(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('');
}

export function NoAccess() {
  const identity = useSignedInPerson();
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
          <span className={`avatar ${avatarTone(initialsOf(person.name))}`}>
            {initialsOf(person.name)}
          </span>
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
