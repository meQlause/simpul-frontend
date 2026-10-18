import { useState } from 'react';
import { ErrorToast } from '../../../shared/ui/ErrorToast';
import { Icon } from '../../../shared/ui/Icon';
import { useCreateInvite } from '../people.api';
import { peopleCopy as copy } from '../people.copy';

const validity = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' });

// FR-UI-24: a fresh invite link, copied and shown. A refused clipboard still leaves it on screen
// to copy by hand; without a ready bot there is nothing to link to.
export function InviteLink({
  person,
  botUsername,
  onCopied,
}: {
  person: { id: string; name: string };
  botUsername: string | null;
  onCopied: () => void;
}) {
  const create = useCreateInvite(person.id);
  const [invite, setInvite] = useState<{ link: string; expiresAt: string }>();
  const [failed, setFailed] = useState(false);

  async function copyInvite() {
    setFailed(false);

    try {
      const made = (await create.mutateAsync()).data;

      setInvite(made);
      await navigator.clipboard.writeText(made.link).then(onCopied, () => undefined);
    } catch {
      setFailed(true);
    }
  }

  return (
    <section className="drawer-section" data-component="InviteLink" data-variant="default">
      <div className="drawer-section-content">
        <button
          type="button"
          className="button"
          disabled={!botUsername || create.isPending}
          aria-describedby={botUsername ? undefined : 'invite-link-bot'}
          onClick={() => {
            void copyInvite();
          }}
        >
          <Icon name="telegram" />
          {copy.copyInvite}
        </button>
        {!botUsername && <small id="invite-link-bot">{copy.connectBotFirst}</small>}
        {invite && (
          <label className="field" htmlFor="invite-link-value">
            <input
              id="invite-link-value"
              readOnly
              value={invite.link}
              aria-label={copy.copyInvite}
              onFocus={(event) => event.currentTarget.select()}
            />
            <small>{copy.validUntil(validity.format(new Date(invite.expiresAt)))}</small>
            <small>{copy.sendInvite(person.name)}</small>
          </label>
        )}
        <ErrorToast message={failed ? copy.saveFailed : ''} onClose={() => setFailed(false)} />
      </div>
    </section>
  );
}
