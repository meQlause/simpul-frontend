import { Link } from 'react-router';
import { InfoTip } from '../../../shared/ui/InfoTip';
import { ScreenState } from '../../../shared/ui/ScreenState';
import { useScreenState } from '../../../shared/useScreenState';
import { useSettingsQuery } from '../../settings';
import { peopleCopy as copy } from '../people.copy';

export function PersonDelivery() {
  const query = useSettingsQuery();
  const state = useScreenState(query, false);

  if (!query.data) {
    return (
      <ScreenState
        state={state}
        onRetry={() => {
          void query.refetch();
        }}
      />
    );
  }

  const settings = query.data.data;
  const zone = settings.timezone === 'Asia/Jakarta' ? 'WIB' : settings.timezone;

  return (
    <section className="drawer-section">
      <div className="drawer-section-heading">
        <span>03</span>
        <div>
          <h3>{copy.delivery}</h3>
          <InfoTip title={copy.delivery} text={copy.deliveryDescription} />
        </div>
      </div>
      <div className="drawer-section-content">
        <dl className="trace-facts">
          <div>
            <dt>{copy.channel}</dt>
            <dd>{copy.telegram}</dd>
          </div>
          <div>
            <dt>{copy.quietHours}</dt>
            <dd>
              {settings.quietStart} – {settings.quietEnd} {zone}
            </dd>
          </div>
          <div>
            <dt>{copy.hourlyLimit}</dt>
            <dd>
              {settings.budgetPerHour} {copy.hourlyUnit}
            </dd>
          </div>
        </dl>
        <Link to="/settings" className="text-button">
          {copy.settings}
        </Link>
      </div>
    </section>
  );
}
