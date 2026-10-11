import type { GroupInput } from '../useChannelSetup';
import { channelsCopy as copy } from '../channels.copy';

export function ChannelFields({
  input,
  onChange,
  saved,
  error,
}: {
  input: GroupInput;
  onChange: (input: GroupInput) => void;
  saved: boolean;
  error: string;
}) {
  const invalid =
    error.includes('E-TG-INPUT-INVALID') || error.includes('E-TG-CHAT-TYPE-UNSUPPORTED');

  return (
    <section className="drawer-section" data-component="DrawerSection">
      <h3 data-role="section-title">Identify the group</h3>
      <p>Choose the audience before any monitoring starts.</p>
      <label className="field" data-component="Field" data-variant="default" data-size="drawer">
        Display name
        <input
          name="displayName"
          aria-label="Display name"
          maxLength={120}
          value={input.displayName}
          aria-invalid={invalid && !input.displayName.trim()}
          onChange={(event) => onChange({ ...input, displayName: event.target.value })}
        />
        {invalid && !input.displayName.trim() && <small>Give this group a display name.</small>}
      </label>
      <label className="field" data-component="Field" data-variant="default" data-size="drawer">
        Telegram Chat ID
        <input
          name="providerChatId"
          aria-label="Telegram Chat ID"
          readOnly={saved}
          value={input.providerChatId}
          aria-invalid={invalid && !/^-\d+$/.test(input.providerChatId)}
          onChange={(event) => onChange({ ...input, providerChatId: event.target.value })}
        />
        <small>
          {saved
            ? copy.fixed
            : 'Group IDs are negative. Private chats and broadcast channels are unsupported.'}
        </small>
      </label>
      <div className="channel-form-pair">
        <label className="field" data-component="Field" data-variant="default" data-size="drawer">
          Audience
          <select
            value={input.class}
            onChange={(event) =>
              onChange({
                ...input,
                class: event.target.value === 'internal' ? 'internal' : 'external',
              })
            }
          >
            <option value="external">External</option>
            <option value="internal">Internal</option>
          </select>
        </label>
        <label className="field" data-component="Field" data-variant="default" data-size="drawer">
          Conversation language
          <select
            value={input.primaryLanguage}
            onChange={(event) =>
              onChange({
                ...input,
                primaryLanguage: event.target.value as GroupInput['primaryLanguage'],
              })
            }
          >
            <option value="auto">Auto</option>
            <option value="en">English</option>
            <option value="id">Indonesian</option>
          </select>
        </label>
      </div>
      <div className="drawer-policy-preview">
        <div>
          <strong>
            {input.class === 'external'
              ? 'External audience · Mask sensitive fields'
              : 'Internal audience · Role-based routing'}
          </strong>
          <p>Raw chat access remains restricted. Notifications follow configured rules.</p>
        </div>
      </div>
    </section>
  );
}
