import { rulesCopy as copy } from '../rules.copy';

type Estimate = {
  matches30d: number;
  exceedsBudget: boolean;
  recipient: { holderName: string | null };
};

function noteOf(failed: boolean, estimate?: Estimate): string {
  if (failed) {
    return copy.impactUnavailable;
  }

  if (!estimate) {
    return '';
  }

  return estimate.exceedsBudget ? copy.impactExceeds : copy.impactEstimate;
}

export function ImpactPreview({
  estimate,
  failed,
  selected,
}: {
  estimate?: Estimate;
  failed: boolean;
  selected: string;
}) {
  return (
    <section className="drawer-impact" data-testid="rule-impact">
      <div className="drawer-impact-title">
        <svg className="icon" aria-hidden="true">
          <use href="#i-activity" />
        </svg>
        <h3>{copy.sectionImpact}</h3>
      </div>
      <div className="drawer-impact-value">
        <strong>{estimate ? estimate.matches30d : '–'}</strong>
        <span>{copy.impactUnit}</span>
      </div>
      <p role="status">{noteOf(failed, estimate)}</p>
      <div className="drawer-impact-route">
        <span>{copy.impactRoute}</span>
        <svg className="icon" aria-hidden="true">
          <use href="#i-arrow-right" />
        </svg>
        <span>{estimate?.recipient.holderName ?? selected}</span>
      </div>
    </section>
  );
}
