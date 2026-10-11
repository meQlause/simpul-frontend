import { eventTypes, historyModes } from '../rules.schema';
import { rulesCopy as copy } from '../rules.copy';
import type { Category, RuleErrors, StaffMember } from '../rules.form';

export function RuleWhen({
  defaults,
  categories,
  categoryId,
  eventType,
  errors,
  onCategory,
  onEvent,
}: {
  defaults: { name: string; conditionText: string };
  categories: Category[];
  categoryId: string;
  eventType: string;
  errors: RuleErrors;
  onCategory: (id: string) => void;
  onEvent: (value: string) => void;
}) {
  return (
    <section className="drawer-section">
      <SectionHeading number="01" title={copy.sectionWhen} description={copy.sectionWhenHelp} />
      <div className="drawer-section-content">
        <label className="field">
          <span>{copy.name}</span>
          <input
            name="name"
            required
            maxLength={100}
            defaultValue={defaults.name}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? 'rule-error-name' : undefined}
          />
          <small role="alert" id="rule-error-name">
            {errors.name}
          </small>
        </label>
        <label className="field">
          <span>{copy.category}</span>
          <select
            name="categoryId"
            value={categoryId}
            aria-invalid={Boolean(errors.categoryId)}
            aria-describedby={errors.categoryId ? 'rule-error-categoryId' : undefined}
            onChange={(event) => onCategory(event.target.value)}
          >
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <small role="alert" id="rule-error-categoryId">
            {errors.categoryId}
          </small>
        </label>
        <label className="field">
          <span>{copy.event}</span>
          <select
            name="eventType"
            value={eventType}
            aria-invalid={Boolean(errors.eventType)}
            aria-describedby={errors.eventType ? 'rule-error-eventType' : undefined}
            onChange={(event) => onEvent(event.target.value)}
          >
            {Object.entries(eventTypes).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <small role="alert" id="rule-error-eventType">
            {errors.eventType}
          </small>
        </label>
        <label className="field">
          <span>{copy.condition}</span>
          <textarea
            name="conditionText"
            rows={3}
            required
            maxLength={300}
            defaultValue={defaults.conditionText}
            aria-invalid={Boolean(errors.conditionText)}
            aria-describedby={errors.conditionText ? 'rule-error-conditionText' : undefined}
          />
          <small>{copy.conditionHelp}</small>
          <small role="alert" id="rule-error-conditionText">
            {errors.conditionText}
          </small>
        </label>
      </div>
    </section>
  );
}

export function RuleWho({
  staff,
  recipientRoleId,
  errors,
  onRecipient,
}: {
  staff: StaffMember[];
  recipientRoleId: string;
  errors: RuleErrors;
  onRecipient: (id: string) => void;
}) {
  const recipients = staff.flatMap((member) =>
    member.role ? [{ id: member.role.id, label: `${member.name} · ${member.role.team}` }] : [],
  );

  return (
    <section className="drawer-section">
      <SectionHeading number="02" title={copy.sectionWho} description={copy.sectionWhoHelp} />
      <div className="drawer-section-content">
        <label className="field">
          <span>{copy.recipient}</span>
          <select
            name="recipientRoleId"
            value={recipientRoleId}
            aria-invalid={Boolean(errors.recipientRoleId)}
            aria-describedby={errors.recipientRoleId ? 'rule-error-recipientRoleId' : undefined}
            onChange={(event) => onRecipient(event.target.value)}
          >
            {recipients.map((recipient) => (
              <option key={recipient.id} value={recipient.id}>
                {recipient.label}
              </option>
            ))}
          </select>
          <small role="alert" id="rule-error-recipientRoleId">
            {errors.recipientRoleId}
          </small>
        </label>
        <div className="drawer-inline-note">{copy.recipientNote}</div>
      </div>
    </section>
  );
}

export function RulePast({ mode, errors }: { mode: string; errors: RuleErrors }) {
  return (
    <section className="drawer-section">
      <SectionHeading number="03" title={copy.sectionPast} description={copy.sectionPastHelp} />
      <div className="drawer-section-content">
        <label className="field">
          <span>{copy.history}</span>
          <select
            name="historyMode"
            defaultValue={mode}
            aria-invalid={Boolean(errors.historyMode)}
            aria-describedby={errors.historyMode ? 'rule-error-historyMode' : undefined}
          >
            {Object.entries(historyModes).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <small role="alert" id="rule-error-historyMode">
            {errors.historyMode}
          </small>
        </label>
        <div className="drawer-inline-note">{copy.historyNote}</div>
      </div>
    </section>
  );
}

function SectionHeading({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="drawer-section-heading">
      <span>{number}</span>
      <div>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </div>
  );
}
