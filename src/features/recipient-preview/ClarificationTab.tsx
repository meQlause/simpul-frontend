import { Icon } from '../../shared/ui/Icon';
import { useState } from 'react';
import { ScreenState } from '../../shared/ui/ScreenState';
import { previewCopy as copy } from './recipient-preview.copy';
import type { Preview } from './recipient-preview.schema';

type Clarification = NonNullable<Preview['clarification']>;
type Choice = string | 'none' | 'silence';

export function ClarificationTab({ clarification }: { clarification: Clarification | null }) {
  const [choice, setChoice] = useState<Choice | null>(null);

  if (!clarification) {
    return <ScreenState state="empty" />;
  }

  return (
    <>
      <div className="message-preview telegram-preview">
        <div className="message-sender">
          <Icon name="telegram" />
          Simpul · In the original group
        </div>
        <p>
          <strong>{copy.clarification.question}</strong>
          <br />
          {copy.clarification.help}
        </p>
        <div className="clarification-options">
          {clarification.candidates.map((candidate, index) => (
            <button
              key={candidate.displayId}
              className="button"
              disabled={choice !== null}
              onClick={() => setChoice(candidate.displayId)}
            >
              {index + 1} · {candidate.label}
            </button>
          ))}
          <button className="button" disabled={choice !== null} onClick={() => setChoice('none')}>
            {copy.clarification.none}
          </button>
        </div>
        <div className="message-outcome" role="status">
          {outcomeOf(choice) ||
            copy.clarification.limits(clarification.perWorkPerDay, clarification.perChannelPerDay)}
        </div>
      </div>
      <button className="text-button" onClick={() => setChoice('silence')}>
        {copy.actions.silence}
      </button>
    </>
  );
}

function outcomeOf(choice: Choice | null): string {
  if (choice === null) {
    return '';
  }

  if (choice === 'silence') {
    return copy.outcome.silence;
  }

  return choice === 'none' ? copy.outcome.none : copy.outcome.selected(choice);
}
