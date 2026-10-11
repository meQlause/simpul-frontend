import { authCopy } from './auth.copy';

export function AuthStory({ held = false }: { held?: boolean }) {
  return (
    <aside
      className={held ? 'auth-story is-held' : 'auth-story'}
      aria-hidden="true"
      data-component="AuthStory"
    >
      <span className="eyebrow" data-role="eyebrow">
        {authCopy.storyEyebrow}
      </span>
      <h2>
        {held ? authCopy.heldTitle : authCopy.storyTitle}
        <br />
        <span>{held ? authCopy.heldAccent : authCopy.storyAccent}</span>
      </h2>
      <p data-role="body">{held ? authCopy.heldLead : authCopy.storyLead}</p>
      <div className={held ? 'auth-stage is-held' : 'auth-stage'}>
        <div className="orbit orbit-one" />
        <div className="orbit orbit-two" />
        <div className="orbit auth-orbit" />
        <div className="flow-core">
          <img className="flow-logo" src="/assets/simpul-mark.png" alt="" />
        </div>
        <div className="flow-note auth-note-in">
          <span className="channel-mini">
            <svg className="icon">
              <use href="#i-telegram" />
            </svg>
          </span>
          <div>
            <b>{authCopy.incomingName}</b>
            <span>{authCopy.incoming}</span>
          </div>
        </div>
        <div className="flow-result auth-note-out">
          <span className="avatar small mint">{authCopy.initials}</span>
          <div>
            <b>{authCopy.outgoing}</b>
            <span>
              {authCopy.recipient} <i>·</i> {authCopy.via}
            </span>
          </div>
          <svg className="icon">
            <use href="#i-check-circle" />
          </svg>
        </div>
      </div>
      <div className="auth-story-footer">
        <svg className="icon">
          <use href="#i-shield" />
        </svg>
        {held ? authCopy.held : authCopy.footer}
      </div>
    </aside>
  );
}
