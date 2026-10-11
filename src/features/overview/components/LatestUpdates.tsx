import { Link } from 'react-router';
import { useLatestUpdates } from '../overview.api';

export function LatestUpdates() {
  const query = useLatestUpdates();

  return (
    <section className="panel" data-component="Panel" data-variant="activity">
      <div className="panel-header">
        <h2 data-role="panel-title">Latest updates</h2>
      </div>
      {query.error && <p role="alert">Latest updates could not be loaded.</p>}
      <div className="activity-feed" data-testid="home-updates">
        {query.data?.data.map((item) => (
          <article className="activity-item" key={item.occurredAt + item.title}>
            <div>
              <h3>{item.title}</h3>
              <time dateTime={item.occurredAt}>{new Date(item.occurredAt).toLocaleString()}</time>
              <Link to={item.kind === 'rule' ? '/rules' : '/audit'}>
                {item.kind === 'rule' ? 'View rule' : 'View information trail'}
              </Link>
            </div>
          </article>
        ))}
      </div>
      <Link to="/audit">Open activity history</Link>
    </section>
  );
}
