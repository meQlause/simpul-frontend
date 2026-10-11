import { useNavigate, useSearchParams } from 'react-router';
import { Drawer } from '../../shared/ui/Drawer';
import { ScreenState } from '../../shared/ui/ScreenState';
import { useScreenState } from '../../shared/useScreenState';
import { previewCopy as copy } from './recipient-preview.copy';
import { useRecipientPreview } from './recipient-preview.api';
import type { Preview } from './recipient-preview.schema';
import { ClarificationTab } from './ClarificationTab';
import { NotificationTab } from './NotificationTab';
import { DigestTab, VoiceTab } from './ReadOnlyTabs';

type Tab = keyof typeof copy.tabs;

const tabs = Object.keys(copy.tabs) as Tab[];

export function RecipientPreviewDrawer() {
  const query = useRecipientPreview();
  const state = useScreenState(query, false);
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const tab = tabOf(params.get('tab'));
  const close = () => {
    void navigate('/settings');
  };

  return (
    <Drawer
      title={copy.title}
      eyebrow={copy.eyebrow}
      description={copy.description}
      closeLabel={copy.close}
      onClose={close}
      footer={
        <button className="button" onClick={close}>
          {copy.closePreview}
        </button>
      }
    >
      <div className="trace-view-tabs" role="tablist" aria-label={copy.tablist}>
        {tabs.map((value) => (
          <button
            key={value}
            role="tab"
            aria-selected={tab === value}
            className={tab === value ? 'active' : ''}
            onClick={() => {
              void setParams({ tab: value });
            }}
          >
            {copy.tabs[value]}
          </button>
        ))}
      </div>
      {query.data ? (
        <TabBody tab={tab} preview={query.data.data} />
      ) : (
        <ScreenState
          state={state}
          onRetry={() => {
            void query.refetch();
          }}
        />
      )}
    </Drawer>
  );
}

function TabBody({ tab, preview }: { tab: Tab; preview: Preview }) {
  if (tab === 'clarification') {
    return <ClarificationTab clarification={preview.clarification} />;
  }

  if (tab === 'digest') {
    return <DigestTab digest={preview.digest} />;
  }

  if (tab === 'voice') {
    return <VoiceTab voice={preview.voiceNote} />;
  }

  return <NotificationTab notification={preview.notification} />;
}

function tabOf(input: string | null): Tab {
  return tabs.find((value) => value === input) ?? 'notification';
}
