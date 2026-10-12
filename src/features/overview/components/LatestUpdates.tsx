import { Link } from 'react-router';
import { Icon } from '../../../shared/ui/Icon';
import { useLatestUpdates } from '../overview.api';

const ICONS: Record<string, { icon: string; tone: string }> = {
  routing: { icon: 'send', tone: '' },
  work: { icon: 'check', tone: ' pale' },
  queue: { icon: 'inbox', tone: ' neutral' },
  digest: { icon: 'route', tone: ' neutral' },
};

function Item({ item }: { item: { title: string; occurredAt: string; kind: string } }) {
  const style = ICONS[item.kind] ?? ICONS.routing;
  const time = new Date(item.occurredAt).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Jakarta',
  });

  return (
    <div className="feed-item" data-kind={item.kind}>
      <span className={`feed-icon${style.tone}`}>
        <Icon name={style.icon} />
      </span>
      <div>
        <span className="feed-time">{time.replace(':', '.')}</span>
        <p>{item.title}</p>
        <Link className="text-button" to="/audit">
          View information trail <Icon name="arrow-up-right" />
        </Link>
      </div>
    </div>
  );
}

export function LatestUpdates() {
  const query = useLatestUpdates();

  return (
    <section
      className="panel activity-panel"
      data-component="Panel"
      data-variant="activity"
      aria-labelledby="activity-heading"
    >
      <div className="panel-header">
        <h2 id="activity-heading" data-role="panel-title">
          Latest updates
        </h2>
        <span className="live-indicator" />
      </div>
      {query.error && <p role="alert">Latest updates could not be loaded.</p>}
      <div className="activity-feed" data-testid="home-updates">
        {query.data?.data.map((item) => (
          <Item key={item.occurredAt + item.title} item={item} />
        ))}
      </div>
      <Link className="activity-footer" to="/audit">
        Open activity history <Icon name="arrow-right" />
      </Link>
    </section>
  );
}
