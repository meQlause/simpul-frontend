export const STEP = { people: 1, groups: 2, rules: 3, first: 4 } as const;

export const LAST_STEP: number = STEP.first;

export function stepOf(value: string | null): number {
  const step = Number(value);

  return Number.isInteger(step) && step >= STEP.people && step <= LAST_STEP ? step : STEP.people;
}
