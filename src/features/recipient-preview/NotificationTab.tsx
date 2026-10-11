import { useState } from 'react';
import { ScreenState } from '../../shared/ui/ScreenState';
import { previewCopy as copy } from './recipient-preview.copy';
import type { Preview } from './recipient-preview.schema';

type Notification = NonNullable<Preview['notification']>;
type Response = 'completed' | 'active' | 'stalled';

const responses: Response[] = ['completed', 'active', 'stalled'];

export function NotificationTab({ notification }: { notification: Notification | null }) {
  const [response, setResponse] = useState<Response | null>(null);
  const [corrected, setCorrected] = useState(false);

  if (!notification) {
    return <ScreenState state="empty" />;
  }

  function reset() {
    setResponse(null);
    setCorrected(false);
  }

  return (
    <div className="message-preview telegram-preview">
      <div className="message-sender">{copy.header(notification.recipientLabel)}</div>
      <p>
        <strong>
          {notification.work.displayId} · {notification.work.customer}
        </strong>
        <br />
        {notification.body}
      </p>
      <small>{copy.reminder(notification.reminderCount, notification.holdSeconds)}</small>
      <div className="message-actions">
        {responses.map((value) => (
          <button key={value} disabled={corrected} onClick={() => setResponse(value)}>
            {copy.actions[value]}
          </button>
        ))}
      </div>
      <button className="text-button" disabled={corrected} onClick={() => setCorrected(true)}>
        {copy.actions.correct}
      </button>
      <div className="message-outcome" role="status">
        {outcomeOf(response, corrected)}
      </div>
      <ul className="message-facts">
        <li>{copy.facts.operation(notification.opId)}</li>
        <li>{copy.facts.escalation}</li>
        <li>{copy.facts.source}</li>
      </ul>
      <button className="text-button" onClick={reset}>
        {copy.actions.reset}
      </button>
    </div>
  );
}

function outcomeOf(response: Response | null, corrected: boolean): string {
  if (corrected) {
    return copy.outcome.corrected;
  }

  return response ? copy.outcome[response] : '';
}
