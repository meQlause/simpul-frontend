import { ScreenState } from '../../../shared/ui/ScreenState';
import { usePeople } from '../../people';
import { useVocabulary } from '../../vocabulary';
import { useReviewItem } from '../rules.api';
import { prefillFrom } from '../rules.form';
import { rulesCopy as copy } from '../rules.copy';
import type { Rule } from '../rules.schema';
import { RuleForm } from './RuleForm';
import { RuleShell } from './RuleShell';

type Props = {
  rule?: Rule;
  editing: boolean;
  reviewItemId: string | null;
  onClose: () => void;
  onSaved: () => void;
};

type Query = { isSuccess: boolean; isError: boolean; refetch: () => unknown };

function notReady(queries: Query[]): boolean {
  return queries.some((query) => !query.isSuccess && !query.isError);
}

export function RuleDrawer({ rule, editing, reviewItemId, onClose, onSaved }: Props) {
  const vocabulary = useVocabulary();
  const people = usePeople();
  const item = useReviewItem(reviewItemId);
  const queries = reviewItemId ? [vocabulary, people, item] : [vocabulary, people];

  if (editing && !rule) {
    return (
      <RuleShell editing onClose={onClose} footer={null}>
        <ScreenState state="not-found" />
      </RuleShell>
    );
  }

  if (notReady(queries)) {
    return <RuleLoading editing={editing} queries={queries} onClose={onClose} />;
  }

  return (
    <RuleLoaded
      rule={rule}
      editing={editing}
      vocabulary={vocabulary}
      people={people}
      item={item}
      reviewItemId={reviewItemId}
      onClose={onClose}
      onSaved={onSaved}
    />
  );
}

function RuleLoaded({
  rule,
  editing,
  vocabulary,
  people,
  item,
  reviewItemId,
  onClose,
  onSaved,
}: {
  rule?: Rule;
  editing: boolean;
  vocabulary: ReturnType<typeof useVocabulary>;
  people: ReturnType<typeof usePeople>;
  item: ReturnType<typeof useReviewItem>;
  reviewItemId: string | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  return (
    <RuleForm
      rule={rule}
      editing={editing}
      categories={vocabulary.data?.data.categories ?? []}
      staff={people.data?.data ?? []}
      {...prefillFrom(item.data)}
      reviewItemId={reviewItemId}
      onClose={onClose}
      onSaved={onSaved}
    />
  );
}

function RuleLoading({
  editing,
  queries,
  onClose,
}: {
  editing: boolean;
  queries: Query[];
  onClose: () => void;
}) {
  const failed = queries.some((query) => query.isError);

  return (
    <RuleShell
      editing={editing}
      onClose={onClose}
      footer={
        <button type="button" className="button" onClick={onClose}>
          {copy.cancel}
        </button>
      }
    >
      <ScreenState
        state={failed ? 'error' : 'loading'}
        onRetry={() => {
          queries.forEach((query) => {
            void query.refetch();
          });
        }}
      />
    </RuleShell>
  );
}
