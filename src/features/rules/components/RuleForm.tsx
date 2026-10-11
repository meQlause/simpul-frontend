import { useState } from 'react';
import { OfflineControls } from '../../../shared/ui/OfflineControls';
import { useOnline } from '../../../shared/useOnline';
import { useEstimate } from '../rules.api';
import { defaultsFor, estimateInput, type Category, type StaffMember } from '../rules.form';
import { rulesCopy as copy } from '../rules.copy';
import type { Rule } from '../rules.schema';
import { useRuleForm } from '../useRuleForm';
import { ImpactPreview } from './ImpactPreview';
import { RulePast, RuleWhen, RuleWho } from './RuleSections';
import { RuleShell } from './RuleShell';

export function RuleForm({
  rule,
  editing,
  categories,
  staff,
  suggested,
  detail,
  reviewItemId,
  onClose,
  onSaved,
}: {
  rule?: Rule;
  editing: boolean;
  categories: Category[];
  staff: StaffMember[];
  suggested: string | null;
  detail?: string;
  reviewItemId: string | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const online = useOnline();
  const defaults = defaultsFor({ rule, categories, staff, suggested, detail });
  const [categoryId, setCategoryId] = useState(defaults.categoryId);
  const [eventType, setEventType] = useState<string>(defaults.eventType);
  const [recipientRoleId, setRecipientRoleId] = useState(defaults.recipientRoleId);
  const form = useRuleForm({ rule, reviewItemId, onSaved });
  const estimate = useEstimate(estimateInput(categoryId, eventType, recipientRoleId));
  const selected = staff.find((member) => member.role?.id === recipientRoleId);

  return (
    <RuleShell
      editing={editing}
      onClose={onClose}
      footer={
        <>
          {form.failed && (
            <p role="alert" className="channel-error drawer-error">
              {copy.saveFailed}
            </p>
          )}
          <button type="button" className="button" onClick={onClose}>
            {copy.cancel}
          </button>
          <button
            className="button button-primary"
            type="submit"
            form="rule-form"
            disabled={form.pending || !online}
          >
            {copy.save}
          </button>
        </>
      }
    >
      <form id="rule-form" onSubmit={form.submit} noValidate>
        <OfflineControls>
          <RuleWhen
            defaults={defaults}
            categories={categories}
            categoryId={categoryId}
            eventType={eventType}
            errors={form.errors}
            onCategory={setCategoryId}
            onEvent={setEventType}
          />
          <RuleWho
            staff={staff}
            recipientRoleId={recipientRoleId}
            errors={form.errors}
            onRecipient={setRecipientRoleId}
          />
          <ImpactPreview
            estimate={estimate.data?.data}
            failed={estimate.isError}
            selected={selected?.name ?? ''}
          />
          <RulePast mode={rule?.historyMode ?? 'digest'} errors={form.errors} />
        </OfflineControls>
      </form>
    </RuleShell>
  );
}
