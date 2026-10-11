import { useEffect, useState } from 'react';
import type { Verification } from '../channels.schema';
import { channelsCopy as copy } from '../channels.copy';

export function useFreshVerification(verification: Verification | null) {
  const [now, setNow] = useState(Date.now);

  useEffect(() => {
    if (!verification) {
      return;
    }

    const timer = setTimeout(
      () => setNow(Date.now()),
      Math.max(0, Date.parse(verification.expiresAt) - Date.now()),
    );

    return () => clearTimeout(timer);
  }, [verification]);

  return Boolean(verification?.activationReady && Date.parse(verification.expiresAt) > now);
}

export function Checklist({ verification }: { verification: Verification | null }) {
  return (
    <div data-testid="channel-checklist" data-variant="channel">
      {copy.checkTitles.map((title, index) => {
        const check = verification?.checks[index];
        const status = check?.status ?? 'pending';
        const labels = { pass: 'Passed', pending: 'Pending', fail: 'Needs action' };
        const colors = { pass: 'green', pending: 'gray', fail: 'amber' };

        return (
          <div
            key={title}
            className="drawer-check-row"
            data-component="CheckRow"
            data-variant={status}
          >
            <div>
              <strong>{title}</strong>
              <small>{check?.message}</small>
            </div>
            <span className={'badge ' + colors[status]}>{labels[status]}</span>
          </div>
        );
      })}
    </div>
  );
}
