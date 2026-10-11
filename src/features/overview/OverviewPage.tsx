import { ScreenState } from '../../shared/ui/ScreenState';
import { useScreenState } from '../../shared/useScreenState';
import { exportSummary, useOverview } from './overview.api';
import { overviewCopy } from './overview.copy';

export function OverviewPage() {
  const query = useOverview();
  const state = useScreenState(query, false);

  return (
    <>
      <div className="heading-actions">
        <button
          className="button"
          type="button"
          data-action="export"
          disabled={state !== 'ready'}
          onClick={exportSummary}
        >
          <svg className="icon" aria-hidden="true">
            <use href="#i-download" />
          </svg>
          {overviewCopy.download}
        </button>
      </div>
      <ScreenState
        state={state}
        onRetry={() => {
          void query.refetch();
        }}
      />
    </>
  );
}
