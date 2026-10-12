import { Link } from 'react-router';
import { Drawer } from '../../../shared/ui/Drawer';
import { DrawerSection } from '../../../shared/ui/DrawerParts';
import { Icon } from '../../../shared/ui/Icon';
import { ScreenState } from '../../../shared/ui/ScreenState';
import { useScreenState } from '../../../shared/useScreenState';
import { useReviewItem } from '../review-queue.api';
import { reviewCopy as copy } from '../review-queue.copy';
import { elapsed } from '../../work';
import { reviewAction } from './ReviewList';
import type { ReviewItem } from '../review-queue.schema';
import { MappingForm } from './MappingForm';

export function ReviewDrawer({
  id,
  mapping,
  onClose,
  onSaved,
}: {
  id: string;
  mapping: boolean;
  onClose: () => void;
  onSaved: (kind: string) => void;
}) {
  const query = useReviewItem(id);
  const state = useScreenState(query, false);
  const item = query.data?.data;

  if (item && canMap(item, mapping)) {
    return <MappingForm item={item} onClose={onClose} onSaved={onSaved} />;
  }

  return (
    <Drawer
      title={item?.title ?? copy.title}
      eyebrow="NEEDS REVIEW / CONTEXT"
      description="See what is missing before choosing the next step."
      closeLabel="Close review"
      onClose={onClose}
      footer={
        <>
          <button className="button" onClick={onClose}>
            Close review
          </button>
          {item && (
            <Link className="button button-primary" to={reviewAction(item)}>
              {copy.kinds[item.kind].action}
              <Icon name="arrow-right" />
            </Link>
          )}
        </>
      }
    >
      {item ? (
        <ReviewBody item={item} />
      ) : (
        <ScreenState
          state={state}
          onRetry={() => {
            void query.refetch();
          }}
        />
      )}
    </Drawer>
  );
}

function canMap(item: ReviewItem | undefined, mapping: boolean) {
  return mapping && item !== undefined && item.kind !== 'unrouted';
}

const NEXT_STEP = {
  unrouted: 'Define the condition and recipient, then check the impact before saving.',
  alias: 'Choose the person this name refers to. The mapping applies to future references.',
  category: 'Choose the category that best describes this update.',
} as const;

function ReviewBody({ item }: { item: ReviewItem }) {
  const kind = copy.kinds[item.kind];

  return (
    <>
      <section className="drawer-review-hero">
        <span className="trace-hero-icon">
          <Icon name={kind.icon} />
        </span>
        <h3>
          Useful information.
          <br />
          One missing connection.
        </h3>
        <p>{kind.reason}</p>
        <div>
          <span className="badge amber">{kind.badge}</span>
          <span>{elapsed(item.detectedAt, 'active')}</span>
        </div>
      </section>
      <DrawerSection
        number="01"
        title="The detected update"
        description="A safe summary from its source conversation."
      >
        <div className="trace-source">
          <span className="directory-icon">
            <Icon name="telegram" />
          </span>
          <div>
            <span className="trace-label">{item.channel.displayName}</span>
            <p>{item.detail}</p>
          </div>
        </div>
      </DrawerSection>
      <DrawerSection
        number="02"
        title="Your next step"
        description="Resolve the configuration gap, once."
      >
        <div className="drawer-next-action">
          <span className="drawer-identity-icon">
            <Icon name={kind.icon} />
          </span>
          <div>
            <h3>{kind.action}</h3>
            <p>{NEXT_STEP[item.kind]}</p>
          </div>
        </div>
      </DrawerSection>
      <div className="drawer-inline-note">
        <Icon name="shield" />
        This item has not triggered a notification. Raw chat remains restricted.
      </div>
    </>
  );
}
