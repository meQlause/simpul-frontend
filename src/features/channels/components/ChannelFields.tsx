import { Icon } from '../../../shared/ui/Icon';
import { InfoTip } from '../../../shared/ui/InfoTip';
import type { GroupInput } from '../useChannelSetup';

export function ChannelAudience({
  input,
  onChange,
}: {
  input: GroupInput;
  onChange: (input: GroupInput) => void;
}) {
  const label =
    input.class === 'external'
      ? 'External audience · Mask sensitive fields'
      : 'Internal audience · Role-based routing';

  return (
    <>
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
        <Icon name="shield" />
        <div>
          <strong>{label}</strong>
          <InfoTip
            title={label}
            text="Raw chat access remains restricted. Notifications follow configured rules."
          />
        </div>
      </div>
    </>
  );
}
