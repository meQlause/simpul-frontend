import { useState } from 'react';
import { ErrorToast } from '../../../shared/ui/ErrorToast';
import { Icon } from '../../../shared/ui/Icon';
import { exportWork } from '../work.api';
import { useOnline } from '../../../shared/useOnline';
import { workCopy as copy } from '../work.copy';

export function WorkHeading({ filter, onExport }: { filter: string; onExport: () => void }) {
  const online = useOnline();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  async function download() {
    setPending(true);

    try {
      const url = URL.createObjectURL(await exportWork(filter));
      const anchor = document.createElement('a');

      anchor.href = url;
      anchor.download = 'simpul-summary.csv';
      anchor.click();
      URL.revokeObjectURL(url);
      setError('');
      onExport();
    } catch {
      setError(copy.saveError);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="page-heading" data-component="PageHeading" data-variant="default">
      <div>
        <div className="eyebrow" data-role="eyebrow">
          {copy.eyebrow}
        </div>
        <h1 className="page-title" data-role="page-title">
          {copy.title}
        </h1>
        <p className="page-description" data-role="page-description">
          {copy.description}
        </p>
        <ErrorToast message={error} onClose={() => setError('')} />
      </div>
      <button
        className="button"
        disabled={!online || pending}
        onClick={() => {
          void download();
        }}
      >
        <Icon name="download" />
        Export summary
      </button>
    </div>
  );
}
