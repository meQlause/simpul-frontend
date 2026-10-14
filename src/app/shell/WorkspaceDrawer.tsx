import { useSignOut } from '../../features/auth';
import { Drawer } from '../../shared/ui/Drawer';
import { InfoTip } from '../../shared/ui/InfoTip';
import { useShellData } from './shell.api';
import { shellCopy as copy } from './shell.copy';

export function WorkspaceDrawer({ onClose }: { onClose: () => void }) {
  const { me } = useShellData();
  const signOut = useSignOut();

  if (!me) {
    return null;
  }

  const { workspace } = me;

  return (
    <Drawer
      title={workspace.name}
      eyebrow={copy.workspaceEyebrow}
      description={copy.workspaceDescription}
      closeLabel={copy.close}
      onClose={onClose}
      footer={
        <>
          <button className="button" onClick={() => void signOut()}>
            {copy.signOut}
          </button>
          <button className="button button-primary" onClick={onClose}>
            {copy.back}
          </button>
        </>
      }
    >
      <div className="drawer-workspace-hero">
        <img src="/assets/simpul-mark.png" alt="" />
        <div>
          <strong>{workspace.name}</strong>
          <span>{workspace.descriptor}</span>
        </div>
      </div>
      <section className="drawer-section" data-component="DrawerSection" data-variant="default">
        <div className="drawer-section-heading">
          <span>01</span>
          <div>
            <h3>{copy.workspaceSection}</h3>
            <InfoTip title={copy.workspaceSection} text={copy.workspaceSectionDescription} />
          </div>
        </div>
        <div className="drawer-section-content">
          <dl className="trace-facts" data-component="TraceFacts" data-variant="default">
            <div>
              <dt>{copy.members}</dt>
              <dd>
                {workspace.counts.members} {copy.memberUnit}
              </dd>
            </div>
            <div>
              <dt>{copy.channels}</dt>
              <dd>
                {workspace.counts.channels} {copy.channelUnit}
              </dd>
            </div>
            <div>
              <dt>{copy.activeRules}</dt>
              <dd>
                {workspace.counts.activeRules} {copy.ruleUnit}
              </dd>
            </div>
            <div>
              <dt>{copy.timezone}</dt>
              <dd>
                {workspace.timezone === 'Asia/Jakarta' ? copy.jakartaTimezone : workspace.timezone}
              </dd>
            </div>
          </dl>
        </div>
      </section>
    </Drawer>
  );
}
