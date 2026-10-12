import { useState } from 'react';
import { Drawer } from '../../../shared/ui/Drawer';
import { Icon } from '../../../shared/ui/Icon';
import { ScreenState } from '../../../shared/ui/ScreenState';
import { useScreenState } from '../../../shared/useScreenState';
import { useOnline } from '../../../shared/useOnline';
import { useWorkDetail } from '../work.api';
import { workCopy as copy } from '../work.copy';
import type { WorkDetail } from '../work.schema';
import { WorkContents } from './WorkContents';
import { CloseWorkPopup } from './CloseWorkPopup';

export function WorkDrawer({
  displayId,
  onClose,
  onSaved,
}: {
  displayId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const query = useWorkDetail(displayId);
  const state = useScreenState(query, false);
  const [closing, setClosing] = useState(false);
  const online = useOnline();
  const item = query.data?.data;

  return (
    <Drawer
      title={item?.customer ?? displayId}
      eyebrow={'WORK DETAILS / ' + displayId}
      description={copy.details}
      closeLabel="Close details"
      covered={closing}
      onClose={onClose}
      footer={
        <>
          <button className="button" onClick={onClose}>
            Close details
          </button>
          <WorkAction item={item} online={online} onCloseWork={() => setClosing(true)} />
        </>
      }
    >
      {item ? (
        <WorkContents item={item} />
      ) : (
        <ScreenState
          state={state}
          onRetry={() => {
            void query.refetch();
          }}
        />
      )}
      {closing && (
        <CloseWorkPopup displayId={displayId} onClose={() => setClosing(false)} onSaved={onSaved} />
      )}
    </Drawer>
  );
}

function footerStatus(item: WorkDetail) {
  if (item.status === 'tentative') {
    return 'Silent observation';
  }

  return item.status === 'archived' ? 'Archived' : 'Reminders stopped';
}

function WorkAction({
  item,
  online,
  onCloseWork,
}: {
  item?: WorkDetail;
  online: boolean;
  onCloseWork: () => void;
}) {
  if (!item) {
    return null;
  }

  if (item.canClose) {
    return (
      <button className="button button-primary" disabled={!online} onClick={onCloseWork}>
        <Icon name="check" />
        Close work
      </button>
    );
  }

  return <span className="badge gray">{footerStatus(item)}</span>;
}
