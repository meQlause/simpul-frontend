import type { CodeSession } from '../channels.schema';
import { channelsCopy as copy } from '../channels.copy';

// The command field of a step. The session comes from useCodeSession; this only shows it.
export function ConnectionCode({
  session,
  issuing,
  onGenerate,
}: {
  session: CodeSession | null;
  issuing: boolean;
  onGenerate: () => void;
}) {
  const command = session?.command ?? '';

  return (
    <div className="setup-command" data-component="ConnectionCode">
      <button
        type="button"
        className="button button-primary"
        data-component="Button"
        data-variant="primary"
        data-size="drawer"
        disabled={issuing || session?.state === 'pending'}
        onClick={onGenerate}
      >
        {copy.generate}
      </button>
      {session && (
        <>
          <label className="field" data-component="Field" data-variant="default" data-size="drawer">
            Command · expires in 15 minutes
            <input readOnly aria-label="Connection command" value={command} />
          </label>
          <button
            type="button"
            className="button"
            data-component="Button"
            data-variant="default"
            data-size="drawer"
            onClick={() => {
              void navigator.clipboard.writeText(command);
            }}
          >
            {copy.copyCommand}
          </button>
        </>
      )}
      {session?.state === 'pending' && <p className="setup-waiting">{copy.waitingCode}</p>}
    </div>
  );
}
