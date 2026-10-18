import { useSignOut } from '../../features/auth';
import { authCopy } from '../../features/auth/auth.copy';
import { Drawer } from '../../shared/ui/Drawer';
import { initials } from './Sidebar';
import { useShellData } from './shell.api';
import { shellCopy } from './shell.copy';

export function ProfileDrawer({ onClose }: { onClose: () => void }) {
  const { me } = useShellData();
  const signOut = useSignOut();

  if (!me) {
    return null;
  }

  const { person } = me;

  return (
    <Drawer
      title={person.name}
      eyebrow={authCopy.signedInAs}
      description={person.roleName ?? person.name}
      closeLabel={shellCopy.close}
      onClose={onClose}
      footer={
        <button className="button" type="button" onClick={() => void signOut()}>
          {shellCopy.signOut}
        </button>
      }
    >
      <div className="drawer-person" data-component="ProfileDrawer" data-variant="default">
        <span className="avatar">{initials(person.name)}</span>
        <div>
          <strong>{person.name}</strong>
          {person.roleName && <small>{person.roleName}</small>}
        </div>
      </div>
    </Drawer>
  );
}
