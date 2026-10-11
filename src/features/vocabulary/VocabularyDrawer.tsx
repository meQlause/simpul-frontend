import { useEffect, useState } from 'react';
import { useIsMutating } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router';
import { Drawer } from '../../shared/ui/Drawer';
import { ScreenState } from '../../shared/ui/ScreenState';
import { useScreenState } from '../../shared/useScreenState';
import { useOnline } from '../../shared/useOnline';
import { useVocabulary } from './vocabulary.api';
import { vocabularyCopy as copy } from './vocabulary.copy';
import type { Vocabulary } from './vocabulary.schema';
import { CategoriesTab } from './components/CategoriesTab';
import { AliasesTab } from './components/AliasesTab';
import { TemplatesTab } from './components/TemplatesTab';

type Tab = keyof typeof copy.actions;

const toastDuration = 4800;

export function VocabularyDrawer() {
  const query = useVocabulary();
  const state = useScreenState(query, false);
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const pending = useIsMutating({ mutationKey: ['vocabulary-write'] });
  const online = useOnline() && !pending;
  const tab = validTab(params.get('tab'));
  const [saved, setSaved] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setSaved(''), toastDuration);

    return () => clearTimeout(timer);
  }, [saved]);

  return (
    <Drawer
      title={copy.title}
      eyebrow={copy.eyebrow}
      description={copy.description}
      closeLabel="Close vocabulary"
      onClose={() => {
        void navigate('/settings');
      }}
      footer={
        <>
          <button
            className="button"
            onClick={() => {
              void navigate('/settings');
            }}
          >
            Cancel
          </button>
          <button
            className="button button-primary"
            form="vocabulary-form"
            type="submit"
            disabled={!online}
          >
            {copy.actions[tab]}
          </button>
        </>
      }
    >
      <div className="trace-view-tabs" role="tablist" aria-label="Configuration">
        {(['categories', 'aliases', 'templates'] as const).map((value) => (
          <button
            key={value}
            role="tab"
            aria-selected={tab === value}
            disabled={!online}
            onClick={() => {
              void setParams({ tab: value });
            }}
          >
            {value[0].toUpperCase() + value.slice(1)}
          </button>
        ))}
      </div>
      {query.data ? (
        <VocabularyBody
          tab={tab}
          vocabulary={query.data.data}
          categoryId={params.get('category') ?? ''}
          onSelect={(id) => {
            void setParams({ tab, category: id });
          }}
          onSaved={() => {
            setSaved(copy.saved[tab]);
            void setParams({ tab });
          }}
        />
      ) : (
        <ScreenState
          state={state}
          onRetry={() => {
            void query.refetch();
          }}
        />
      )}
      {saved && (
        <p className="toast visible" role="status">
          {saved}
        </p>
      )}
    </Drawer>
  );
}

function validTab(input: string | null): Tab {
  return input === 'aliases' || input === 'templates' ? input : 'categories';
}

function VocabularyBody({
  tab,
  vocabulary,
  categoryId,
  onSelect,
  onSaved,
}: {
  tab: Tab;
  vocabulary: Vocabulary;
  categoryId: string;
  onSelect: (id: string) => void;
  onSaved: () => void;
}) {
  if (tab === 'aliases') {
    return <AliasesTab vocabulary={vocabulary} onSaved={onSaved} />;
  }

  if (tab === 'templates') {
    return <TemplatesTab vocabulary={vocabulary} onSaved={onSaved} />;
  }

  return (
    <CategoriesTab
      categories={vocabulary.categories}
      selected={vocabulary.categories.find((item) => item.id === categoryId)}
      onSelect={onSelect}
      onSaved={onSaved}
    />
  );
}
