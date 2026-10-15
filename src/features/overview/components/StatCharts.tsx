import { barLevels, sparklinePath } from '../stat-charts.rules';

const percent = 100;

export function Sparkline({ values }: { values: number[] }) {
  return (
    <svg className="sparkline" viewBox="0 0 110 38" aria-hidden="true">
      <path d={sparklinePath(values)} />
    </svg>
  );
}

export function MiniBars({ values }: { values: number[] }) {
  return (
    <span className="stat-subvisual" aria-hidden="true">
      {barLevels(values).map((level, index) => (
        <i key={index} className={level.shade} style={{ height: `${level.height * percent}%` }} />
      ))}
    </span>
  );
}
